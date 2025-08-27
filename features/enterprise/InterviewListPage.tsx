
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { getInterviewsForCompany } from '../../services/mockApi';
import { Interview } from '../../types';
import InterviewsTable from './components/InterviewsTable';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof Interview; direction: SortDirection };

function InterviewListPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<Interview[] | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'scheduledTime', direction: 'descending' });

    useEffect(() => {
        const fetchInterviews = async () => {
            if (user?.companyName) {
                const data = await getInterviewsForCompany(user.companyName);
                setInterviews(data);
            }
        };
        fetchInterviews();
    }, [user]);
    
    const sortedInterviews = useMemo(() => {
        if (!interviews) return null;
        const sortableItems = [...interviews];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            if (valA == null) return 1;
            if (valB == null) return -1;
            
            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [interviews, sortConfig]);

    const requestSort = (key: keyof Interview) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('interviewList')}</h1>
                <p className="text-muted-foreground">{t('interviewListDesc')}</p>
            </div>
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    {interviews ? (
                        <InterviewsTable interviews={sortedInterviews} requestSort={requestSort} sortConfig={sortConfig} />
                    ) : (
                        <Skeleton className="h-[400px]" />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default InterviewListPage;