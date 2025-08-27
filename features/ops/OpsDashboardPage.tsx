
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useI18n } from '../../hooks/useI18n';
import { getEnrollmentData, getTeamStatusData, getAnomalyAlerts } from '../../services/mockApi';
import EnrollmentChart from './components/EnrollmentChart';
import TeamStatusChart from './components/TeamStatusChart';
import { Skeleton } from '../../components/ui/Skeleton';
import AnomalyAlerts from '../dashboard/components/AnomalyAlerts';
import { AnomalyAlert } from '../../types';

function OpsDashboardPage(): React.ReactNode {
    const { t } = useI18n();
    const [enrollmentData, setEnrollmentData] = useState<any[] | null>(null);
    const [teamStatusData, setTeamStatusData] = useState<any[] | null>(null);
    const [alerts, setAlerts] = useState<AnomalyAlert[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [enrollData, statusData, alertData] = await Promise.all([
                getEnrollmentData(),
                getTeamStatusData(),
                getAnomalyAlerts()
            ]);
            setEnrollmentData(enrollData);
            setTeamStatusData(statusData);
            setAlerts(alertData);
        };
        fetchData();
    }, []);

     const handleAck = (id: string) => {
        setAlerts(prevAlerts => 
        prevAlerts ? prevAlerts.map(a => a.id === id ? { ...a, acknowledged: true } : a) : null
        );
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('opsDashboardTitle')}</h1>
                <p className="text-muted-foreground">{t('opsDashboardDesc')}</p>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t('enrollmentTrends')}</CardTitle>
                        <CardDescription>New student sign-ups over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {enrollmentData ? <EnrollmentChart data={enrollmentData} /> : <Skeleton className="h-[300px]" />}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t('teamProjectStatus')}</CardTitle>
                        <CardDescription>Current distribution of team project statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teamStatusData ? <TeamStatusChart data={teamStatusData} /> : <Skeleton className="h-[300px]" />}
                    </CardContent>
                </Card>
            </div>
             <div>
                {alerts ? (
                <AnomalyAlerts alerts={alerts} onAck={handleAck} />
                ) : (
                <Skeleton className="h-[200px]" />
                )}
            </div>
        </div>
    );
}

export default OpsDashboardPage;