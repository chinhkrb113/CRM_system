// API service for authentication - integrated with api-core

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
    avatar?: string
  }
  token: string
}

// API Core base URL
const API_BASE_URL = 'http://localhost:3001'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const response_data = await response.json()
      
      // Console.log token như yêu cầu
      console.log('🔑 Login successful! Token:', response_data.data.accessToken)
      console.log('👤 User info:', response_data.data.user)
      
      return {
        user: response_data.data.user,
        token: response_data.data.accessToken,
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  },

  async logout(token: string): Promise<void> {
    try {
      console.log('🚪 Logging out...')
      
      // Call refresh token API before logout to invalidate token
      await fetch(`${API_BASE_URL}/api/core/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      // Call logout API to invalidate token on server
      const response = await fetch(`${API_BASE_URL}/api/core/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        console.warn('⚠️ Logout API failed, but continuing with local logout')
      } else {
        console.log('✅ Server logout successful')
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Continue with local logout even if server logout fails
    }
  },

  async refreshToken(token: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('❌ Token refresh error:', error)
      throw error
    }
  },

  async getCurrentUser(token: string): Promise<LoginResponse['user']> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user profile')
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('❌ Get current user error:', error)
      throw error
    }
  },
}