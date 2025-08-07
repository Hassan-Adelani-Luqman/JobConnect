// Environment configuration for the frontend
export const config = {
  // API base URL configuration
  API_BASE_URL: (() => {
    // If we're in development mode
    if (import.meta.env.DEV) {
      return 'http://localhost:5001/api'
    }
    
    // If we're in production
    if (import.meta.env.PROD) {
      // Use relative path - this will use the same domain as the frontend
      return '/api'
    }
    
    // Fallback
    return '/api'
  })(),
  
  // Other configuration options
  APP_NAME: 'JobConnect',
  VERSION: '1.0.0'
}

export default config
