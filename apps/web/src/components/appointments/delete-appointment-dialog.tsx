import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { appointmentsService, type Appointment } from '@/services/appointments'
import { useAuthStore } from '@/stores/auth'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface DeleteAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onAppointmentDeleted?: (appointmentId: string) => void
}

export function DeleteAppointmentDialog({ 
  open, 
  onOpenChange, 
  appointment, 
  onAppointmentDeleted 
}: DeleteAppointmentDialogProps) {
  const { user } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!appointment || !user) {
      return
    }

    setLoading(true)
    
    try {
      await appointmentsService.deleteAppointment(appointment.id)
      showSuccess('Appointment deleted successfully')
      onAppointmentDeleted?.(appointment.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting appointment:', error)
      showError('Failed to delete appointment')
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Appointment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this appointment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium">{appointment.title}</h4>
              <p className="text-sm text-muted-foreground">
                Scheduled: {new Date(appointment.scheduledAt).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Duration: {appointment.duration} minutes
              </p>
              {appointment.location && (
                <p className="text-sm text-muted-foreground">
                  Location: {appointment.location}
                </p>
              )}
            </div>
          </div>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Appointment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}