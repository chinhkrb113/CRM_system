



import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { AnomalyAlert } from '../../../types';
import { cn } from '../../../lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useI18n } from '../../../hooks/useI18n';

interface AnomalyAlertsProps {
    alerts: AnomalyAlert[];
    onAck: (id: string) => void;
}

function AnomalyAlerts({ alerts, onAck }: AnomalyAlertsProps): React.ReactNode {
    const { t } = useI18n();

    const severityClasses = {
        high: 'border-red-500/50 bg-red-500/10',
        medium: 'border-amber-500/50 bg-amber-500/10',
        low: 'border-blue-500/50 bg-blue-500/10',
    };

    const activeAlerts = alerts.filter(a => !a.acknowledged);

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('anomalyAlerts')}</CardTitle>
                <Button variant="link" size="sm">{t('viewAll')}</Button>
            </CardHeader>
            <CardContent>
                {activeAlerts.length > 0 ? (
                    <ul className="space-y-3">
                        {activeAlerts.map(alert => (
                            <li key={alert.id} className={cn('flex items-start gap-4 p-3 border rounded-lg', severityClasses[alert.severity])}>
                                <AlertTriangle className={cn(
                                    'h-5 w-5 mt-1 flex-shrink-0',
                                    alert.severity === 'high' && 'text-red-500',
                                    alert.severity === 'medium' && 'text-amber-500',
                                    alert.severity === 'low' && 'text-blue-500'
                                    )} />
                                <div className="flex-1">
                                    {alert.link ? (
                                        <Link to={alert.link} className="font-semibold hover:underline">{alert.title}</Link>
                                    ) : (
                                        <p className="font-semibold">{alert.title}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                                    <p className="text-xs text-muted-foreground/80">{new Date(alert.timestamp).toLocaleString()}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => onAck(alert.id)}>
                                    {t('ack')}
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                        <CheckCircle className="h-10 w-10 text-green-500"/>
                        <p>No active alerts. System normal.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default AnomalyAlerts;