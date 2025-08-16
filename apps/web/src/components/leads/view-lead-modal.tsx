import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Lead } from '@/services/leads'
import { formatDate } from '@/lib/utils'
import { Phone, Mail, Building, Calendar, User, FileText, Target } from 'lucide-react'

interface ViewLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
}

const getStatusVariant = (status: Lead['status']) => {
  switch (status) {
    case 'NEW':
      return 'secondary'
    case 'CONTACTED':
      return 'default'
    case 'QUALIFIED':
      return 'default'
    case 'PROPOSAL_SENT':
      return 'default'
    case 'NEGOTIATION':
      return 'default'
    case 'CLOSED_WON':
      return 'default'
    case 'CLOSED_LOST':
      return 'destructive'
    case 'CONVERTED':
      return 'default'
    case 'LOST':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const formatStatusDisplay = (status: Lead['status']) => {
  switch (status) {
    case 'NEW':
      return 'New'
    case 'CONTACTED':
      return 'Contacted'
    case 'QUALIFIED':
      return 'Qualified'
    case 'PROPOSAL_SENT':
      return 'Proposal Sent'
    case 'NEGOTIATION':
      return 'Negotiation'
    case 'CLOSED_WON':
      return 'Closed Won'
    case 'CLOSED_LOST':
      return 'Closed Lost'
    case 'CONVERTED':
      return 'Converted'
    case 'LOST':
      return 'Lost'
    default:
      return status
  }
}

const formatSourceDisplay = (source: Lead['source']) => {
  switch (source) {
    case 'WEBSITE':
      return 'Website'
    case 'SOCIAL_MEDIA':
      return 'Social Media'
    case 'REFERRAL':
      return 'Referral'
    case 'COLD_CALL':
      return 'Cold Call'
    case 'EMAIL_CAMPAIGN':
      return 'Email Campaign'
    case 'EVENT':
      return 'Event'
    case 'ADVERTISEMENT':
      return 'Advertisement'
    case 'OTHER':
      return 'Other'
    default:
      return source
  }
}

export function ViewLeadModal({ open, onOpenChange, lead }: ViewLeadModalProps) {
  if (!lead) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.firstName} {lead.lastName}
          </DialogTitle>
          <DialogDescription>
            Lead details and contact information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={getStatusVariant(lead.status)}>
                {formatStatusDisplay(lead.status)}
              </Badge>
            </div>
            {lead.score && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{lead.score}/100</span>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                </div>
              </div>
              {lead.company && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Source</p>
                <p className="text-sm text-muted-foreground">{formatSourceDisplay(lead.source)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">{formatDate(lead.updatedAt)}</p>
                </div>
              </div>
              {lead.ownerId && (
                <div>
                  <p className="text-sm font-medium">Owner ID</p>
                  <p className="text-sm text-muted-foreground">{lead.ownerId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Notes</h3>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}