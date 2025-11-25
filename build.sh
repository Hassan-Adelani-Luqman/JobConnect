#!/bin/bash

# Build script for Render deployment

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

# Run database migrations
echo "Running database migrations..."
cd backend
alembic upgrade head
cd ..

# Change to frontend directory
cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Create static directory if it doesn't exist
mkdir -p ../backend/src/static

# Copy built files to backend static folder
echo "Copying built frontend to backend static folder..."
cp -r dist/* ../backend/src/static/

echo "Build completed successfully!"
