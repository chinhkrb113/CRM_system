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
import { leadsService, type Lead } from '@/services/leads'
import { useAuthStore } from '@/stores/auth'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface DeleteLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onLeadDeleted?: (leadId: string) => void
}

export function DeleteLeadModal({ open, onOpenChange, lead, onLeadDeleted }: DeleteLeadModalProps) {
  const { token } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleDelete = async () => {
    if (!lead) {
      return
    }

    if (!token) {
      setError('Authentication required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await leadsService.deleteLead(lead.id, token)
        onLeadDeleted?.(lead.id)
        showSuccess(`Lead ${lead.firstName} ${lead.lastName} has been successfully deleted.`)
        onOpenChange(false)
    } catch (error) {
      console.error('Error deleting lead:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete lead'
      showError(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setError('')
    onOpenChange(false)
  }

  if (!lead) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Lead
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the lead and remove all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Lead Information */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-900">
              Lead Details:
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Name:</span> {lead.firstName} {lead.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {lead.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {lead.phone}
              </div>
              {lead.company && (
                <div>
                  <span className="font-medium">Company:</span> {lead.company}
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span> {lead.status}
              </div>
              <div>
                <span className="font-medium">Source:</span> {lead.source}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium">Warning:</div>
                <div>Deleting this lead will permanently remove:</div>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>All lead information and contact details</li>
                  <li>Lead history and activity logs</li>
                  <li>Any associated notes and communications</li>
                  <li>Lead scoring and qualification data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
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
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}