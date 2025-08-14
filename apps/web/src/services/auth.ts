// Mock API service for authentication
// In a real application, this would make actual HTTP requests to your backend

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar?: string
  }
  token: string
}

// Mock user data
const MOCK_USER = {
  id: '1',
  email: 'admin@rockket.com',
  name: 'Admin User',
  role: 'admin',
  avatar: undefined,
}

const MOCK_TOKEN = 'mock-jwt-token-12345'

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await delay(1000) // Simulate network delay
    
    // Mock authentication logic
    if (credentials.email === 'admin@rockket.com' && credentials.password === 'password123') {
      return {
        user: MOCK_USER,
        token: MOCK_TOKEN,
      }
    }
    
    throw new Error('Invalid credentials')
  },

  async logout(): Promise<void> {
    await delay(500)
    // In a real app, you might want to invalidate the token on the server
  },

  async refreshToken(_token: string): Promise<string> {
    await delay(500)
    // In a real app, this would refresh the JWT token
    return MOCK_TOKEN
  },

  async getCurrentUser(token: string): Promise<LoginResponse['user']> {
    await delay(500)
    // In a real app, this would fetch user data from the server
    if (token === MOCK_TOKEN) {
      return MOCK_USER
    }
    throw new Error('Invalid token')
  },
}