from datetime import datetime
from models.user import db

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    skills = db.Column(db.String(500), nullable=True)  # Comma-separated skills
    job_type = db.Column(db.String(50), nullable=False)  # Full-time, Part-time, Contract, etc.
    location = db.Column(db.String(200), nullable=False)
    deadline = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Foreign key to employer (user)
    employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationship to employer
    employer = db.relationship('User', backref=db.backref('jobs', lazy=True))
    
    # Relationship to applications
    applications = db.relationship('Application', backref='job', lazy=True, cascade='all, delete-orphan')
    
    # Relationship to saved jobs
    saved_by = db.relationship('SavedJob', backref='job', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        # Handle skills - check if it's JSON or comma-separated
        skills_list = []
        if self.skills:
            try:
                import json
                # Try to parse as JSON first
                skills_list = json.loads(self.skills) if isinstance(self.skills, str) else self.skills
            except (json.JSONDecodeError, TypeError):
                # Fall back to comma-separated
                skills_list = [s.strip() for s in self.skills.split(',') if s.strip()]
        
        # Get employer name with fallback
        employer_name = None
        if self.employer:
            employer_name = self.employer.company_name or self.employer.email or 'Unknown Company'
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'skills': skills_list,
            'job_type': self.job_type,
            'location': self.location,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'employer_id': self.employer_id,
            'employer_name': employer_name
        }

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default='Applied')  # Applied, Under Review, Accepted, Rejected
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cover_letter = db.Column(db.Text, nullable=True)
    
    # Foreign keys
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    applicant = db.relationship('User', backref=db.backref('applications', lazy=True))
    
    # Unique constraint to prevent duplicate applications
    __table_args__ = (db.UniqueConstraint('job_id', 'applicant_id', name='unique_job_applicant'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'applied_at': self.applied_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'cover_letter': self.cover_letter,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else None,
            'applicant_id': self.applicant_id,
            'applicant_name': f"{self.applicant.first_name} {self.applicant.last_name}" if self.applicant else None,
            'applicant_email': self.applicant.email if self.applicant else None
        }

class SavedJob(db.Model):
    __tablename__ = 'saved_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('saved_jobs', lazy=True))
    
    # Unique constraint to prevent duplicate saves
    __table_args__ = (db.UniqueConstraint('job_id', 'user_id', name='unique_saved_job'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'saved_at': self.saved_at.isoformat(),
            'job_id': self.job_id,
            'user_id': self.user_id,
            'job': self.job.to_dict() if self.job else None
        }

