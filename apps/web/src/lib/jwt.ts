// JWT utility functions for token handling
// In a real application, you would use a proper JWT library like 'jsonwebtoken'

export interface JWTPayload {
  sub: string // user id
  email: string
  role: string
  iat: number // issued at
  exp: number // expiration time
}

// Mock JWT functions for demo purposes
export const jwt = {
  /**
   * Decode a JWT token (simplified implementation)
   * In a real app, use a proper JWT library
   */
  decode(token: string): JWTPayload | null {
    try {
      // Simple JWT decode without verification (for demo purposes)
      // In production, use a proper JWT library with signature verification
      if (!token || token === 'null' || token === 'undefined') {
        return null
      }
      
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }
      
      const payload = JSON.parse(atob(parts[1]))
      
      // Map backend JWT structure to our interface
      return {
        sub: payload.id || payload.sub,
        email: payload.email,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      }
    } catch {
      return null
    }
  },

  /**
   * Check if a token is expired
   */
  isExpired(token: string): boolean {
    const payload = this.decode(token)
    if (!payload) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  },

  /**
   * Check if a token is valid
   */
  isValid(token: string): boolean {
    const payload = this.decode(token)
    return payload !== null && !this.isExpired(token)
  },

  /**
   * Get the expiration time of a token
   */
  getExpirationTime(token: string): Date | null {
    const payload = this.decode(token)
    if (!payload) return null
    
    return new Date(payload.exp * 1000)
  },

  /**
   * Get the time remaining until token expires (in seconds)
   */
  getTimeUntilExpiration(token: string): number {
    const payload = this.decode(token)
    if (!payload) return 0
    
    const currentTime = Math.floor(Date.now() / 1000)
    return Math.max(0, payload.exp - currentTime)
  },
}