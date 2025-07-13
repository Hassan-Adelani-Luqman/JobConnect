from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.job import Job, Application
from datetime import datetime
from sqlalchemy import or_, and_

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route("/", methods=["GET"], strict_slashes=False)
def get_jobs():
    try:
        # Get query parameters
        search = request.args.get('search', '').strip()
        location = request.args.get('location', '').strip()
        job_type = request.args.get('job_type', '').strip()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Build query
        query = Job.query.filter_by(is_active=True)
        
        # Apply filters
        if search:
            query = query.filter(
                or_(
                    Job.title.ilike(f'%{search}%'),
                    Job.description.ilike(f'%{search}%'),
                    Job.skills.ilike(f'%{search}%')
                )
            )
        
        if location:
            query = query.filter(Job.location.ilike(f'%{location}%'))
        
        if job_type:
            query = query.filter(Job.job_type.ilike(f'%{job_type}%'))
        
        # Order by creation date (newest first)
        query = query.order_by(Job.created_at.desc())
        
        # Paginate
        jobs = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'jobs': [job.to_dict() for job in jobs.items],
            'total': jobs.total,
            'pages': jobs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch jobs', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    try:
        job = Job.query.get(job_id)
        if not job or not job.is_active:
            return jsonify({'error': 'Job not found'}), 404
        
        return jsonify({'job': job.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch job', 'details': str(e)}), 500

@jobs_bp.route("/", methods=["POST"], strict_slashes=False)
@jwt_required()
def create_job():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'employer':
            return jsonify({'error': 'Only employers can post jobs'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'job_type', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new job
        job = Job(
            title=data['title'].strip(),
            description=data['description'].strip(),
            skills=data.get('skills', ''),
            job_type=data['job_type'].strip(),
            location=data['location'].strip(),
            employer_id=int(current_user_id)
        )
        
        # Parse deadline if provided
        if data.get('deadline'):
            try:
                job.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid deadline format. Use YYYY-MM-DD'}), 400
        
        db.session.add(job)
        db.session.commit()
        
        return jsonify({
            'message': 'Job posted successfully',
            'job': job.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create job', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    try:
        current_user_id = get_jwt_identity()
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if job.employer_id != int(current_user_id):
            return jsonify({'error': 'You can only edit your own jobs'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            job.title = data['title'].strip()
        if 'description' in data:
            job.description = data['description'].strip()
        if 'skills' in data:
            job.skills = data['skills'].strip()
        if 'job_type' in data:
            job.job_type = data['job_type'].strip()
        if 'location' in data:
            job.location = data['location'].strip()
        if 'deadline' in data:
            if data['deadline']:
                try:
                    job.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Invalid deadline format. Use YYYY-MM-DD'}), 400
            else:
                job.deadline = None
        
        job.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Job updated successfully',
            'job': job.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update job', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    try:
        current_user_id = get_jwt_identity()
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if job.employer_id != int(current_user_id):
            return jsonify({'error': 'You can only delete your own jobs'}), 403
        
        job.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete job', 'details': str(e)}), 500

@jobs_bp.route('/my-jobs', methods=['GET'])
@jwt_required()
def get_my_jobs():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'employer':
            return jsonify({'error': 'Only employers can view their jobs'}), 403
        
        jobs = Job.query.filter_by(employer_id=int(current_user_id), is_active=True).order_by(Job.created_at.desc()).all()
        
        return jsonify({'jobs': [job.to_dict() for job in jobs]}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch jobs', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@jwt_required()
def apply_for_job(job_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can apply for jobs'}), 403
        
        job = Job.query.get(job_id)
        if not job or not job.is_active:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if already applied
        existing_application = Application.query.filter_by(job_id=job_id, applicant_id=int(current_user_id)).first()
        if existing_application:
            return jsonify({'error': 'You have already applied for this job'}), 400
        
        # Create application
        application = Application(job_id=job_id, applicant_id=int(current_user_id))
        db.session.add(application)
        db.session.commit()
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to apply for job', 'details': str(e)}), 500

@jobs_bp.route('/my-applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can view their applications'}), 403
        
        applications = Application.query.filter_by(applicant_id=int(current_user_id)).order_by(Application.applied_at.desc()).all()
        
        return jsonify({'applications': [app.to_dict() for app in applications]}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch applications', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>/applications', methods=['GET'])
@jwt_required()
def get_job_applications(job_id):
    try:
        current_user_id = get_jwt_identity()
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if job.employer_id != int(current_user_id):
            return jsonify({'error': 'You can only view applications for your own jobs'}), 403
        
        applications = Application.query.filter_by(job_id=job_id).order_by(Application.applied_at.desc()).all()
        
        return jsonify({'applications': [app.to_dict() for app in applications]}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch applications', 'details': str(e)}), 500

@jobs_bp.route('/applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    try:
        current_user_id = get_jwt_identity()
        application = Application.query.get(application_id)
        
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check if the current user is the employer for this job
        job = Job.query.get(application.job_id)
        if not job or job.employer_id != int(current_user_id):
            return jsonify({'error': 'You can only update applications for your own jobs'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['Applied', 'Under Review', 'Accepted', 'Rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        application.status = new_status
        application.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Application status updated successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update application status', 'details': str(e)}), 500

