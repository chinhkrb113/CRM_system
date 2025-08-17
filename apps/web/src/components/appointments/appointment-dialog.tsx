import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { appointmentsService, type Appointment, type AppointmentFormData } from '@/services/appointments'
import { useAuthStore } from '@/stores/auth'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import type { AppointmentStatus, MeetingType } from '@/types/appointment'

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  onAppointmentSaved?: (appointment: Appointment) => void
}

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
]

const meetingTypeOptions: { value: MeetingType; label: string }[] = [
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'VIDEO_CALL', label: 'Video Call' },
  { value: 'PHONE_CALL', label: 'Phone Call' },
]

export function AppointmentDialog({ 
  open, 
  onOpenChange, 
  appointment, 
  onAppointmentSaved 
}: AppointmentDialogProps) {
  const { user } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<AppointmentFormData>({
    leadId: '',
    userId: user?.id || '',
    title: '',
    scheduledAt: new Date(),
    duration: 60,
    location: '',
    meetingType: 'VIDEO_CALL',
    status: 'SCHEDULED',
    reminderMinutes: 15,
    outcome: ''
  })

  // Reset form when dialog opens/closes or appointment changes
  useEffect(() => {
    if (open) {
      if (appointment) {
        // Edit mode - populate form with appointment data
        setFormData({
          leadId: appointment.leadId,
          userId: appointment.userId,
          title: appointment.title,
          scheduledAt: new Date(appointment.scheduledAt),
          duration: appointment.duration,
          location: appointment.location || '',
          meetingType: appointment.meetingType,
          status: appointment.status,
          reminderMinutes: appointment.reminderMinutes || 15,
          outcome: appointment.outcome || ''
        })
      } else {
        // Create mode - reset to defaults
        setFormData({
          leadId: '',
          userId: user?.id || '',
          title: '',
          scheduledAt: new Date(),
          duration: 60,
          location: '',
          meetingType: 'VIDEO_CALL',
          status: 'SCHEDULED',
          reminderMinutes: 15,
          outcome: ''
        })
      }
    }
  }, [open, appointment, user?.id])

  const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      showError('Title is required')
      return
    }
    
    if (!formData.leadId.trim()) {
      showError('Lead ID is required')
      return
    }

    setLoading(true)
    
    try {
      let savedAppointment: Appointment
      
      if (appointment) {
        // Update existing appointment
        savedAppointment = await appointmentsService.updateAppointment(appointment.id, formData)
        showSuccess('Appointment updated successfully')
      } else {
        // Create new appointment
        savedAppointment = await appointmentsService.createAppointment(formData.leadId, formData)
        showSuccess('Appointment created successfully')
      }
      
      onAppointmentSaved?.(savedAppointment)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving appointment:', error)
      showError(appointment ? 'Failed to update appointment' : 'Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleDateTimeChange = (value: string) => {
    const date = new Date(value)
    handleInputChange('scheduledAt', date)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Edit Appointment' : 'Create New Appointment'}
          </DialogTitle>
          <DialogDescription>
            {appointment ? 'Update appointment details' : 'Fill in the details to create a new appointment'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter appointment title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="leadId" className="text-sm font-medium">
                Lead ID *
              </label>
              <Input
                id="leadId"
                value={formData.leadId}
                onChange={(e) => handleInputChange('leadId', e.target.value)}
                placeholder="Enter lead ID"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="scheduledAt" className="text-sm font-medium">
                Scheduled Date & Time *
              </label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formatDateTimeLocal(formData.scheduledAt)}
                onChange={(e) => handleDateTimeChange(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
                placeholder="60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="meetingType" className="text-sm font-medium">
                Meeting Type
              </label>
              <Select
                value={formData.meetingType}
                onValueChange={(value: MeetingType) => handleInputChange('meetingType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value: AppointmentStatus) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location or meeting link"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reminderMinutes" className="text-sm font-medium">
                Reminder (minutes before)
              </label>
              <Select
                value={formData.reminderMinutes?.toString() || '15'}
                onValueChange={(value) => handleInputChange('reminderMinutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="1440">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="outcome" className="text-sm font-medium">
              Outcome/Notes
            </label>
            <textarea
              id="outcome"
              value={formData.outcome}
              onChange={(e) => handleInputChange('outcome', e.target.value)}
              placeholder="Enter appointment outcome or notes (optional)"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {appointment ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                appointment ? 'Update Appointment' : 'Create Appointment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}