#!/usr/bin/env python3
"""
Script to generate secure SECRET_KEY and JWT_SECRET_KEY for Flask application
"""

import secrets
import os

def generate_secure_key(length=32):
    """Generate a secure random key of specified length (in bytes)"""
    return secrets.token_hex(length)

def main():
    print("🔐 Generating secure keys for your Flask application...\n")
    
    # Generate keys
    secret_key = generate_secure_key(32)  # 32 bytes = 64 hex characters
    jwt_secret_key = generate_secure_key(32)
    
    print(f"SECRET_KEY: {secret_key}")
    print(f"JWT_SECRET_KEY: {jwt_secret_key}")
    
    print("\n" + "="*80)
    print("📋 COPY THESE VALUES TO YOUR RENDER ENVIRONMENT VARIABLES:")
    print("="*80)
    print(f"SECRET_KEY = {secret_key}")
    print(f"JWT_SECRET_KEY = {jwt_secret_key}")
    
    print("\n" + "="*80)
    print("🛠️  FOR LOCAL DEVELOPMENT (.env file):")
    print("="*80)
    print(f"SECRET_KEY={secret_key}")
    print(f"JWT_SECRET_KEY={jwt_secret_key}")
    
    # Optionally save to .env file
    create_env = input("\n❓ Do you want to create a .env file for local development? (y/N): ").lower().strip()
    
    if create_env in ['y', 'yes']:
        env_content = f"""# Flask Application Environment Variables
# Generated on {os.popen('date').read().strip()}

# Flask Secret Keys (Keep these secret!)
SECRET_KEY={secret_key}
JWT_SECRET_KEY={jwt_secret_key}

# Flask Environment
FLASK_ENV=development
FLASK_DEBUG=True

# Database URL (for local development)
# DATABASE_URL=sqlite:///app.db

# Upload settings
# MAX_CONTENT_LENGTH=16777216  # 16MB max file size
"""
        
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created .env file at: {env_path}")
        print("⚠️  Remember to add .env to your .gitignore file!")

if __name__ == "__main__":
    main()
