import { useState } from 'react'
import { Plus, Download, Upload } from 'lucide-react'
import type { Lead, LeadFilters } from '@/types/lead'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadsFilters } from '@/components/leads/leads-filters'

export function Leads() {
  const [filters, setFilters] = useState<LeadFilters>({})

  const handleViewLead = (lead: Lead) => {
    console.log('View lead:', lead)
    // TODO: Implement lead detail view
  }

  const handleEditLead = (lead: Lead) => {
    console.log('Edit lead:', lead)
    // TODO: Implement lead edit form
  }

  const handleDeleteLead = (lead: Lead) => {
    console.log('Delete lead:', lead)
    // TODO: Implement lead deletion with confirmation
  }

  const handleCreateLead = () => {
    console.log('Create new lead')
    // TODO: Implement lead creation form
  }

  const handleExportLeads = () => {
    console.log('Export leads')
    // TODO: Implement leads export functionality
  }

  const handleImportLeads = () => {
    console.log('Import leads')
    // TODO: Implement leads import functionality
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
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <LeadsFilters filters={filters} onFiltersChange={setFilters} />

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>
            A comprehensive list of all your leads with their current status and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable
            filters={filters}
            onViewLead={handleViewLead}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
          />
        </CardContent>
      </Card>
    </div>
  )
}