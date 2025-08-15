import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth'
import { jwt } from '@/lib/jwt'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { token, isAuthenticated, clearAuth } = useAuthStore()

  useEffect(() => {
    // Check token validity on app initialization
    if (token && isAuthenticated) {
      if (!jwt.isValid(token)) {
        // Token is invalid or expired, clear auth state
        clearAuth()
      }
    }
  }, [token, isAuthenticated, clearAuth])

  useEffect(() => {
    // Set up token expiration check
    if (token && isAuthenticated && jwt.isValid(token)) {
      const timeUntilExpiration = jwt.getTimeUntilExpiration(token)
      
      // Set a timeout to clear auth when token expires
      const timeoutId = setTimeout(() => {
        clearAuth()
      }, timeUntilExpiration * 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [token, isAuthenticated, clearAuth])

  return <>{children}</>
}