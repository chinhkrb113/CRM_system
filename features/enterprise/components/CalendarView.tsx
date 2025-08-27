import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Interview } from '../../../types';
import { cn } from '../../../lib/utils';
import { useI18n } from '../../../hooks/useI18n';

interface CalendarViewProps {
    interviews: Interview[];
}

function CalendarView({ interviews }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { t } = useI18n();
    const navigate = useNavigate();

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };
    
    const handleDayClick = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        navigate(`/enterprise/interviews/day/${dateString}`);
    };

    const renderHeader = () => {
        const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });
        return (
            <div className="flex items-center justify-between p-2 mb-4">
                <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                    {dateFormat.format(currentDate)}
                </h2>
                <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {days.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
        );
    };
    
    const renderCells = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - monthStart.getDay());
        const endDate = new Date(monthEnd);
        endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

        const rows = [];
        let days = [];
        let day = new Date(startDate);
        const today = new Date();

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = new Date(day);
                const isCurrentMonth = cloneDay.getMonth() === currentDate.getMonth();
                const isToday = cloneDay.toDateString() === today.toDateString();

                const hasInterviews = interviews.some(interview => 
                    new Date(interview.scheduledTime).toDateString() === cloneDay.toDateString()
                );

                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            "relative flex flex-col h-28 border-t border-r p-1 overflow-hidden",
                            !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                            i === 0 && "border-l",
                            hasInterviews && "cursor-pointer hover:bg-muted transition-colors duration-200"
                        )}
                         onClick={hasInterviews ? () => handleDayClick(cloneDay) : undefined}
                    >
                        <span className={cn("text-xs font-semibold self-end p-1 rounded-full w-6 h-6 flex items-center justify-center", isToday && "bg-primary text-primary-foreground")}>
                            {cloneDay.getDate()}
                        </span>
                         {hasInterviews && (
                            <div className="flex-1 flex items-center justify-center p-1" aria-hidden="true">
                               <div className="bg-primary/10 text-primary font-semibold text-xs rounded-md p-1 leading-tight text-center w-full">
                                    {t('hasInterviews')}
                               </div>
                            </div>
                        )}
                    </div>
                );
                day.setDate(day.getDate() + 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7 border-b">
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };


    return (
        <div>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}

export default CalendarView;