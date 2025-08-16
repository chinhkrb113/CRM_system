import { useState } from 'react'
import { Search, Filter, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AppointmentFilters, AppointmentStatus, AppointmentType } from '@/types/appointment'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface AppointmentFiltersProps {
  filters: AppointmentFilters
  onFiltersChange: (filters: AppointmentFilters) => void
  className?: string
}

export function AppointmentFiltersComponent({ filters, onFiltersChange, className }: AppointmentFiltersProps) {
  const { t } = useTranslation()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search || '')

  const statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: 'scheduled', label: t('appointments.status.scheduled') },
    { value: 'confirmed', label: t('appointments.status.confirmed') },
    { value: 'in-progress', label: t('appointments.status.in-progress') },
    { value: 'completed', label: t('appointments.status.completed') },
    { value: 'cancelled', label: t('appointments.status.cancelled') },
    { value: 'no-show', label: t('appointments.status.no-show') },
  ]

  const typeOptions: { value: AppointmentType; label: string }[] = [
    { value: 'consultation', label: t('appointments.type.consultation') },
    { value: 'interview', label: t('appointments.type.interview') },
    { value: 'meeting', label: t('appointments.type.meeting') },
    { value: 'follow-up', label: t('appointments.type.follow-up') },
    { value: 'presentation', label: t('appointments.type.presentation') },
    { value: 'other', label: t('appointments.type.other') },
  ]

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as AppointmentStatus)
    })
  }

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value === 'all' ? undefined : (value as AppointmentType)
    })
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : undefined
    const currentRange = filters.dateRange || { start: new Date(), end: new Date() }
    
    if (field === 'start') {
      onFiltersChange({
        ...filters,
        dateRange: date ? { ...currentRange, start: date } : undefined
      })
    } else {
      onFiltersChange({
        ...filters,
        dateRange: date ? { ...currentRange, end: date } : undefined
      })
    }
  }

  const clearFilters = () => {
    setSearchValue('')
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count++
    if (filters.type) count++
    if (filters.dateRange) count++
    if (filters.leadId) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('appointments.filters')}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? t('common.simple') : t('common.advanced')}
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('common.clear')}
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
            placeholder={t('appointments.searchPlaceholder')}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('appointments.status.label')}
            </label>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('appointments.type.label')}
            </label>
            <Select
              value={filters.type || 'all'}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('appointments.dateRange.start')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('appointments.dateRange.end')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.search && (
              <Badge variant="outline" className="gap-1">
                {t('common.search')}: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleSearchChange('')}
                />
              </Badge>
            )}
            
            {filters.status && (
              <Badge variant="outline" className="gap-1">
                {t('appointments.status.label')}: {statusOptions.find(s => s.value === filters.status)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleStatusChange('all')}
                />
              </Badge>
            )}
            
            {filters.type && (
              <Badge variant="outline" className="gap-1">
                {t('appointments.type.label')}: {typeOptions.find(t => t.value === filters.type)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleTypeChange('all')}
                />
              </Badge>
            )}
            
            {filters.dateRange && (
              <Badge variant="outline" className="gap-1">
                {t('appointments.dateRange.label')}: {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onFiltersChange({ ...filters, dateRange: undefined })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}