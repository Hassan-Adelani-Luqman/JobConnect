import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import JobSeekerDashboard from './pages/JobSeekerDashboard'
import EmployerDashboard from './pages/EmployerDashboard'
import JobDetailPage from './pages/JobDetailPage'
import ProfilePage from './pages/ProfilePage'
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'job_seeker' ? '/dashboard' : '/employer-dashboard'} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'job_seeker' ? '/dashboard' : '/employer-dashboard'} /> : <RegisterPage />} />
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
