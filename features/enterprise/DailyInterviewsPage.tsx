




import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { getInterviewsForCompany } from '../../services/mockApi';
import { Interview, InterviewStatus } from '../../types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

const statusVariantMap: Record<InterviewStatus, 'success' | 'destructive' | 'secondary' | 'warning' | 'default'> = {
    [InterviewStatus.PENDING]: 'warning',
    [InterviewStatus.ACCEPTED]: 'success',
    [InterviewStatus.DECLINED]: 'destructive',
    [InterviewStatus.COMPLETED]: 'success',
};

function DailyInterviewsPage() {
    const { t, language } = useI18n();
    const { user } = useAuth();
    const { dateString } = useParams();
    const navigate = useNavigate();
    
    const [dailyInterviews, setDailyInterviews] = useState<Interview[] | null>(null);
    const [loading, setLoading] = useState(true);

    const selectedDate = useMemo(() => {
        if (!dateString) return new Date();
        const parts = dateString.split('-');
        // new Date(year, monthIndex, day) - month is 0-indexed
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }, [dateString]);

    useEffect(() => {
        const fetchAndFilterInterviews = async () => {
            if (user?.companyName && dateString) {
                setLoading(true);
                const allInterviews = await getInterviewsForCompany(user.companyName);
                
                const filtered = allInterviews.filter(interview => {
                    const interviewDate = new Date(interview.scheduledTime);
                    return interviewDate.getFullYear() === selectedDate.getFullYear() &&
                           interviewDate.getMonth() === selectedDate.getMonth() &&
                           interviewDate.getDate() === selectedDate.getDate();
                });
                
                setDailyInterviews(filtered.sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()));
                setLoading(false);
            }
        };
        fetchAndFilterInterviews();
    }, [user, dateString, selectedDate]);

    const handleViewDetails = (interviewId: string) => {
        navigate(`/enterprise/interviews/${interviewId}`, { state: { from: `/enterprise/interviews/day/${dateString}` } });
    };

    const formattedDate = selectedDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-6">
            <div>
                <Link to="/enterprise/interviews" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    {t('backToCalendar')}
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{t('dailyInterviewsPageTitle')}</h1>
                <p className="text-muted-foreground">{t('dailyInterviewsPageDesc', { date: formattedDate })}</p>
            </div>
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    {loading ? (
                        <Skeleton className="h-[400px]" />
                    ) : dailyInterviews && dailyInterviews.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('candidate')}</TableHead>
                                    <TableHead>{t('time')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyInterviews.map(interview => (
                                    <TableRow key={interview.id}>
                                        <TableCell className="font-medium">{interview.candidateName}</TableCell>
                                        <TableCell>{new Date(interview.scheduledTime).toLocaleString([], { 
                                            year: 'numeric',
                                            month: '2-digit', 
                                            day: '2-digit',
                                            hour: '2-digit', 
                                            minute: '2-digit'
                                        })}</TableCell>
                                        <TableCell><Badge variant={statusVariantMap[interview.status]}>{interview.status}</Badge></TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(interview.id)}>
                                                {t('viewDetails')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground">
                            <p>{t('noInterviewsToday')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default DailyInterviewsPage;