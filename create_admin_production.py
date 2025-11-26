#!/usr/bin/env python3
"""
Create admin user for production
Usage: python create_admin_production.py
"""
import os
import sys

# Add backend src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from flask import Flask
from models.user import db, User
from werkzeug.security import generate_password_hash

def create_admin():
    app = Flask(__name__)
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("Please set it to your production PostgreSQL URL")
        return
    
    # Fix postgres:// to postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        print("🔍 Checking for existing admin user...")
        
        # Check if admin exists
        admin = User.query.filter_by(email='admin@jobconnect.com').first()
        
        if admin:
            print("⚠️  Admin user already exists!")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Active: {admin.is_active}")
            
            # Ask if user wants to reset password
            response = input("\nDo you want to reset the admin password? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                admin.password = generate_password_hash('admin123')
                db.session.commit()
                print("✅ Admin password reset to: admin123")
        else:
            print("📝 Creating new admin user...")
            
            # Create admin user
            admin = User(
                email='admin@jobconnect.com',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                first_name='Admin',
                last_name='User',
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            
            print("\n✅ Admin user created successfully!")
            print("=" * 50)
            print("Admin Credentials:")
            print("-" * 50)
            print("Email:    admin@jobconnect.com")
            print("Password: admin123")
            print("=" * 50)
            print("\n⚠️  IMPORTANT: Change this password after first login!")

if __name__ == '__main__':
    try:
        create_admin()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
