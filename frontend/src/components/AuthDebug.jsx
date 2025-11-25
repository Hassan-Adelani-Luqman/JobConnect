import { useAuth } from '../contexts/AuthContext'

const AuthDebug = () => {
  const { user, loading } = useAuth()
  
  // Only show debug info in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
      <div><strong>Auth Debug:</strong></div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
      {user && (
        <div>
          <div>Email: {user.email}</div>
          <div>Role: {user.role}</div>
          <div>Name: {user.first_name} {user.last_name}</div>
        </div>
      )}
      <div>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</div>
    </div>
  )
}

export default AuthDebug