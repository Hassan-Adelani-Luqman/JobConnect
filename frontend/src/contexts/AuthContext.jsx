import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import config from '../config'
import { parseJwt } from '../lib/authUtils'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Configure axios defaults
axios.defaults.baseURL = config.API_BASE_URL
// Send cookies (refresh token) with requests
axios.defaults.withCredentials = true

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef(null)
  const isRefreshingRef = useRef(false)
  const refreshTokenRef = useRef(null)

  // Define logout function first so it can be used in useEffect
  const logout = useCallback(async (showConfirmation = true) => {
    try {
      // Show confirmation dialog unless explicitly disabled
      if (showConfirmation) {
        const confirmed = window.confirm('Are you sure you want to logout?')
        if (!confirmed) {
          return { success: false, cancelled: true }
        }
      }

      // Call backend logout endpoint
      try {
        await axios.post('/auth/logout')
      } catch (error) {
        // Don't fail logout if backend call fails
        console.warn('Backend logout call failed:', error)
      }
      
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear axios headers
      delete axios.defaults.headers.common['Authorization']
      
      // Clear user state
      setUser(null)
      // Clear any scheduled refresh
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('Logout error:', error)
      // Even if backend call fails, clear local data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      
      return { success: true } // Still successful logout locally
    }
  }, [setUser])

  // `parseJwt` imported from `src/lib/authUtils` to avoid recreating
  // this helper on every Fast Refresh; it returns null on failure.

  // Schedule a token refresh shortly before expiry
  // NOTE: We intentionally omit `refreshToken` from the dependency array to avoid
  // a temporal dead zone error ("Cannot access 'refreshToken' before initialization").
  // The callback only captures `logout`; `refreshToken` is referenced lazily when the
  // timer fires, by which time it has been defined. If refreshToken implementation changes,
  // this function definition will also be re-run on the next render anyway.
  const scheduleTokenRefresh = useCallback((token) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    const payload = parseJwt(token)
    if (!payload?.exp) return

    const expiresAt = payload.exp * 1000
    const now = Date.now()
    const refreshTime = Math.max(expiresAt - now - 60000, 0)

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const fn = refreshTokenRef.current
        if (fn) {
          await fn()
        }
      } catch (err) {
        console.warn('Token refresh failed', err)
        await logout(false)
      }
    }, refreshTime)
  }, [logout])

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  // Refresh token by calling backend; updates stored token and axios header
  const refreshToken = useCallback(async () => {
    // Prevent concurrent refresh calls
    if (isRefreshingRef.current) return null
    isRefreshingRef.current = true
    // Retry with exponential backoff
    const maxRetries = 3
    const baseDelay = 1000 // ms
    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await axios.post('/auth/refresh')
          const newToken = response.data.access_token
          if (newToken) {
            localStorage.setItem('token', newToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            // Update user info after refresh
            try {
              const me = await axios.get('/auth/me')
              setUser(me.data.user)
            } catch (err) {
              console.warn('Failed to refresh user after token refresh', err)
            }
            scheduleTokenRefresh(newToken)
            return newToken
          }
          throw new Error('No token returned')
        } catch (err) {
          const isLast = attempt === maxRetries - 1
          console.warn(`Token refresh attempt ${attempt + 1} failed`, err)
          if (isLast) throw err
          // exponential backoff
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise((res) => setTimeout(res, delay))
        }
      }
    } finally {
      isRefreshingRef.current = false
    }
  }, [scheduleTokenRefresh, setUser])

  // Keep ref pointing to latest refreshToken implementation
  refreshTokenRef.current = refreshToken

  // Set up axios default header and response interceptor for retrying on 401
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      scheduleTokenRefresh(token)
    }

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true
          try {
            const newToken = await refreshToken()
            if (newToken) {
              // Retry original request with new token
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`
              return axios(originalRequest)
            }
          } catch (err) {
            // Refresh failed -> logout locally
            console.warn('Refresh during interceptor failed', err)
            await logout(false)
            return Promise.reject(error)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(responseInterceptor)
      clearScheduledRefresh()
    }
  }, []) // dependencies intentionally empty to run once on mount
  /* eslint-enable react-hooks/exhaustive-deps */

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await axios.get('/auth/me')
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { access_token, user } = response.data
      
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      setUser(user)
      // Schedule token refresh
      try { scheduleTokenRefresh(access_token) } catch { /* ignore */ }
      
      return { success: true, user }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData)
      const { access_token, user } = response.data
      
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      setUser(user)
      // Schedule token refresh
      try { scheduleTokenRefresh(access_token) } catch { /* ignore */ }
      
      return { success: true, user }
    } catch (error) {
      console.error('Registration failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      }
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

