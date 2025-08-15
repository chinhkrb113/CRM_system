import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import type { LeadFilters, Lead } from '@/services/leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeadsFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

const statusOptions: { value: Lead['status']; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
]

const sourceOptions: { value: Lead['source']; label: string }[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
]

export function LeadsFilters({ filters, onFiltersChange, searchQuery, onSearchChange }: LeadsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilters = (updates: Partial<LeadFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const addStatusFilter = (status: Lead['status']) => {
    const currentStatus = filters.status || []
    if (!currentStatus.includes(status)) {
      updateFilters({ status: [...currentStatus, status] })
    }
  }

  const removeStatusFilter = (status: Lead['status']) => {
    const currentStatus = filters.status || []
    updateFilters({ status: currentStatus.filter(s => s !== status) })
  }

  const addSourceFilter = (source: Lead['source']) => {
    const currentSource = filters.source || []
    if (!currentSource.includes(source)) {
      updateFilters({ source: [...currentSource, source] })
    }
  }

  const removeSourceFilter = (source: Lead['source']) => {
    const currentSource = filters.source || []
    updateFilters({ source: currentSource.filter(s => s !== source) })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onSearchChange?.('')
  }

  const hasActiveFilters = !!(searchQuery || (filters.status && filters.status.length > 0) || (filters.source && filters.source.length > 0))

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
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
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
          </>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-1">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchQuery}
                </Badge>
              )}
              {filters.status?.map((status) => (
                <Badge key={status} variant="secondary" className="text-xs">
                  Status: {statusOptions.find(s => s.value === status)?.label || status}
                </Badge>
              ))}
              {filters.source?.map((source) => (
                <Badge key={source} variant="secondary" className="text-xs">
                  Source: {sourceOptions.find(s => s.value === source)?.label || source}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}