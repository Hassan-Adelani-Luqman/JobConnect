import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

const LogoutButton = ({ 
  variant = 'outline', 
  size = 'default', 
  className = '', 
  showIcon = true,
  showConfirmation = true,
  redirectTo = '/',
  children 
}) => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const result = await logout(showConfirmation)
      
      if (result.success) {
        // Navigate to specified route after successful logout
        navigate(redirectTo)
      }
      // If cancelled or failed, do nothing (user stays on current page)
      
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if there's an error, try to navigate away for security
      navigate(redirectTo)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={`${className}`}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || 'Logout'}
    </Button>
  )
}

export default LogoutButton