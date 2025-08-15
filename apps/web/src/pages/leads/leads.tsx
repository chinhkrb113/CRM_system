import { useState, useEffect } from 'react'
import { Plus, Download, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadsFilters } from '@/components/leads/leads-filters'
import { CreateLeadModal } from '@/components/leads/create-lead-modal'
import { ViewLeadModal } from '@/components/leads/view-lead-modal'
import { EditLeadModal } from '@/components/leads/edit-lead-modal'
import { DeleteLeadModal } from '@/components/leads/delete-lead-modal'
import { leadsService, type Lead, type LeadFilters, type PaginationParams } from '@/services/leads'
import { useAuthStore } from '@/stores/auth'

export function Leads() {
  const { token } = useAuthStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filters, setFilters] = useState<LeadFilters>({})
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, limit: 10 })
  const [totalPages, setTotalPages] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Fetch leads from API
  const fetchLeads = async () => {
    if (!token) {
      console.log('🔍 No token available for leads')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const searchFilters = {
        ...filters,
        search: searchQuery || undefined,
      }
      
      console.log('📊 Fetching leads with filters:', searchFilters, 'pagination:', pagination)
      const response = await leadsService.getLeads(searchFilters, pagination, token)
      
      setLeads(response.leads)
      setTotalPages(response.pagination.totalPages)
      setTotalLeads(response.pagination.total)
      
      console.log('✅ Leads loaded:', {
        count: response.leads?.length || 0,
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 0,
      })
    } catch (err) {
      console.error('❌ Failed to fetch leads:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  // Load leads on component mount and when filters/pagination change
  useEffect(() => {
    fetchLeads()
  }, [token, filters, pagination, searchQuery])

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setViewModalOpen(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setEditModalOpen(true)
  }

  const handleDeleteLead = (lead: Lead) => {
    setSelectedLead(lead)
    setDeleteModalOpen(true)
  }

  const handleCreateLead = () => {
    setCreateModalOpen(true)
  }

  // Modal event handlers
  const handleLeadCreated = (_newLead: Lead) => {
    // Refresh to get the latest data from server
    fetchLeads()
  }

  const handleLeadUpdated = (_updatedLead: Lead) => {
    // Refresh to get the latest data from server
    fetchLeads()
  }

  const handleLeadDeleted = (_deletedLeadId: string) => {
    // Lead is permanently deleted from database, refresh to update the list
    fetchLeads()
  }

  const handleExportLeads = () => {
    console.log('Export leads')
    // TODO: Implement export functionality
  }

  const handleImportLeads = () => {
    console.log('Import leads')
    // TODO: Implement import functionality
  }

  const handleFiltersChange = (newFilters: LeadFilters) => {
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 }) // Reset to first page when filters change
  }

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleLimitChange = (limit: string) => {
    setPagination({ page: 1, limit: parseInt(limit) }) // Reset to first page when changing limit
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination({ ...pagination, page: 1 }) // Reset to first page when searching
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage and track your sales leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={pagination.limit?.toString() || '10'} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleImportLeads}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportLeads}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateLead}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads on this page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.page || 1} / {totalPages}</div>
            <p className="text-xs text-muted-foreground">
              Current pagination
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.limit || 10}</div>
            <p className="text-xs text-muted-foreground">
              Items per page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <LeadsFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-center">
              <p className="font-medium">Error loading leads</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={fetchLeads}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading leads...
              </div>
            ) : (
              `Showing ${leads?.length || 0} of ${totalLeads} leads`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable
            leads={leads}
            loading={loading}
            pagination={pagination}
            totalPages={totalPages}
            onViewLead={handleViewLead}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateLeadModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onLeadCreated={handleLeadCreated}
      />

      <ViewLeadModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        lead={selectedLead}
      />

      <EditLeadModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        lead={selectedLead}
        onLeadUpdated={handleLeadUpdated}
      />

      <DeleteLeadModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        lead={selectedLead}
        onLeadDeleted={handleLeadDeleted}
      />
    </div>
  )
}