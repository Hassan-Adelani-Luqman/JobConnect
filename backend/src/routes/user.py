from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
import os
from werkzeug.utils import secure_filename

user_bp = Blueprint('user', __name__)
# pylint: disable=broad-except  # Allow generic exception handling for API endpoints to return JSON errors uniformly

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch profile', 'details': str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update basic fields
        if 'email' in data:
            email = data['email'].lower().strip()
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already taken'}), 400
            user.email = email
        
        # Update role-specific fields
        if user.role == 'job_seeker':
            if 'first_name' in data:
                user.first_name = data['first_name'].strip()
            if 'last_name' in data:
                user.last_name = data['last_name'].strip()
            if 'phone' in data:
                user.phone = data['phone'].strip()
            if 'education' in data:
                user.education = data['education'].strip()
            if 'experience' in data:
                user.experience = data['experience'].strip()
        elif user.role == 'employer':
            if 'company_name' in data:
                user.company_name = data['company_name'].strip()
            if 'company_description' in data:
                user.company_description = data['company_description'].strip()
            if 'company_website' in data:
                user.company_website = data['company_website'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500

@user_bp.route('/upload-resume', methods=['POST'])
@jwt_required()
def upload_resume():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can upload resumes'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add user ID to filename to make it unique
            name, ext = os.path.splitext(filename)
            filename = f"resume_{user.id}_{name}{ext}"
            
            # Save file
            upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # Update user's resume filename
            user.resume_filename = filename
            db.session.commit()
            
            return jsonify({
                'message': 'Resume uploaded successfully',
                'filename': filename
            }), 200
        else:
            return jsonify({'error': 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF'}), 400
        
    except Exception as e:
        return jsonify({'error': 'Failed to upload resume', 'details': str(e)}), 500

def _delete_resume_impl():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.role != 'job_seeker':
        return jsonify({'error': 'Only job seekers can delete resumes'}), 403
    if not user.resume_filename:
        return jsonify({'error': 'No resume to delete'}), 400

    upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    file_path = os.path.join(upload_folder, user.resume_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as rm_err:
            current_app.logger.warning(f"Failed to delete resume file {file_path}: {rm_err}")
    user.resume_filename = None
    db.session.commit()
    return jsonify({'message': 'Resume deleted successfully'}), 200

@user_bp.route('/delete-resume', methods=['DELETE'])
@jwt_required()
def delete_resume():
    """Primary RESTful endpoint to delete resume (DELETE)."""
    try:
        return _delete_resume_impl()
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete resume', 'details': str(err)}), 500

@user_bp.route('/delete-resume', methods=['POST'])
@jwt_required()
def delete_resume_post():
    """Fallback POST endpoint for environments where DELETE may be blocked."""
    try:
        return _delete_resume_impl()
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete resume', 'details': str(err)}), 500

# Accept trailing slash for both methods to avoid 405 from proxies normalizing URLs
@user_bp.route('/delete-resume/', methods=['DELETE','POST'])
@jwt_required()
def delete_resume_slash():
    """Trailing-slash variant for resume deletion supporting DELETE and POST."""
    try:
        return _delete_resume_impl()
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete resume', 'details': str(err)}), 500

@user_bp.route('/upload-logo', methods=['POST'])
@jwt_required()
def upload_logo():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'employer':
            return jsonify({'error': 'Only employers can upload company logos'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add user ID to filename to make it unique
            name, ext = os.path.splitext(filename)
            filename = f"logo_{user.id}_{name}{ext}"
            
            # Save file
            upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # Update user's logo filename
            user.company_logo_filename = filename
            db.session.commit()
            
            return jsonify({
                'message': 'Logo uploaded successfully',
                'filename': filename
            }), 200
        else:
            return jsonify({'error': 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF'}), 400
        
    except Exception as e:
        return jsonify({'error': 'Failed to upload logo', 'details': str(e)}), 500

@user_bp.route('/resume/<filename>', methods=['GET'])
def get_resume(filename):
    try:
        upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
        return send_from_directory(upload_folder, filename)
    except Exception:
        return jsonify({'error': 'File not found'}), 404

@user_bp.route('/logo/<filename>', methods=['GET'])
def get_logo(filename):
    try:
        upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
        return send_from_directory(upload_folder, filename)
    except Exception:
        return jsonify({'error': 'File not found'}), 404

# Admin routes
@user_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = User.query.all()
        return jsonify({'users': [user.to_dict() for user in users]}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch users', 'details': str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Users can view their own profile, admins can view any profile
        if int(current_user_id) != user_id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user', 'details': str(e)}), 500

@user_bp.route('/<int:user_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to deactivate user', 'details': str(e)}), 500
