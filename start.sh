#!/bin/bash

# Startup script for Render deployment
cd backend

# Try to use gunicorn first (production server)
if command -v gunicorn &> /dev/null; then
    echo "Starting with gunicorn..."
    gunicorn --bind 0.0.0.0:$PORT src.main:app
else
    echo "Gunicorn not found, starting with Flask built-in server..."
    python -m src.main
fi
