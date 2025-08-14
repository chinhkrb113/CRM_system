export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  position?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assignedTo?: string
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  lastContactDate?: string
  nextFollowUpDate?: string
  estimatedValue?: number
  probability?: number
}

export type LeadSource = 
  | 'website'
  | 'social_media'
  | 'referral'
  | 'cold_call'
  | 'email_campaign'
  | 'event'
  | 'advertisement'
  | 'other'

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold'

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface LeadFilters {
  search?: string
  status?: LeadStatus[]
  source?: LeadSource[]
  priority?: LeadPriority[]
  assignedTo?: string[]
  dateRange?: {
    from: string
    to: string
  }
  tags?: string[]
}

export interface LeadFormData {
  name: string
  email: string
  phone: string
  company?: string
  position?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assignedTo?: string
  notes?: string
  tags: string[]
  nextFollowUpDate?: string
  estimatedValue?: number
  probability?: number
}