import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/DropdownMenu';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { getNotifications, markNotificationAsRead } from '../services/mockApi';
import { Notification } from '../types';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/Skeleton';
import InterviewDetailsModal from './InterviewDetailsModal';

function NotificationBell() {
    const { user } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[] | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);


    const fetchNotifications = async () => {
        if (user) {
            const data = await getNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markNotificationAsRead(notification.id).then(() => fetchNotifications());
        }

        if (notification.link) {
            navigate(notification.link);
        } else if (notification.interviewId) {
            setSelectedInterviewId(notification.interviewId);
        }
    };
    
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                        <Bell className="h-[1.2rem] w-[1.2rem]" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 md:w-96">
                    <div className="flex items-center justify-between p-2">
                        <h4 className="font-semibold">{t('notifications')}</h4>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="max-h-80 overflow-y-auto">
                        {notifications === null ? (
                            <div className="p-2 space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground p-4">
                                {t('noNotifications')}
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn("flex items-start gap-3 whitespace-normal h-auto cursor-pointer", !notification.isRead && "bg-muted/50")}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", !notification.isRead ? "bg-primary" : "bg-transparent")}></div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{t(notification.titleKey)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t(notification.messageKey, notification.messageParams)}
                                        </p>
                                        <p className="text-xs text-muted-foreground/80 mt-1">
                                            {new Date(notification.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <InterviewDetailsModal
                isOpen={!!selectedInterviewId}
                onClose={() => setSelectedInterviewId(null)}
                interviewId={selectedInterviewId}
            />
        </>
    );
}

export default NotificationBell;