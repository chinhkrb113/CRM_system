import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  avatar?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        console.log('🔐 Auth store: Starting login...')
        set({ isLoading: true })
        try {
          const { authService } = await import('@/services/auth')
          const { user, token } = await authService.login({ email, password })
          console.log('🔐 Auth store: Login response received:', { user, token })

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
          
          console.log('🔐 Auth store: State updated, isAuthenticated:', true)
          console.log('🔐 Auth store: Current state:', _get())
        } catch (error) {
          console.error('🔐 Auth store: Login failed:', error)
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        const currentState = _get()
        const token = currentState.token
        
        try {
          if (token) {
            const { authService } = await import('@/services/auth')
            await authService.logout(token)
          }
        } catch (error) {
          console.error('🔐 Auth store: Logout API failed:', error)
          // Continue with local logout even if API fails
        } finally {
          // Always clear local state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          console.log('🔐 Auth store: Logged out successfully')
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      setToken: (token: string) => {
        set({ token })
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)