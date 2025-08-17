import { useState, useMemo } from 'react'; // Thêm 'useMemo'
import { ChevronLeft, ChevronRight, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge'; // Import 'BadgeProps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Appointment, CalendarView, AppointmentStatus } from '@/types/appointment'; // Import 'AppointmentStatus'
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AppointmentCalendarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointment: Appointment) => void;
  appointments: Appointment[];
  isLoading?: boolean;
  onDateChange?: (date: Date) => void;
}

// Chuyển các hàm tiện ích ra ngoài component để tránh tạo lại không cần thiết
const getStatusColor = (status: AppointmentStatus) => {
  const colorMap: Record<AppointmentStatus, string> = {
    SCHEDULED: 'bg-blue-500',
    COMPLETED: 'bg-gray-500',
    CANCELLED: 'bg-red-500',
    NO_SHOW: 'bg-orange-500',
  };
  return colorMap[status] || 'bg-gray-500';
};

const getStatusBadgeVariant = (status: AppointmentStatus): BadgeProps['variant'] => {
  const variantMap: Record<AppointmentStatus, BadgeProps['variant']> = {
    SCHEDULED: 'default',
    COMPLETED: 'secondary',
    CANCELLED: 'destructive',
    NO_SHOW: 'destructive',
  };
  return variantMap[status] || 'secondary';
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export function AppointmentCalendar({ view, onViewChange, onAppointmentClick, onEditAppointment, onDeleteAppointment, appointments, isLoading = false, onDateChange }: AppointmentCalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Debug logging
  console.log('AppointmentCalendar - appointments:', appointments);
  console.log('AppointmentCalendar - isLoading:', isLoading);
  console.log('AppointmentCalendar - view:', view);

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      const increment = direction === 'next' ? 1 : -1;
      
      switch (view) {
        case 'month':
          newDate.setMonth(newDate.getMonth() + increment);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (increment * 7));
          break;
        case 'day':
          newDate.setDate(newDate.getDate() + increment);
          break;
      }
      
      // Notify parent about date change
      onDateChange?.(newDate);
      
      return newDate;
    });
  };

  const getDateRangeText = () => {
    switch (view) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week': {
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
      }
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      default:
        return '';
    }
  };

  // Sử dụng useMemo để tránh tính toán lại danh sách appointments không cần thiết
  const filteredAppointments = useMemo(() => {
    switch (view) {
      case 'day': {
        const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(startOfDay.getDate() + 1);
        return appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledAt) >= startOfDay && new Date(apt.scheduledAt) < endOfDay
        );
      }
      case 'week': {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledAt) >= weekStart && new Date(apt.scheduledAt) < weekEnd
        );
      }
      case 'month': {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        return appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledAt) >= monthStart && new Date(apt.scheduledAt) < monthEnd
        );
      }

      default:
        return appointments;
    }
  }, [appointments, view, currentDate]);

  if (isLoading && !appointments.length) { // Chỉ hiển thị loading khi chưa có dữ liệu
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('appointments.calendar')}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border">
              {(['month', 'week', 'day'] as const).map((v) => (
                <Button
                  key={v}
                  variant={view === v ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange(v)}
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                >
                  {t(`appointments.view.${v}`)}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                onDateChange?.(today);
              }}>
                {t('appointments.today')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-lg font-medium text-center">
          {getDateRangeText()}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('appointments.noAppointments')}
            </div>
          ) : (
            <div>
              {view === 'day' && (
                  <div className="space-y-2">
                    {filteredAppointments
                      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                      .map((appointment: Appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onAppointmentClick(appointment)}
                      >
                        <div className={cn('w-3 h-3 rounded-full flex-shrink-0', getStatusColor(appointment.status))} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{appointment.title}</h4>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {t(`appointments.status.${appointment.status}`)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(new Date(appointment.scheduledAt))} ({appointment.duration}min)
                            </div>
                            {appointment.lead && (
                              <span>{appointment.lead.firstName} {appointment.lead.lastName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {onEditAppointment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditAppointment(appointment)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDeleteAppointment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteAppointment(appointment)
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              )}
              
              {view === 'week' && (
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                      const weekStart = new Date(currentDate)
                      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
                      const dayDate = new Date(weekStart)
                      dayDate.setDate(weekStart.getDate() + index)
                      
                      const dayAppointments = filteredAppointments.filter((apt: Appointment) => {
                        const aptDate = new Date(apt.scheduledAt)
                        return aptDate.toDateString() === dayDate.toDateString()
                      })
                      
                      return (
                        <div key={day} className="border rounded-lg p-2 min-h-[120px]">
                          <div className="font-medium text-sm mb-2">
                            {day} {dayDate.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayAppointments.map((appointment: Appointment) => (
                              <div
                                key={appointment.id}
                                className="text-xs p-1 rounded cursor-pointer hover:bg-muted/50"
                                style={{ backgroundColor: getStatusColor(appointment.status) + '20' }}
                                onClick={() => onAppointmentClick(appointment)}
                              >
                                <div className="font-medium truncate">{appointment.title}</div>
                                <div className="text-muted-foreground">
                                  {formatTime(new Date(appointment.scheduledAt))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
              )}
              
              {view === 'month' && (
                  <div className="grid grid-cols-7 gap-1">
                    {/* Header */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center font-medium text-sm border-b">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {(() => {
                      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                      const startDate = new Date(monthStart)
                      startDate.setDate(startDate.getDate() - startDate.getDay())
                      
                      const days = []
                      const current = new Date(startDate)
                      
                      for (let i = 0; i < 42; i++) {
                        const dayAppointments = filteredAppointments.filter((apt: Appointment) => {
                          const aptDate = new Date(apt.scheduledAt)
                          return aptDate.toDateString() === current.toDateString()
                        })
                        
                        const isCurrentMonth = current.getMonth() === currentDate.getMonth()
                        
                        days.push(
                          <div
                            key={current.toISOString()}
                            className={cn(
                              'border p-1 min-h-[80px] text-sm',
                              !isCurrentMonth && 'text-muted-foreground bg-muted/20'
                            )}
                          >
                            <div className="font-medium mb-1">{current.getDate()}</div>
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 2).map((appointment: Appointment) => (
                                <div
                                  key={appointment.id}
                                  className="text-xs p-1 rounded cursor-pointer hover:bg-muted/50 truncate"
                                  style={{ backgroundColor: getStatusColor(appointment.status) + '20' }}
                                  onClick={() => onAppointmentClick(appointment)}
                                  title={appointment.title}
                                >
                                  {appointment.title}
                                </div>
                              ))}
                              {dayAppointments.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayAppointments.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        )
                        
                        current.setDate(current.getDate() + 1)
                      }
                      
                      return days
                    })()}
                  </div>
                )}
               </div>
             )}
        </div>
      </CardContent>
    </Card>
  );
}
