import { useQuery } from '@tanstack/react-query'
import { Eye, Edit, Trash2, Phone, Mail, Building } from 'lucide-react'
import type { Lead, LeadFilters } from '@/types/lead'
import { leadsService } from '@/services/leads'
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
  filters?: LeadFilters
  onViewLead?: (lead: Lead) => void
  onEditLead?: (lead: Lead) => void
  onDeleteLead?: (lead: Lead) => void
}

const getStatusVariant = (status: Lead['status']) => {
  switch (status) {
    case 'new':
      return 'info'
    case 'contacted':
      return 'secondary'
    case 'qualified':
      return 'warning'
    case 'proposal':
      return 'default'
    case 'negotiation':
      return 'warning'
    case 'closed_won':
      return 'success'
    case 'closed_lost':
      return 'destructive'
    case 'on_hold':
      return 'outline'
    default:
      return 'secondary'
  }
}

const getPriorityVariant = (priority: Lead['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'destructive'
    case 'high':
      return 'warning'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'secondary'
  }
}

const formatCurrency = (amount?: number) => {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LeadsTable({ filters, onViewLead, onEditLead, onDeleteLead }: LeadsTableProps) {
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsService.getLeads(filters),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading leads...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading leads</div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No leads found</div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Probability</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-medium">{lead.name}</div>
                {lead.position && (
                  <div className="text-sm text-muted-foreground">{lead.position}</div>
                )}
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
                <Badge variant="outline" className="capitalize">
                  {lead.source.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status)} className="capitalize">
                  {lead.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityVariant(lead.priority)} className="capitalize">
                  {lead.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{formatCurrency(lead.estimatedValue)}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{lead.probability || 0}%</div>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${lead.probability || 0}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{formatDate(lead.nextFollowUpDate)}</div>
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
  )
}