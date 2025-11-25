import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Menu, X, Shield } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const profileRef = useRef(null)

  const handleLogout = async () => {
    const result = await logout(true) // Show confirmation
    if (result.success) {
      navigate('/')
    }
    // If cancelled, do nothing (user stays on current page)
  }

    const toggleProfileMenu = () => setShowProfileMenu(v => !v)

    // Close profile menu when clicking outside
    useEffect(() => {
      function onDocClick(e) {
        if (profileRef.current && !profileRef.current.contains(e.target)) {
          setShowProfileMenu(false)
        }
      }
      document.addEventListener('click', onDocClick)
      return () => document.removeEventListener('click', onDocClick)
    }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">JobConnect</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to={user.role === 'job_seeker' ? '/dashboard' : '/employer-dashboard'}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                
                {/* Saved Jobs link for job seekers */}
                {user.role === 'job_seeker' && (
                  <Link 
                    to="/saved-jobs"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Saved Jobs
                  </Link>
                )}
                
                {/* User greeting */}
                <span className="text-gray-700 text-sm">
                  Hi, {user.first_name || user.email.split('@')[0]}!
                </span>
                
                {/* Direct logout button - more visible */}
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                
                
                {/* User dropdown menu */}
                {/* Profile menu (simple implementation) */}
                <div className="relative" ref={profileRef}>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={toggleProfileMenu}>
                    <User className="h-4 w-4" />
                  </Button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-md z-50">
                      <div className="p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-sm">
                            {user.role === 'job_seeker' ? `${user.first_name} ${user.last_name}` : user.company_name}
                          </p>
                          <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="border-t">
                        <Link to="/profile" className="block px-3 py-2 hover:bg-gray-50">
                          <Settings className="mr-2 h-4 w-4 inline" /> Profile Settings
                        </Link>
                        {user.role === 'admin' && (
                          <Link to="/admin" className="block px-3 py-2 hover:bg-gray-50">
                            <Shield className="mr-2 h-4 w-4 inline" /> Admin Dashboard
                          </Link>
                        )}
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600">
                          <LogOut className="mr-2 h-4 w-4 inline" /> Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
              {user ? (
                <>
                  {/* User info */}
                  <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <p className="font-medium">
                      {user.role === 'job_seeker' 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.company_name
                      }
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  
                  {/* Dashboard link */}
                  <Link 
                    to={user.role === 'job_seeker' ? '/dashboard' : '/employer-dashboard'}
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  
                  {/* Saved Jobs link for job seekers */}
                  {user.role === 'job_seeker' && (
                    <Link 
                      to="/saved-jobs"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    >
                      Saved Jobs
                    </Link>
                  )}
                  
                  {/* Profile link */}
                  <Link 
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    Profile Settings
                  </Link>
                  
                  {/* Admin Dashboard link (only for admin users) */}
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  
                  {/* Logout button */}
                  <button
                    onClick={() => {
                      closeMobileMenu()
                      handleLogout()
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

