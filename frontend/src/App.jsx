import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import AuthDebug from './components/AuthDebug'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import JobSeekerDashboard from './pages/JobSeekerDashboard'
import EmployerDashboard from './pages/EmployerDashboard'
import JobDetailPage from './pages/JobDetailPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import SavedJobsPage from './pages/SavedJobsPage'
import './App.css'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />
  }
  
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  
  const getUserDashboardPath = (role) => {
    switch (role) {
      case 'job_seeker': return '/dashboard'
      case 'employer': return '/employer-dashboard'
      case 'admin': return '/admin'
      default: return '/'
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Remove AuthDebug for cleaner UI */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to={getUserDashboardPath(user.role)} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={getUserDashboardPath(user.role)} /> : <RegisterPage />} />
        <Route path="/job/:id" element={<JobDetailPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['job_seeker']}>
              <JobSeekerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employer-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/saved-jobs" 
          element={
            <ProtectedRoute allowedRoles={['job_seeker']}>
              <SavedJobsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
