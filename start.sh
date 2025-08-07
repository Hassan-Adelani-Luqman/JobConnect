#!/bin/bash

# Startup script for JobConnect on Render
echo "🚀 Starting JobConnect application..."

# Get the port from environment or default to 5001
PORT=${PORT:-5001}

# Change to backend directory
cd backend

echo "📍 Current directory: $(pwd)"
echo "🐍 Python version: $(python --version)"
echo "📦 Checking for gunicorn..."

# Try to use gunicorn first (production server)
if command -v gunicorn &> /dev/null; then
    echo "✅ Starting with gunicorn on port $PORT..."
    exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 src.main:app
else
    echo "⚠️  Gunicorn not found, starting with Flask built-in server on port $PORT..."
    exec python -m src.main
fi
