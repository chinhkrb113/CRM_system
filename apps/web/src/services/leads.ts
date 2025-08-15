import type { Lead, LeadFilters, LeadFormData, LeadSource, LeadStatus, LeadPriority } from '@/types/lead'

// Mock data
const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0123',
    company: 'Tech Corp',
    position: 'CTO',
    source: 'website',
    status: 'qualified',
    priority: 'high',
    assignedTo: 'user1',
    notes: 'Interested in enterprise solution',
    tags: ['enterprise', 'tech'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    lastContactDate: '2024-01-20T14:30:00Z',
    nextFollowUpDate: '2024-01-25T09:00:00Z',
    estimatedValue: 50000,
    probability: 75
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@startup.io',
    phone: '+1-555-0124',
    company: 'StartupIO',
    position: 'Founder',
    source: 'referral',
    status: 'new',
    priority: 'medium',
    assignedTo: 'user2',
    notes: 'Referred by existing client',
    tags: ['startup', 'referral'],
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
    nextFollowUpDate: '2024-01-22T10:00:00Z',
    estimatedValue: 25000,
    probability: 50
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mbrown@bigcorp.com',
    phone: '+1-555-0125',
    company: 'BigCorp Inc',
    position: 'VP Sales',
    source: 'cold_call',
    status: 'contacted',
    priority: 'low',
    assignedTo: 'user1',
    notes: 'Initial contact made, needs follow-up',
    tags: ['enterprise', 'sales'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-16T16:00:00Z',
    lastContactDate: '2024-01-16T16:00:00Z',
    nextFollowUpDate: '2024-01-23T14:00:00Z',
    estimatedValue: 75000,
    probability: 30
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@consulting.com',
    phone: '+1-555-0126',
    company: 'Davis Consulting',
    position: 'Managing Director',
    source: 'social_media',
    status: 'proposal',
    priority: 'urgent',
    assignedTo: 'user2',
    notes: 'Proposal sent, awaiting response',
    tags: ['consulting', 'proposal'],
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-19T12:00:00Z',
    lastContactDate: '2024-01-19T12:00:00Z',
    nextFollowUpDate: '2024-01-24T11:00:00Z',
    estimatedValue: 100000,
    probability: 80
  },
  {
    id: '5',
    name: 'Robert Wilson',
    email: 'rwilson@manufacturing.com',
    phone: '+1-555-0127',
    company: 'Wilson Manufacturing',
    position: 'Operations Manager',
    source: 'event',
    status: 'closed_won',
    priority: 'high',
    assignedTo: 'user1',
    notes: 'Deal closed successfully',
    tags: ['manufacturing', 'closed'],
    createdAt: '2023-12-20T10:00:00Z',
    updatedAt: '2024-01-15T15:00:00Z',
    lastContactDate: '2024-01-15T15:00:00Z',
    estimatedValue: 60000,
    probability: 100
  }
]

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const leadsService = {
  // Get all leads with optional filters
  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    await delay(500)
    
    let filteredLeads = [...mockLeads]
    
    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filteredLeads = filteredLeads.filter(lead => 
          lead.name.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search) ||
          lead.company?.toLowerCase().includes(search)
        )
      }
      
      if (filters.status && filters.status.length > 0) {
        filteredLeads = filteredLeads.filter(lead => filters.status!.includes(lead.status))
      }
      
      if (filters.source && filters.source.length > 0) {
        filteredLeads = filteredLeads.filter(lead => filters.source!.includes(lead.source))
      }
      
      if (filters.priority && filters.priority.length > 0) {
        filteredLeads = filteredLeads.filter(lead => filters.priority!.includes(lead.priority))
      }
      
      if (filters.assignedTo && filters.assignedTo.length > 0) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.assignedTo && filters.assignedTo!.includes(lead.assignedTo)
        )
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filteredLeads = filteredLeads.filter(lead => 
          filters.tags!.some(tag => lead.tags.includes(tag))
        )
      }
    }
    
    return filteredLeads
  },
  
  // Get single lead by ID
  async getLead(id: string): Promise<Lead | null> {
    await delay(300)
    return mockLeads.find(lead => lead.id === id) || null
  },
  
  // Create new lead
  async createLead(data: LeadFormData): Promise<Lead> {
    await delay(500)
    
    const newLead: Lead = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockLeads.unshift(newLead)
    return newLead
  },
  
  // Update existing lead
  async updateLead(id: string, data: Partial<LeadFormData>): Promise<Lead> {
    await delay(500)
    
    const leadIndex = mockLeads.findIndex(lead => lead.id === id)
    if (leadIndex === -1) {
      throw new Error('Lead not found')
    }
    
    const updatedLead = {
      ...mockLeads[leadIndex],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    mockLeads[leadIndex] = updatedLead
    return updatedLead
  },
  
  // Delete lead
  async deleteLead(id: string): Promise<void> {
    await delay(300)
    
    const leadIndex = mockLeads.findIndex(lead => lead.id === id)
    if (leadIndex === -1) {
      throw new Error('Lead not found')
    }
    
    mockLeads.splice(leadIndex, 1)
  },
  
  // Get lead statistics
  async getLeadStats(): Promise<{
    total: number
    byStatus: Record<LeadStatus, number>
    bySource: Record<LeadSource, number>
    byPriority: Record<LeadPriority, number>
  }> {
    await delay(200)
    
    const stats = {
      total: mockLeads.length,
      byStatus: {} as Record<LeadStatus, number>,
      bySource: {} as Record<LeadSource, number>,
      byPriority: {} as Record<LeadPriority, number>
    }
    
    mockLeads.forEach(lead => {
      stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1
      stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1
      stats.byPriority[lead.priority] = (stats.byPriority[lead.priority] || 0) + 1
    })
    
    return stats
  }
}