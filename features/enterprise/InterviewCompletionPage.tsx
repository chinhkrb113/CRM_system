




import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { updateInterview } from '../../services/mockApi';
import { InterviewStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';

function InterviewCompletionPage() {
    const { interviewId } = useParams();
    const { t } = useI18n();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const completeInterview = async () => {
            if (interviewId) {
                try {
                    await updateInterview(interviewId, { status: InterviewStatus.COMPLETED });
                    setStatus('success');
                } catch (e) {
                    setStatus('error');
                    console.error("Failed to update interview status:", e);
                }
            } else {
                setStatus('error');
            }
        };
        completeInterview();
    }, [interviewId]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center">
                        {status === 'loading' && 'Updating Interview Status...'}
                        {status === 'success' && t('interviewStatusUpdatedSuccessTitle')}
                        {status === 'error' && 'Update Failed'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-10">
                    {status === 'loading' && <Spinner className="h-16 w-16" />}
                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-24 w-24 text-green-500 mb-4" />
                            <p className="text-center text-muted-foreground">{t('interviewStatusUpdatedSuccessDesc')}</p>
                        </>
                    )}
                    {status === 'error' && (
                         <>
                            <AlertTriangle className="h-24 w-24 text-destructive mb-4" />
                            <p className="text-center text-muted-foreground">Could not update the interview status. The link may be invalid or expired.</p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default InterviewCompletionPage;