from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'job_seeker', 'employer', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Job Seeker specific fields
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    education = db.Column(db.Text, nullable=True)
    experience = db.Column(db.Text, nullable=True)
    resume_filename = db.Column(db.String(255), nullable=True)
    
    # Employer specific fields
    company_name = db.Column(db.String(200), nullable=True)
    company_description = db.Column(db.Text, nullable=True)
    company_logo_filename = db.Column(db.String(255), nullable=True)
    company_website = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        base_dict = {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'education': self.education,
            'experience': self.experience,
            'resume_filename': self.resume_filename,
            'company_name': self.company_name,
            'company_description': self.company_description,
            'company_logo_filename': self.company_logo_filename,
            'company_website': self.company_website
        }
        return base_dict
