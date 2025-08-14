import { useState, useMemo } from 'react'; // Thêm 'useMemo'
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge'; // Import 'BadgeProps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAppointments } from '@/services/appointments';
import type { Appointment, CalendarView, AppointmentStatus } from '@/types/appointment'; // Import 'AppointmentStatus'
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AppointmentCalendarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

// Chuyển các hàm tiện ích ra ngoài component để tránh tạo lại không cần thiết
const getStatusColor = (status: AppointmentStatus) => {
  const colorMap: Record<AppointmentStatus, string> = {
    scheduled: 'bg-blue-500',
    confirmed: 'bg-green-500',
    'in-progress': 'bg-yellow-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
    'no-show': 'bg-orange-500',
  };
  return colorMap[status] || 'bg-gray-500';
};

const getStatusBadgeVariant = (status: AppointmentStatus): BadgeProps['variant'] => {
  const variantMap: Record<AppointmentStatus, BadgeProps['variant']> = {
    scheduled: 'default',
    confirmed: 'success',
    'in-progress': 'warning',
    completed: 'secondary',
    cancelled: 'destructive',
    'no-show': 'destructive',
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

export function AppointmentCalendar({ view, onViewChange, onAppointmentClick }: AppointmentCalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => getAppointments(),
    placeholderData: (previousData) => previousData,
  });

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
    const today = new Date();
    
    switch (view) {
      case 'day': {
        const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(startOfDay.getDate() + 1);
        return appointments.filter(apt => 
          new Date(apt.startTime) >= startOfDay && new Date(apt.startTime) < endOfDay
        );
      }
      case 'week': {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return appointments.filter(apt => 
          new Date(apt.startTime) >= weekStart && new Date(apt.startTime) < weekEnd
        );
      }
      case 'month': {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); // Ngày đầu tiên của tháng sau
        return appointments.filter(apt => 
          new Date(apt.startTime) >= monthStart && new Date(apt.startTime) < monthEnd
        );
      }
      case 'list':
        return appointments.filter(apt => new Date(apt.startTime) >= today);
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
              {(['month', 'week', 'day', 'list'] as const).map((v) => ( // Thêm 'as const'
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
            
            {view !== 'list' && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  {t('appointments.today')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {view !== 'list' && (
          <div className="mt-4 text-lg font-medium text-center"> {/* Thêm margin-top */}
            {getDateRangeText()}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {view === 'list' ? (
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('appointments.noAppointments')}
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className={cn('w-3 h-3 rounded-full flex-shrink-0', getStatusColor(appointment.status))} /> {/* Thêm flex-shrink-0 */}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{appointment.title}</h4>
                      <Badge variant={getStatusBadgeVariant(appointment.status)}>
                        {t(`appointments.status.${appointment.status}`)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"> {/* Cho phép wrap */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(new Date(appointment.startTime))} {formatTime(new Date(appointment.startTime))} - {formatTime(new Date(appointment.endTime))}
                      </div>
                      
                      {appointment.leadName && (
                        <span>{appointment.leadName}</span>
                      )}
                      
                      {appointment.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {appointment.location}
                        </div>
                      )}
                      
                      {appointment.meetingLink && (
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {t('appointments.onlineMeeting')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('appointments.calendarViewComingSoon')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
