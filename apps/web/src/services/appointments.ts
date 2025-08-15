import type { Appointment, AppointmentFilters, AppointmentFormData, AppointmentStats, AppointmentStatus } from '@/types/appointment'

// Mock data
const mockAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Consultation with John Doe',
    description: 'Initial consultation for study abroad program',
    startTime: new Date('2024-01-15T09:00:00'),
    endTime: new Date('2024-01-15T10:00:00'),
    status: 'scheduled',
    type: 'consultation',
    leadId: '1',
    leadName: 'John Doe',
    attendees: ['john.doe@email.com', 'advisor@company.com'],
    location: 'Office Room 101',
    notes: 'Interested in UK universities',
    createdAt: new Date('2024-01-10T08:00:00'),
    updatedAt: new Date('2024-01-10T08:00:00'),
  },
  {
    id: '2',
    title: 'Interview - Jane Smith',
    description: 'Scholarship interview',
    startTime: new Date('2024-01-15T14:00:00'),
    endTime: new Date('2024-01-15T15:30:00'),
    status: 'confirmed',
    type: 'interview',
    leadId: '2',
    leadName: 'Jane Smith',
    attendees: ['jane.smith@email.com'],
    meetingLink: 'https://zoom.us/j/123456789',
    notes: 'Scholarship application review',
    createdAt: new Date('2024-01-08T10:00:00'),
    updatedAt: new Date('2024-01-12T16:00:00'),
  },
  {
    id: '3',
    title: 'Follow-up Meeting',
    description: 'Document review and next steps',
    startTime: new Date('2024-01-16T11:00:00'),
    endTime: new Date('2024-01-16T12:00:00'),
    status: 'completed',
    type: 'follow-up',
    leadId: '3',
    leadName: 'Mike Johnson',
    attendees: ['mike.johnson@email.com'],
    location: 'Conference Room A',
    notes: 'Documents submitted successfully',
    createdAt: new Date('2024-01-05T09:00:00'),
    updatedAt: new Date('2024-01-16T12:00:00'),
  },
  {
    id: '4',
    title: 'University Presentation',
    description: 'Presentation about Canadian universities',
    startTime: new Date('2024-01-17T15:00:00'),
    endTime: new Date('2024-01-17T16:30:00'),
    status: 'scheduled',
    type: 'presentation',
    attendees: ['group@email.com'],
    location: 'Main Hall',
    notes: 'Group presentation for 20 students',
    createdAt: new Date('2024-01-12T14:00:00'),
    updatedAt: new Date('2024-01-12T14:00:00'),
  },
  {
    id: '5',
    title: 'Cancelled Consultation',
    description: 'Student cancelled due to schedule conflict',
    startTime: new Date('2024-01-14T10:00:00'),
    endTime: new Date('2024-01-14T11:00:00'),
    status: 'cancelled',
    type: 'consultation',
    leadId: '4',
    leadName: 'Sarah Wilson',
    attendees: ['sarah.wilson@email.com'],
    notes: 'Rescheduled for next week',
    createdAt: new Date('2024-01-08T15:00:00'),
    updatedAt: new Date('2024-01-13T09:00:00'),
  },
]

// API functions
export const getAppointments = async (filters?: AppointmentFilters): Promise<Appointment[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  let filteredAppointments = [...mockAppointments]
  
  if (filters) {
    if (filters.status) {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === filters.status)
    }
    
    if (filters.type) {
      filteredAppointments = filteredAppointments.filter(apt => apt.type === filters.type)
    }
    
    if (filters.leadId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.leadId === filters.leadId)
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.title.toLowerCase().includes(searchLower) ||
        apt.description?.toLowerCase().includes(searchLower) ||
        apt.leadName?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.dateRange) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.startTime >= filters.dateRange!.start && apt.startTime <= filters.dateRange!.end
      )
    }
  }
  
  return filteredAppointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

export const getAppointment = async (id: string): Promise<Appointment | null> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockAppointments.find(apt => apt.id === id) || null
}

export const createAppointment = async (data: AppointmentFormData): Promise<Appointment> => {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const newAppointment: Appointment = {
    id: Math.random().toString(36).substr(2, 9),
    ...data,
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  mockAppointments.push(newAppointment)
  return newAppointment
}

export const updateAppointment = async (id: string, data: Partial<AppointmentFormData>): Promise<Appointment> => {
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const index = mockAppointments.findIndex(apt => apt.id === id)
  if (index === -1) {
    throw new Error('Appointment not found')
  }
  
  mockAppointments[index] = {
    ...mockAppointments[index],
    ...data,
    updatedAt: new Date(),
  }
  
  return mockAppointments[index]
}

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus): Promise<Appointment> => {
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const index = mockAppointments.findIndex(apt => apt.id === id)
  if (index === -1) {
    throw new Error('Appointment not found')
  }
  
  mockAppointments[index] = {
    ...mockAppointments[index],
    status,
    updatedAt: new Date(),
  }
  
  return mockAppointments[index]
}

export const deleteAppointment = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const index = mockAppointments.findIndex(apt => apt.id === id)
  if (index === -1) {
    throw new Error('Appointment not found')
  }
  
  mockAppointments.splice(index, 1)
}

export const getAppointmentStats = async (): Promise<AppointmentStats> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return {
    total: mockAppointments.length,
    scheduled: mockAppointments.filter(apt => apt.status === 'scheduled').length,
    completed: mockAppointments.filter(apt => apt.status === 'completed').length,
    cancelled: mockAppointments.filter(apt => apt.status === 'cancelled').length,
    upcomingToday: mockAppointments.filter(apt => 
      apt.status === 'scheduled' && 
      apt.startTime >= today && 
      apt.startTime < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    ).length,
    upcomingWeek: mockAppointments.filter(apt => 
      apt.status === 'scheduled' && 
      apt.startTime >= today && 
      apt.startTime < nextWeek
    ).length,
  }
}