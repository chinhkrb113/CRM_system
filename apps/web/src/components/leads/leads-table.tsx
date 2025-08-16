import { Eye, Edit, Trash2, Phone, Mail, Building, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lead, PaginationParams } from '@/services/leads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LeadsTableProps {
  leads: Lead[]
  loading: boolean
  pagination: PaginationParams
  totalPages: number
  onViewLead?: (lead: Lead) => void
  onEditLead?: (lead: Lead) => void
  onDeleteLead?: (lead: Lead) => void
  onPageChange?: (page: number) => void
}

const getStatusVariant = (status: Lead['status']) => {
  switch (status) {
    case 'NEW':
      return 'secondary'
    case 'CONTACTED':
      return 'default'
    case 'QUALIFIED':
      return 'warning'
    case 'PROPOSAL_SENT':
      return 'default'
    case 'NEGOTIATION':
      return 'warning'
    case 'CLOSED_WON':
      return 'success'
    case 'CLOSED_LOST':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getSourceVariant = (source: Lead['source']) => {
  switch (source) {
    case 'WEBSITE':
      return 'default'
    case 'SOCIAL_MEDIA':
      return 'secondary'
    case 'EMAIL_CAMPAIGN':
      return 'outline'
    case 'COLD_CALL':
      return 'default'
    case 'REFERRAL':
      return 'success'
    case 'EVENT':
      return 'warning'
    case 'ADVERTISEMENT':
      return 'secondary'
    case 'OTHER':
      return 'secondary'
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
    case 'EMAIL_CAMPAIGN':
      return 'Email Campaign'
    case 'COLD_CALL':
      return 'Cold Call'
    case 'REFERRAL':
      return 'Referral'
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

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LeadsTable({ 
  leads, 
  loading, 
  pagination, 
  totalPages, 
  onViewLead, 
  onEditLead, 
  onDeleteLead, 
  onPageChange 
}: LeadsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading leads...</span>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No leads found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or create a new lead
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="font-medium">
                    {lead.firstName} {lead.lastName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{lead.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {lead.company ? (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{lead.company}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getSourceVariant(lead.source)}>
                    {formatSourceDisplay(lead.source)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(lead.status)}>
                    {formatStatusDisplay(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.score ? (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{lead.score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(lead.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewLead?.(lead)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditLead?.(lead)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteLead?.(lead)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page || 1} of {totalPages} ({leads?.length || 0} items)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(1)}
              disabled={(pagination.page || 1) <= 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if ((pagination.page || 1) <= 3) {
                  pageNum = i + 1;
                } else if ((pagination.page || 1) >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = (pagination.page || 1) - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={(pagination.page || 1) === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(totalPages)}
              disabled={(pagination.page || 1) >= totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}