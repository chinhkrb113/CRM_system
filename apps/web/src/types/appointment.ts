export interface Appointment {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  type: AppointmentType
  leadId?: string
  leadName?: string
  attendees: string[]
  location?: string
  meetingLink?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'

export type AppointmentType = 
  | 'consultation'
  | 'interview'
  | 'meeting'
  | 'follow-up'
  | 'presentation'
  | 'other'

export interface AppointmentFilters {
  status?: AppointmentStatus
  type?: AppointmentType
  dateRange?: {
    start: Date
    end: Date
  }
  leadId?: string
  search?: string
}

export interface AppointmentFormData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: AppointmentType
  leadId?: string
  attendees: string[]
  location?: string
  meetingLink?: string
  notes?: string
}

export interface AppointmentStats {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  upcomingToday: number
  upcomingWeek: number
}

export type CalendarView = 'month' | 'week' | 'day' | 'list'