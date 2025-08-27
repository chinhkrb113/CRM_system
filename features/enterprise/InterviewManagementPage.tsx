
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { getInterviewsForCompany } from '../../services/mockApi';
import { Interview } from '../../types';
import CalendarView from './components/CalendarView';

function InterviewManagementPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<Interview[] | null>(null);

    useEffect(() => {
        const fetchInterviews = async () => {
            if (user?.companyName) {
                const data = await getInterviewsForCompany(user.companyName);
                setInterviews(data);
            }
        };
        fetchInterviews();
    }, [user]);

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('interviewManagement')}</h1>
                <p className="text-muted-foreground">{t('interviewManagementDesc')}</p>
            </div>
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    {interviews ? (
                        <CalendarView interviews={interviews} />
                    ) : (
                        <Skeleton className="h-[600px]" />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default InterviewManagementPage;
