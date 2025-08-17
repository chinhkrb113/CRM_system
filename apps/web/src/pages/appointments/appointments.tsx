import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, List, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { AppointmentFiltersComponent } from '@/components/appointments/appointment-filters'
import { AppointmentDialog } from '@/components/appointments/appointment-dialog'
import { ViewAppointmentDialog } from '@/components/appointments/view-appointment-dialog'
import { DeleteAppointmentDialog } from '@/components/appointments/delete-appointment-dialog'
import { getAppointmentStats, getAppointments, appointmentsService } from '@/services/appointments'
import type { Appointment, AppointmentFilters, CalendarView } from '@/types/appointment'
import { useTranslation } from 'react-i18next'

export function Appointments() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [view, setView] = useState<CalendarView>('month')
  const [filters, setFilters] = useState<AppointmentFilters>({})
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: () => getAppointmentStats(),
  })

  // Add state for calendar date
  const [calendarDate, setCalendarDate] = useState(new Date())

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['appointments', filters, view, calendarDate.getFullYear(), calendarDate.getMonth()],
    queryFn: async () => {
      if (view === 'list') {
        return getAppointments(filters)
      } else {
        // For calendar views, use getCalendarView with current calendar date
        const calendarData = await appointmentsService.getCalendarView(
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 1,
          view
        )
        return {
          data: calendarData.appointments,
          meta: {
            total: calendarData.totalCount,
            page: 1,
            limit: calendarData.totalCount,
            totalPages: 1
          }
        }
      }
    },
  })

  const appointments = appointmentsResponse?.data || []
  
  // Debug logging
  console.log('=== APPOINTMENTS DEBUG ===')
  console.log('View:', view)
  console.log('Calendar date:', calendarDate)
  console.log('Query key:', ['appointments', filters, view, calendarDate.getFullYear(), calendarDate.getMonth()])
  console.log('Appointments response:', appointmentsResponse)
  console.log('Appointments data:', appointments)
  console.log('Appointments count:', appointments.length)
  console.log('Is loading:', isLoading)
  console.log('==========================')

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setViewDialogOpen(true)
  }

  const handleCreateAppointment = () => {
    setSelectedAppointment(null)
    setCreateDialogOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setEditDialogOpen(true)
  }

  const handleDeleteAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDeleteDialogOpen(true)
  }

  const handleAppointmentSaved = () => {
    // Refresh appointment stats and calendar data
    queryClient.invalidateQueries({ queryKey: ['appointment-stats'] })
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const handleAppointmentDeleted = () => {
    // Refresh appointment stats and calendar data
    queryClient.invalidateQueries({ queryKey: ['appointment-stats'] })
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
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
        onEditAppointment={handleEditAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        appointments={appointments}
        isLoading={isLoading}
        onDateChange={setCalendarDate}
      />

      {/* Dialogs */}
      <AppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        appointment={null}
        onAppointmentSaved={handleAppointmentSaved}
      />
      
      <AppointmentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        appointment={selectedAppointment}
        onAppointmentSaved={handleAppointmentSaved}
      />
      
      <ViewAppointmentDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        appointment={selectedAppointment}
      />
      
      <DeleteAppointmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        appointment={selectedAppointment}
        onAppointmentDeleted={handleAppointmentDeleted}
      />
    </div>
  )
}