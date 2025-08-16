// API service for leads management - integrated with api-core

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  jobTitle?: string
  status:
    | 'NEW'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'CONVERTED'
    | 'LOST'
    | 'PROPOSAL_SENT'
    | 'NEGOTIATION'
    | 'CLOSED_WON'
    | 'CLOSED_LOST'
  source:   
  | 'WEBSITE'
  | 'SOCIAL_MEDIA'
  | 'EMAIL_CAMPAIGN'
  | 'COLD_CALL'
  | 'REFERRAL'
  | 'EVENT'
  | 'ADVERTISEMENT'
  | 'OTHER';
  score?: number
  ownerId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CreateLeadRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  jobTitle?: string
  source: Lead['source']
  notes?: string
}

interface UpdateLeadRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  status?: Lead['status']
  source?: Lead['source']
  notes?: string
}

interface LeadFilters {
  status?: Lead['status'][]
  source?: Lead['source'][]
  ownerId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  scoreMin?: number
  scoreMax?: number
}

interface PaginationParams {
  page?: number
  limit?: number
}

interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface LeadStats {
  total: number
  byStatus: Record<Lead['status'], number>
  bySource: Record<Lead['source'], number>
  averageScore: number
  recentlyCreated: number
}

// API Core base URL
const API_BASE_URL = 'http://localhost:3001'

export const leadsService = {
  /**
   * Get leads with pagination and filters
   */
  async getLeads(
    filters: LeadFilters = {},
    pagination: PaginationParams = {},
    token: string
  ): Promise<LeadsResponse> {
    try {
      const params = new URLSearchParams()

      // Add pagination
      if (pagination.page) params.append('page', pagination.page.toString())
      if (pagination.limit) params.append('limit', pagination.limit.toString())

      // Add filters
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => params.append('status', status))
      }
      if (filters.source && filters.source.length > 0) {
        filters.source.forEach(source => params.append('source', source))
      }
      if (filters.ownerId) params.append('ownerId', filters.ownerId)
      if (filters.search) params.append('q', filters.search)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.scoreMin)
        params.append('scoreMin', filters.scoreMin.toString())
      if (filters.scoreMax)
        params.append('scoreMax', filters.scoreMax.toString())

      const response = await fetch(`${API_BASE_URL}/api/core/leads?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch leads')
      }

      const data = await response.json()
      return {
        leads: data.data || [],
        pagination: data.meta || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      }
    } catch (error) {
      console.error('❌ Get leads error:', error)
      throw error
    }
  },

  /**
   * Get lead by ID
   */
  async getLeadById(id: string, token: string): Promise<Lead> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/leads/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch lead')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('❌ Get lead by ID error:', error)
      throw error
    }
  },

  /**
   * Create new lead
   */
  async createLead(leadData: CreateLeadRequest, token: string): Promise<Lead> {
    console.log('🚀 Creating lead with data:', {
      ...leadData,
      timestamp: new Date().toISOString()
    })
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })
  
      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))
  
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: leadData
        })
        
        // Tạo thông báo lỗi chi tiết hơn
        let errorMessage = errorData.message || 'Failed to create lead'
        
        // Nếu có chi tiết lỗi validation, thêm vào thông báo
        if (errorData.details && errorData.details.errors) {
          const validationErrors = errorData.details.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ')
          errorMessage += ` - ${validationErrors}`
        }
        
        throw new Error(errorMessage)
      }
  
      const data = await response.json()
      console.log('✅ Lead created successfully:', {
        leadId: data.data?.id,
        leadData: data.data,
        responseTime: new Date().toISOString()
      })
      return data.data
    } catch (error) {
      console.error('❌ Create lead error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestData: leadData,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  },

  /**
   * Update lead
   */
  async updateLead(
    id: string,
    updateData: UpdateLeadRequest,
    token: string
  ): Promise<Lead> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/leads/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update lead')
      }

      const data = await response.json()
      console.log('✅ Lead updated successfully:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Update lead error:', error)
      throw error
    }
  },

  /**
   * Delete lead
   */
  async deleteLead(id: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/core/leads/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete lead')
      }

      console.log('✅ Lead deleted successfully')
    } catch (error) {
      console.error('❌ Delete lead error:', error)
      throw error
    }
  },

  /**
   * Update lead score
   */
  async updateLeadScore(
    id: string,
    score: number,
    token: string
  ): Promise<Lead> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/core/leads/${id}/score`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ score }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update lead score')
      }

      const data = await response.json()
      console.log('✅ Lead score updated successfully:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Update lead score error:', error)
      throw error
    }
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(
    id: string,
    status: Lead['status'],
    token: string
  ): Promise<Lead> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/core/leads/${id}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update lead status')
      }

      const data = await response.json()
      console.log('✅ Lead status updated successfully:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Update lead status error:', error)
      throw error
    }
  },

  /**
   * Assign lead to user
   */
  async assignLead(id: string, ownerId: string, token: string): Promise<Lead> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/core/leads/${id}/assign`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ownerId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to assign lead')
      }

      const data = await response.json()
      console.log('✅ Lead assigned successfully:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Assign lead error:', error)
      throw error
    }
  },

  /**
   * Convert lead
   */
  async convertLead(id: string, token: string): Promise<Lead> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/core/leads/${id}/convert`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to convert lead')
      }

      const data = await response.json()
      console.log('✅ Lead converted successfully:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Convert lead error:', error)
      throw error
    }
  },

  /**
   * Get lead statistics
   */
  async getLeadStats(
    dateFrom?: string,
    dateTo?: string,
    token?: string
  ): Promise<LeadStats> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(
        `${API_BASE_URL}/api/core/leads/stats?${params}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch lead stats')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('❌ Get lead stats error:', error)
      throw error
    }
  },
}

export type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFilters,
  PaginationParams,
  LeadsResponse,
  LeadStats,
}
