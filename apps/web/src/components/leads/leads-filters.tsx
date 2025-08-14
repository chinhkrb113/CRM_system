import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import type { LeadFilters, LeadStatus, LeadSource, LeadPriority } from '@/types/lead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeadsFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'event', label: 'Event' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' },
]

const priorityOptions: { value: LeadPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function LeadsFilters({ filters, onFiltersChange }: LeadsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilters = (updates: Partial<LeadFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const addStatusFilter = (status: LeadStatus) => {
    const currentStatus = filters.status || []
    if (!currentStatus.includes(status)) {
      updateFilters({ status: [...currentStatus, status] })
    }
  }

  const removeStatusFilter = (status: LeadStatus) => {
    const currentStatus = filters.status || []
    updateFilters({ status: currentStatus.filter(s => s !== status) })
  }

  const addSourceFilter = (source: LeadSource) => {
    const currentSource = filters.source || []
    if (!currentSource.includes(source)) {
      updateFilters({ source: [...currentSource, source] })
    }
  }

  const removeSourceFilter = (source: LeadSource) => {
    const currentSource = filters.source || []
    updateFilters({ source: currentSource.filter(s => s !== source) })
  }

  const addPriorityFilter = (priority: LeadPriority) => {
    const currentPriority = filters.priority || []
    if (!currentPriority.includes(priority)) {
      updateFilters({ priority: [...currentPriority, priority] })
    }
  }

  const removePriorityFilter = (priority: LeadPriority) => {
    const currentPriority = filters.priority || []
    updateFilters({ priority: currentPriority.filter(p => p !== priority) })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = !!(filters.search || filters.status?.length || filters.source?.length || filters.priority?.length)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value || undefined })}
            className="pl-10"
          />
        </div>

        {/* Quick Status Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isSelected = filters.status?.includes(option.value)
              return (
                <Badge
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    isSelected 
                      ? removeStatusFilter(option.value)
                      : addStatusFilter(option.value)
                  }
                >
                  {option.label}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              )
            })}
          </div>
        </div>

        {showAdvanced && (
          <>
            {/* Source Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <div className="flex flex-wrap gap-2">
                {sourceOptions.map((option) => {
                  const isSelected = filters.source?.includes(option.value)
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => 
                        isSelected 
                          ? removeSourceFilter(option.value)
                          : addSourceFilter(option.value)
                      }
                    >
                      {option.label}
                      {isSelected && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Priority Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => {
                  const isSelected = filters.priority?.includes(option.value)
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => 
                        isSelected 
                          ? removePriorityFilter(option.value)
                          : addPriorityFilter(option.value)
                      }
                    >
                      {option.label}
                      {isSelected && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.search}
                </Badge>
              )}
              {filters.status?.map((status) => (
                <Badge key={status} variant="secondary" className="text-xs">
                  Status: {statusOptions.find(s => s.value === status)?.label}
                </Badge>
              ))}
              {filters.source?.map((source) => (
                <Badge key={source} variant="secondary" className="text-xs">
                  Source: {sourceOptions.find(s => s.value === source)?.label}
                </Badge>
              ))}
              {filters.priority?.map((priority) => (
                <Badge key={priority} variant="secondary" className="text-xs">
                  Priority: {priorityOptions.find(p => p.value === priority)?.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}