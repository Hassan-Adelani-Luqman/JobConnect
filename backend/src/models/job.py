from datetime import datetime
from src.models.user import db

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
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'skills': self.skills.split(',') if self.skills else [],
            'job_type': self.job_type,
            'location': self.location,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'employer_id': self.employer_id,
            'employer_name': self.employer.company_name if self.employer else None
        }

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default='Applied')  # Applied, Under Review, Accepted, Rejected
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else None,
            'applicant_id': self.applicant_id,
            'applicant_name': f"{self.applicant.first_name} {self.applicant.last_name}" if self.applicant else None,
            'applicant_email': self.applicant.email if self.applicant else None
        }

