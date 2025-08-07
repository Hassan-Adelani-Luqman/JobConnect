# Deployment Guide for JobConnect on Render

## Prerequisites
- GitHub repository with your JobConnect code
- Render account (free tier available)

## Deployment Steps

### Method 1: Using Render Dashboard (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Login to Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login with your GitHub account

3. **Create a New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the JobConnect repository

4. **Configure the Service**:
   - **Name**: `jobconnect-app` (or your preferred name)
   - **Environment**: `Python`
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt && cd frontend && npm install && npm run build && mkdir -p ../backend/src/static && cp -r dist/* ../backend/src/static/
     ```
   - **Start Command**: 
     ```bash
     cd backend && gunicorn --bind 0.0.0.0:$PORT src.main:app
     ```
   - **Plan**: Free (or choose paid for better performance)

5. **Set Environment Variables**:
   - Add these environment variables in Render dashboard:
     - `FLASK_ENV`: `production`
     - `SECRET_KEY`: Generate a secure random string
     - `JWT_SECRET_KEY`: Generate another secure random string

6. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - You'll get a URL like: `https://jobconnect-app.onrender.com`

### Method 2: Using render.yaml (Infrastructure as Code)

1. **The render.yaml file is already created** in your project root
2. **Connect Repository**: In Render dashboard, choose "Blueprint" and connect your repo
3. **Render will automatically detect** the render.yaml and set up the service

## Important Notes

### Database Considerations
- **Current Setup**: Uses SQLite (file-based database)
- **Production Recommendation**: Consider upgrading to PostgreSQL for better performance
- **Data Persistence**: Files on Render's free tier are ephemeral (get deleted on restarts)

### To Upgrade to PostgreSQL:
1. Add PostgreSQL service in Render
2. Update your Flask app to use PostgreSQL connection string
3. Add `psycopg2-binary` to requirements.txt

### File Uploads
- **Current Setup**: Stores files locally in `uploads/` folder
- **Production Issue**: Files will be lost on service restarts
- **Recommendation**: Use cloud storage (AWS S3, Cloudinary, etc.)

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check if all dependencies are in package.json and requirements.txt
   - Ensure Node.js version compatibility

2. **App Doesn't Start**:
   - Check logs in Render dashboard
   - Verify start command is correct

3. **Static Files Not Loading**:
   - Ensure build command copies frontend dist to backend static folder
   - Check Flask static folder configuration

4. **Database Issues**:
   - SQLite file gets recreated on each deployment
   - Consider migrating to PostgreSQL for persistent data

## Cost Optimization

### Free Tier Limitations:
- Service sleeps after 15 minutes of inactivity
- 750 hours per month (shared across all free services)
- Limited resources

### To Stay Within Free Limits:
- Use efficient build commands
- Optimize your React build size
- Consider upgrading to paid plan for production apps

## Monitoring
- Use Render dashboard to monitor:
  - Deploy logs
  - Runtime logs
  - Service metrics
  - Uptime status

## Manual Testing After Deployment
1. Visit your deployed URL
2. Test user registration/login
3. Test job posting and searching
4. Test file uploads (note: files won't persist on free tier)
5. Check browser console for any errors

## Next Steps for Production
1. Set up custom domain
2. Configure SSL (automatically handled by Render)
3. Set up monitoring and alerts
4. Implement proper logging
5. Add environment-specific configurations
6. Set up CI/CD pipeline for automated deployments
