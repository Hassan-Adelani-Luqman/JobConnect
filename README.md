# JobConnect - Job Board Platform

JobConnect is a comprehensive job board platform that connects job seekers with employers. Built with React.js frontend and Flask backend, it provides a complete solution for job posting, searching, and application management.

## 🌐 Live Demo

**Deployed Application:** https://e5h6i7c0ewk9.manus.space

## ✨ Features

### For Job Seekers
- **User Registration & Authentication** - Create account with email and password
- **Profile Management** - Complete profile with education, experience, and contact information
- **Resume Upload** - Upload and manage resume files (PDF, DOC, DOCX, TXT)
- **Job Search & Filtering** - Search jobs by title, location, company, and job type
- **Job Applications** - Apply for jobs and track application status
- **Application Dashboard** - View all applications and their current status

### For Employers
- **Company Profile** - Create detailed company profiles with description and logo
- **Job Posting** - Post detailed job listings with requirements and deadlines
- **Application Management** - Review and manage job applications
- **Application Status Updates** - Update application status (Applied, Under Review, Accepted, Rejected)
- **Employer Dashboard** - Manage multiple job postings from one interface

### General Features
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Real-time Updates** - Dynamic content loading and status updates
- **Secure Authentication** - JWT-based authentication with password hashing
- **File Upload Support** - Resume and company logo upload functionality
- **Professional UI** - Modern design with Tailwind CSS and shadcn/ui components

## 🛠 Technology Stack

### Frontend
- **React.js** - Modern JavaScript framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide Icons** - Beautiful icon library
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin resource sharing
- **SQLite** - Lightweight database
- **Werkzeug** - Password hashing and file uploads

## 📁 Project Structure

```
JobConnect/
├── backend/                 # Flask backend application
│   ├── src/
│   │   ├── models/         # Database models
│   │   │   ├── user.py     # User model
│   │   │   └── job.py      # Job and Application models
│   │   ├── routes/         # API routes
│   │   │   ├── auth.py     # Authentication routes
│   │   │   ├── user.py     # User management routes
│   │   │   └── jobs.py     # Job management routes
│   │   ├── static/         # Static files (built frontend)
│   │   ├── uploads/        # File uploads directory
│   │   ├── database/       # SQLite database
│   │   └── main.py         # Flask application entry point
│   ├── venv/               # Python virtual environment
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main App component
│   ├── dist/               # Built frontend files
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
└── README.md               # Project documentation
```

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd JobConnect/backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask server:**
   ```bash
   python src/main.py
   ```

   The backend will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd JobConnect/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Building for Production

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Copy built files to Flask static directory:**
   ```bash
   cp -r frontend/dist/* backend/src/static/
   ```

3. **Run Flask server** - it will serve both API and frontend

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `email` - User email (unique)
- `password_hash` - Hashed password
- `role` - User role (job_seeker/employer)
- `first_name`, `last_name` - Personal information
- `phone` - Contact information
- `education`, `experience` - Job seeker profile
- `company_name`, `company_description`, `company_website` - Employer profile
- `resume_filename`, `company_logo_filename` - File uploads
- `created_at` - Registration timestamp

### Jobs Table
- `id` - Primary key
- `title` - Job title
- `description` - Job description
- `skills` - Required skills (JSON array)
- `job_type` - Employment type
- `location` - Job location
- `deadline` - Application deadline
- `employer_id` - Foreign key to Users
- `created_at`, `updated_at` - Timestamps

### Applications Table
- `id` - Primary key
- `job_id` - Foreign key to Jobs
- `applicant_id` - Foreign key to Users
- `status` - Application status
- `applied_at` - Application timestamp

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-resume` - Upload resume
- `POST /api/users/upload-logo` - Upload company logo

### Job Management
- `GET /api/jobs` - Get all jobs (with search/filter)
- `POST /api/jobs` - Create new job (employers only)
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job (employers only)
- `DELETE /api/jobs/{id}` - Delete job (employers only)
- `GET /api/jobs/my-jobs` - Get employer's jobs
- `POST /api/jobs/{id}/apply` - Apply for job
- `GET /api/jobs/my-applications` - Get user's applications
- `GET /api/jobs/{id}/applications` - Get job applications (employers only)
- `PUT /api/jobs/applications/{id}/status` - Update application status

## 🔒 Security Features

- **Password Hashing** - Secure password storage using Werkzeug
- **JWT Authentication** - Stateless authentication tokens
- **CORS Protection** - Configured for secure cross-origin requests
- **Input Validation** - Server-side validation for all inputs
- **File Upload Security** - Restricted file types and secure storage

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface
- **Responsive Layout** - Mobile-first design approach
- **Interactive Components** - Smooth animations and transitions
- **Accessibility** - Proper ARIA labels and keyboard navigation
- **Loading States** - User feedback during operations
- **Error Handling** - Graceful error messages and recovery

## 🚀 Deployment

The application is deployed using Manus deployment services:

- **Backend Deployment** - Flask application with integrated frontend
- **Database** - SQLite database with automatic initialization
- **Static Files** - Served directly from Flask
- **HTTPS** - Secure connection with SSL certificate

## 📝 Usage Instructions

### For Job Seekers

1. **Register** - Create an account with email and password
2. **Complete Profile** - Add education, experience, and contact information
3. **Upload Resume** - Upload your resume in PDF, DOC, or DOCX format
4. **Search Jobs** - Use filters to find relevant opportunities
5. **Apply** - Submit applications with one click
6. **Track Applications** - Monitor application status in your dashboard

### For Employers

1. **Register** - Create an employer account
2. **Company Profile** - Add company information and logo
3. **Post Jobs** - Create detailed job listings with requirements
4. **Manage Applications** - Review and update application status
5. **Track Postings** - Monitor job performance and applications

## 🤝 Contributing

This project was built as a complete job board solution. For modifications or enhancements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is built for demonstration purposes. Feel free to use and modify as needed.

## 🆘 Support

For questions or issues:
- Check the deployed application: https://e5h6i7c0ewk9.manus.space
- Review the code structure and comments
- Test the API endpoints using the provided documentation

---

**Built with ❤️ using React.js, Flask, and modern web technologies**

