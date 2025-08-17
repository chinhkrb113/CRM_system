import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Appointment } from '@/services/appointments'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock, MapPin, Video, Phone, User, FileText, Bell } from 'lucide-react'

interface ViewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'SCHEDULED':
      return 'default'
    case 'COMPLETED':
      return 'secondary'
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'destructive'
    default:
      return 'default'
  }
}

function formatStatusDisplay(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'Scheduled'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    case 'NO_SHOW':
      return 'No Show'
    default:
      return status
  }
}

function formatMeetingTypeDisplay(meetingType: string): string {
  switch (meetingType) {
    case 'IN_PERSON':
      return 'In Person'
    case 'VIDEO_CALL':
      return 'Video Call'
    case 'PHONE_CALL':
      return 'Phone Call'
    default:
      return meetingType
  }
}

function getMeetingTypeIcon(meetingType: string) {
  switch (meetingType) {
    case 'IN_PERSON':
      return <MapPin className="h-4 w-4 text-muted-foreground" />
    case 'VIDEO_CALL':
      return <Video className="h-4 w-4 text-muted-foreground" />
    case 'PHONE_CALL':
      return <Phone className="h-4 w-4 text-muted-foreground" />
    default:
      return <Calendar className="h-4 w-4 text-muted-foreground" />
  }
}

export function ViewAppointmentDialog({ open, onOpenChange, appointment }: ViewAppointmentDialogProps) {
  if (!appointment) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {appointment.title}
          </DialogTitle>
          <DialogDescription>
            Appointment details and information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={getStatusVariant(appointment.status)}>
                {formatStatusDisplay(appointment.status)}
              </Badge>
            </div>
          </div>

          {/* Appointment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Appointment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Scheduled Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.scheduledAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{appointment.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getMeetingTypeIcon(appointment.meetingType)}
                <div>
                  <p className="text-sm font-medium">Meeting Type</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMeetingTypeDisplay(appointment.meetingType)}
                  </p>
                </div>
              </div>
              {appointment.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{appointment.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead and User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Participants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Lead</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.lead ? 
                      `${appointment.lead.firstName} ${appointment.lead.lastName}` : 
                      `Lead ID: ${appointment.leadId}`
                    }
                  </p>
                  {appointment.lead?.email && (
                    <p className="text-xs text-muted-foreground">{appointment.lead.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assigned User</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.user ? 
                      `${appointment.user.firstName} ${appointment.user.lastName}` : 
                      `User ID: ${appointment.userId}`
                    }
                  </p>
                  {appointment.user?.email && (
                    <p className="text-xs text-muted-foreground">{appointment.user.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reminder */}
          {appointment.reminderMinutes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Reminder</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {appointment.reminderMinutes} minutes before the appointment
              </p>
            </div>
          )}

          {/* Outcome/Notes */}
          {appointment.outcome && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Outcome/Notes</h3>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{appointment.outcome}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timestamps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">{formatDate(appointment.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">{formatDate(appointment.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}