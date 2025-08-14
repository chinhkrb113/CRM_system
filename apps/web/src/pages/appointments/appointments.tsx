import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, List, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { AppointmentFiltersComponent } from '@/components/appointments/appointment-filters'
import { getAppointmentStats } from '@/services/appointments'
import type { Appointment, AppointmentFilters, CalendarView } from '@/types/appointment'
import { useTranslation } from 'react-i18next'

export function Appointments() {
  const { t } = useTranslation()
  const [view, setView] = useState<CalendarView>('list')
  const [filters, setFilters] = useState<AppointmentFilters>({})
  const [_selectedAppointment, _setSelectedAppointment] = useState<Appointment | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: getAppointmentStats,
  })

  const handleAppointmentClick = (appointment: Appointment) => {
    _setSelectedAppointment(appointment)
    // TODO: Open appointment detail modal/drawer
    console.log('Selected appointment:', appointment)
  }

  const handleCreateAppointment = () => {
    // TODO: Open create appointment modal/form
    console.log('Create new appointment')
  }



  const handleExportAppointments = () => {
    // TODO: Implement export functionality
    console.log('Export appointments')
  }

  const handleImportAppointments = () => {
    // TODO: Implement import functionality
    console.log('Import appointments')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('appointments.title')}</h1>
          <p className="text-muted-foreground">
            {t('appointments.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportAppointments}>
            {t('appointments.import')}
          </Button>
          <Button variant="outline" onClick={handleExportAppointments}>
            {t('appointments.export')}
          </Button>
          <Button onClick={handleCreateAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            {t('appointments.create')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('appointments.stats.total')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('appointments.stats.scheduled')}
              </CardTitle>
              <List className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('appointments.stats.completed')}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('appointments.stats.cancelled')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('appointments.stats.upcomingToday')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.upcomingToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('appointments.stats.upcomingWeek')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.upcomingWeek}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <AppointmentFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Calendar/List View */}
      <AppointmentCalendar
        view={view}
        onViewChange={setView}
        onAppointmentClick={handleAppointmentClick}
      />

      {/* TODO: Add modals/drawers for */}
      {/* - Create/Edit Appointment Form */}
      {/* - Appointment Detail View */}
      {/* - Delete Confirmation */}
      {/* - Import/Export Dialogs */}
    </div>
  )
}