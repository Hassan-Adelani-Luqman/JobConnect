from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from src.models.user import db, User
from src.models.job import Job, Application, SavedJob
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
        
        # Check if user is authenticated to include saved status
        current_user_id = None
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
        except:
            pass
        
        # Get jobs data with saved status if user is authenticated
        jobs_data = []
        for job in jobs.items:
            job_dict = job.to_dict()
            
            # Add saved status for job seekers
            if current_user_id:
                user = User.query.get(int(current_user_id))
                if user and user.role == 'job_seeker':
                    saved_job = SavedJob.query.filter_by(job_id=job.id, user_id=user.id).first()
                    job_dict['is_saved'] = bool(saved_job)
                else:
                    job_dict['is_saved'] = False
            else:
                job_dict['is_saved'] = False
                
            jobs_data.append(job_dict)
        
        return jsonify({
            'jobs': jobs_data,
            'total': jobs.total,
            'pages': jobs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in get_jobs: {str(e)}")
        print(traceback.format_exc())
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
        
        # Handle skills - accept both array and comma-separated string
        skills = data.get('skills', '')
        if isinstance(skills, list):
            import json
            skills = json.dumps(skills)  # Store as JSON if it's an array
        elif not skills:
            skills = ''
        
        # Create new job
        job = Job(
            title=data['title'].strip(),
            description=data['description'].strip(),
            skills=skills,
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
        # Read optional cover letter from request body
        data = None
        try:
            data = request.get_json()
        except Exception:
            data = None

        cover_letter = None
        if data and isinstance(data, dict):
            cover_letter = data.get('cover_letter')

        # Create application
        application = Application(job_id=job_id, applicant_id=int(current_user_id), cover_letter=cover_letter)
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

# Saved Jobs Endpoints
@jobs_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved_jobs():
    """Get all saved jobs for the current user with pagination"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can save jobs'}), 403
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Query saved jobs with pagination
        saved_jobs_query = SavedJob.query.filter_by(user_id=user.id)\
                                        .join(Job)\
                                        .filter(Job.is_active == True)\
                                        .order_by(SavedJob.saved_at.desc())
        
        saved_jobs = saved_jobs_query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'saved_jobs': [saved_job.to_dict() for saved_job in saved_jobs.items],
            'total': saved_jobs.total,
            'pages': saved_jobs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch saved jobs', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>/save', methods=['POST'])
@jwt_required()
def save_job(job_id):
    """Save a job for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can save jobs'}), 403
        
        # Check if job exists and is active
        job = Job.query.get(job_id)
        if not job or not job.is_active:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if job is already saved
        existing_save = SavedJob.query.filter_by(job_id=job_id, user_id=user.id).first()
        if existing_save:
            return jsonify({'error': 'Job already saved'}), 400
        
        # Create new saved job
        saved_job = SavedJob(job_id=job_id, user_id=user.id)
        db.session.add(saved_job)
        db.session.commit()
        
        return jsonify({
            'message': 'Job saved successfully',
            'saved_job': saved_job.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save job', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>/unsave', methods=['DELETE'])
@jwt_required()
def unsave_job(job_id):
    """Remove a job from saved jobs for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can unsave jobs'}), 403
        
        # Find the saved job
        saved_job = SavedJob.query.filter_by(job_id=job_id, user_id=user.id).first()
        if not saved_job:
            return jsonify({'error': 'Job not found in saved jobs'}), 404
        
        # Remove from saved jobs
        db.session.delete(saved_job)
        db.session.commit()
        
        return jsonify({'message': 'Job removed from saved jobs successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to unsave job', 'details': str(e)}), 500

@jobs_bp.route('/<int:job_id>/is-saved', methods=['GET'])
@jwt_required()
def is_job_saved(job_id):
    """Check if a job is saved by the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'job_seeker':
            return jsonify({'is_saved': False}), 200
        
        # Check if job is saved
        saved_job = SavedJob.query.filter_by(job_id=job_id, user_id=user.id).first()
        
        return jsonify({'is_saved': bool(saved_job)}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to check if job is saved', 'details': str(e)}), 500

