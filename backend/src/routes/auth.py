from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from src.models.user import db, User, RefreshToken
from datetime import datetime, timedelta
import re
import uuid

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@auth_bp.route("/register", methods=["POST"], strict_slashes=False)
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password') or not data.get('role'):
            return jsonify({'error': 'Email, password, and role are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        role = data['role']
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate role
        if role not in ['job_seeker', 'employer']:
            return jsonify({'error': 'Role must be either job_seeker or employer'}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(email=email, role=role)
        user.set_password(password)
        
        # Add role-specific fields
        if role == 'job_seeker':
            user.first_name = data.get('first_name', '').strip()
            user.last_name = data.get('last_name', '').strip()
            user.phone = data.get('phone', '').strip()
        elif role == 'employer':
            user.company_name = data.get('company_name', '').strip()
            user.company_description = data.get('company_description', '').strip()
            user.company_website = data.get('company_website', '').strip()
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))

        # Create refresh token record and set cookie
        refresh_token_value = uuid.uuid4().hex
        expires = datetime.utcnow() + timedelta(days=7)
        rt = RefreshToken(token=refresh_token_value, user_id=user.id, expires_at=expires)
        db.session.add(rt)
        db.session.commit()

        resp = make_response(jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201)
        # HttpOnly cookie for refresh token
        resp.set_cookie('refresh_token', refresh_token_value, httponly=True, samesite='Lax')
        return resp
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@auth_bp.route("/login", methods=["POST"], strict_slashes=False)
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))

        # Create refresh token record and set cookie
        refresh_token_value = uuid.uuid4().hex
        expires = datetime.utcnow() + timedelta(days=7)
        rt = RefreshToken(token=refresh_token_value, user_id=user.id, expires_at=expires)
        db.session.add(rt)
        db.session.commit()

        resp = make_response(jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200)
        resp.set_cookie('refresh_token', refresh_token_value, httponly=True, samesite='Lax')
        return resp
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user info', 'details': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    try:
        refresh_token_value = request.cookies.get('refresh_token')
        if not refresh_token_value:
            return jsonify({'error': 'Refresh token missing'}), 401

        rt = RefreshToken.query.filter_by(token=refresh_token_value, revoked=False).first()
        if not rt:
            return jsonify({'error': 'Invalid refresh token'}), 401

        if rt.expires_at < datetime.utcnow():
            return jsonify({'error': 'Refresh token expired'}), 401

        user = User.query.get(rt.user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401

        # Rotate refresh token: revoke old and issue a new one
        rt.revoked = True
        new_refresh_value = uuid.uuid4().hex
        expires = datetime.utcnow() + timedelta(days=7)
        new_rt = RefreshToken(token=new_refresh_value, user_id=user.id, expires_at=expires)
        db.session.add(new_rt)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        resp = make_response(jsonify({'access_token': access_token}), 200)
        resp.set_cookie('refresh_token', new_refresh_value, httponly=True, samesite='Lax')
        return resp
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Token refresh failed', 'details': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout endpoint - accepts cookie-only logout.
    If a refresh cookie is present it will be revoked.
    This endpoint does not require an Authorization header.
    """
    try:
        # Attempt to revoke by cookie token if present
        refresh_token_value = request.cookies.get('refresh_token')
        if refresh_token_value:
            rt = RefreshToken.query.filter_by(token=refresh_token_value, revoked=False).first()
            if rt:
                rt.revoked = True
                db.session.commit()

        # Also support logout via Authorization header: if an access token
        # is provided we revoke all refresh tokens for that user (best-effort).
        try:
            # verify_jwt_in_request does not raise if no token when optional=True
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                # Revoke any non-revoked refresh tokens for this user
                RefreshToken.query.filter_by(user_id=int(current_user_id), revoked=False).update({'revoked': True})
                db.session.commit()
        except Exception:
            # ignore token parsing/verification errors and continue with cookie-based logout
            pass

        # Clear cookie
        resp = make_response(jsonify({'success': True, 'message': 'Successfully logged out'}), 200)
        resp.set_cookie('refresh_token', '', expires=0)
        return resp
        
    except Exception as e:
        print(f"Logout error: {str(e)}")
        # Even if there's an error, we return success for security
        resp = make_response(jsonify({'success': True, 'message': 'Successfully logged out'}), 200)
        resp.set_cookie('refresh_token', '', expires=0)
        return resp

