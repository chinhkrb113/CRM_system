import type { Appointment, AppointmentFilters, AppointmentFormData, AppointmentStats, AppointmentStatus } from '@/types/appointment'

// API Core base URL
const API_BASE_URL = 'http://localhost:3001'

interface AppointmentsResponse {
  data: Appointment[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

// Helper function to get auth token
const getAuthToken = (): string => {
  // Get token from zustand store persisted in localStorage
  const authStorage = localStorage.getItem('auth-storage')
  if (!authStorage) {
    throw new Error('No authentication data found')
  }
  
  try {
    const parsedAuth = JSON.parse(authStorage)
    const token = parsedAuth.state?.token
    if (!token) {
      throw new Error('No authentication token found')
    }
    return token
  } catch (error) {
    throw new Error('Invalid authentication data')
  }
}

// Helper function to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }
}

export const appointmentsService = {
  /**
   * Get appointments with pagination and filters
   */
  async getAppointments(filters: AppointmentFilters = {}): Promise<AppointmentsResponse> {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()

      // Add pagination
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      // Add filters
      if (filters.status) params.append('status', filters.status)
      if (filters.leadId) params.append('leadId', filters.leadId)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.search) params.append('q', filters.search)

      const response = await fetch(`${API_BASE_URL}/api/core/appointments?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
      const result: ApiResponse<AppointmentsResponse> = await response.json()
      
      // Validate response structure - backend returns {data: [], meta: {}}
      if (!result.data || !Array.isArray(result.data.data)) {
        console.warn('Invalid appointments response structure:', result)
        return {
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        }
      }
      
      // Transform dates
      const transformedData = {
        data: result.data.data.map(appointment => ({
          ...appointment,
          scheduledAt: new Date(appointment.scheduledAt),
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        })),
        meta: result.data.meta
      }

      return transformedData
    } catch (error) {
      console.error('❌ Get appointments error:', error)
      throw error
    }
  },

  /**
   * Get appointment by ID
   */
  async getAppointment(id: string): Promise<Appointment> {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
      const result: ApiResponse<Appointment> = await response.json()
      
      // Transform dates
      return {
        ...result.data,
        scheduledAt: new Date(result.data.scheduledAt),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      }
    } catch (error) {
      console.error('❌ Get appointment error:', error)
      throw error
    }
  },

  /**
   * Create new appointment
   */
  async createAppointment(leadId: string, data: AppointmentFormData): Promise<Appointment> {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/core/leads/${leadId}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          scheduledAt: data.scheduledAt.toISOString(),
          duration: data.duration,
          location: data.location,
          meetingType: data.meetingType,
          reminderMinutes: data.reminderMinutes,
          notes: data.notes,
        }),
      })

      await handleApiError(response)
      const result: ApiResponse<Appointment> = await response.json()
      
      // Transform dates
      return {
        ...result.data,
        scheduledAt: new Date(result.data.scheduledAt),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      }
    } catch (error) {
      console.error('❌ Create appointment error:', error)
      throw error
    }
  },

  /**
   * Update appointment
   */
  async updateAppointment(id: string, data: Partial<AppointmentFormData>): Promise<Appointment> {
    try {
      const token = getAuthToken()
      
      const updateData: any = { ...data }
      if (updateData.scheduledAt) {
        updateData.scheduledAt = updateData.scheduledAt.toISOString()
      }
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      await handleApiError(response)
      const result: ApiResponse<Appointment> = await response.json()
      
      // Transform dates
      return {
        ...result.data,
        scheduledAt: new Date(result.data.scheduledAt),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      }
    } catch (error) {
      console.error('❌ Update appointment error:', error)
      throw error
    }
  },

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      await handleApiError(response)
      const result: ApiResponse<Appointment> = await response.json()
      
      // Transform dates
      return {
        ...result.data,
        scheduledAt: new Date(result.data.scheduledAt),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      }
    } catch (error) {
      console.error('❌ Update appointment status error:', error)
      throw error
    }
  },

  /**
   * Delete appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
    } catch (error) {
      console.error('❌ Delete appointment error:', error)
      throw error
    }
  },

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(dateFrom?: string, dateTo?: string): Promise<AppointmentStats> {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()
      
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/stats?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
      const result: ApiResponse<AppointmentStats> = await response.json()
      
      return result.data
    } catch (error) {
      console.error('❌ Get appointment stats error:', error)
      throw error
    }
  },

  /**
   * Get calendar view of appointments
   */
  async getCalendarView(
    year?: number,
    month?: number,
    view: 'month' | 'week' | 'day' = 'month'
  ): Promise<{
    year: number;
    month: number;
    view: string;
    appointments: Appointment[];
    totalCount: number;
  }> {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()
      
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month.toString())
      if (view) params.append('view', view)
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/calendar?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
      const result: ApiResponse<{
        year: number;
        month: number;
        view: string;
        appointments: Appointment[];
        totalCount: number;
      }> = await response.json()
      
      // Transform dates in appointments
      const transformedData = {
        ...result.data,
        appointments: result.data.appointments.map(appointment => ({
          ...appointment,
          scheduledAt: new Date(appointment.scheduledAt),
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        }))
      }
      
      return transformedData
    } catch (error) {
      console.error('❌ Get calendar view error:', error)
      throw error
    }
  },

  /**
   * Get today's appointments
   */
  async getTodayAppointments(): Promise<Appointment[]> {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/today`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
      const result: ApiResponse<AppointmentsResponse> = await response.json()
      
      // Validate response structure
      if (!result.data || !Array.isArray(result.data.data)) {
        console.warn('Invalid today appointments response structure:', result)
        return []
      }
      
      // Transform dates
      return result.data.data.map(appointment => ({
        ...appointment,
        scheduledAt: new Date(appointment.scheduledAt),
        createdAt: new Date(appointment.createdAt),
        updatedAt: new Date(appointment.updatedAt),
      }))
    } catch (error) {
      console.error('❌ Get today appointments error:', error)
      throw error
    }
  },

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(page = 1, limit = 10): Promise<AppointmentsResponse> {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()
      
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await fetch(`${API_BASE_URL}/api/core/appointments/upcoming?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      await handleApiError(response)
      const result: ApiResponse<AppointmentsResponse> = await response.json()
      
      // Validate response structure
      if (!result.data || !Array.isArray(result.data.data)) {
        console.warn('Invalid upcoming appointments response structure:', result)
        return {
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        }
      }
      
      // Transform dates
      const transformedData = {
        data: result.data.data.map(appointment => ({
          ...appointment,
          scheduledAt: new Date(appointment.scheduledAt),
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        })),
        meta: result.data.meta
      }

      return transformedData
    } catch (error) {
      console.error('❌ Get upcoming appointments error:', error)
      throw error
    }
  }
}

// Legacy exports for backward compatibility
// Export types
export type { Appointment, AppointmentFormData, AppointmentFilters, AppointmentStats, AppointmentStatus } from '@/types/appointment'

// Export service functions
export const getAppointments = appointmentsService.getAppointments
export const getAppointment = appointmentsService.getAppointment
export const createAppointment = appointmentsService.createAppointment
export const updateAppointment = appointmentsService.updateAppointment
export const updateAppointmentStatus = appointmentsService.updateAppointmentStatus
export const deleteAppointment = appointmentsService.deleteAppointment
export const getAppointmentStats = appointmentsService.getAppointmentStats