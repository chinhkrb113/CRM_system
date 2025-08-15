import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  console.log('🛡️ ProtectedRoute: Checking authentication...', {
    isAuthenticated,
    currentPath: location.pathname
  })

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Not authenticated, redirecting to login')
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  console.log('🛡️ ProtectedRoute: Authenticated, rendering children')
  return <>{children}</>
}