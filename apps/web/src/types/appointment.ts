export interface Appointment {
  id: string
  title: string
  description?: string
  scheduledAt: Date
  duration: number // in minutes
  status: AppointmentStatus
  leadId: string
  userId: string
  location?: string
  meetingType: MeetingType
  reminderMinutes?: number
  notes?: string
  outcome?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  lead?: {
    id: string
    firstName: string
    lastName: string
    email: string
    company: string | null
    status: string
  }
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export type AppointmentStatus = 
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type MeetingType = 
  | 'IN_PERSON'
  | 'VIDEO_CALL'
  | 'PHONE_CALL'
  | 'OTHER'

export interface AppointmentFilters {
  status?: AppointmentStatus
  type?: AppointmentType
  leadId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  page?: number
  limit?: number
}

export interface AppointmentFormData {
  title: string
  description?: string
  scheduledAt: Date
  duration: number
  status: AppointmentStatus
  leadId: string
  userId: string
  location?: string
  meetingType: MeetingType
  reminderMinutes?: number
  notes?: string
  outcome?: string
}

export interface AppointmentStats {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  upcomingToday: number
  upcomingWeek: number
}

export type AppointmentType = 
  | 'CONSULTATION'
  | 'INTERVIEW'
  | 'MEETING'
  | 'FOLLOW_UP'
  | 'PRESENTATION'
  | 'OTHER'

export type CalendarView = 'month' | 'week' | 'day' | 'list'