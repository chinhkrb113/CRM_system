




import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { getInterviewById, updateInterview } from '../../services/mockApi';
import { Interview, InterviewStatus } from '../../types';
import { ArrowLeft, User, Briefcase, Calendar, MapPin, UserCheck, CheckCircle, XCircle, HelpCircle, FileText, QrCode, Link as LinkIcon, Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { Textarea } from '../../components/ui/Textarea';
import { Spinner } from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import QRCodeModal from './components/QRCodeModal';

const statusInfoMap: Record<InterviewStatus, { icon: React.ElementType, color: string, variant: 'success' | 'destructive' | 'secondary' | 'warning' }> = {
    [InterviewStatus.PENDING]: { icon: HelpCircle, color: 'text-amber-500', variant: 'warning' },
    [InterviewStatus.ACCEPTED]: { icon: CheckCircle, color: 'text-green-500', variant: 'success' },
    [InterviewStatus.DECLINED]: { icon: XCircle, color: 'text-red-500', variant: 'destructive' },
    [InterviewStatus.COMPLETED]: { icon: CheckCircle, color: 'text-green-500', variant: 'success' },
};

function InterviewDetailPage() {
    const { t } = useI18n();
    const { interviewId } = useParams();
    const { toast } = useToast();
    const location = useLocation();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(true);
    const [evaluationText, setEvaluationText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);


    const fetchInterview = async () => {
        if (interviewId) {
            setLoading(true);
            const data = await getInterviewById(interviewId);
            setInterview(data);
            setEvaluationText(data?.evaluation || '');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterview();
    }, [interviewId]);

    const handleSaveEvaluation = async () => {
        if (!interview) return;
        setIsSaving(true);
        const updatedInterview = await updateInterview(interview.id, {
            evaluation: evaluationText,
            status: InterviewStatus.COMPLETED
        });
        if (updatedInterview) {
            setInterview(updatedInterview);
            toast({
                title: t('evaluationUpdated'),
                description: t('evaluationUpdatedDesc'),
                variant: 'success',
            });
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-6 w-48" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6"><Skeleton className="h-64 w-full" /></div>
                    <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
                </div>
            </div>
        );
    }

    if (!interview) {
        return <div>Interview not found.</div>;
    }

    const StatusIcon = statusInfoMap[interview.status].icon;
    const statusColor = statusInfoMap[interview.status].color;
    
    const completionUrl = `${window.location.origin}${window.location.pathname}#/enterprise/interviews/${interview.id}/complete`;
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(completionUrl);
        toast({
            title: t('linkCopied'),
            variant: 'success'
        });
    };

    const backLink = location.state?.from || '/enterprise/interviews';
    const backLinkText = location.state?.from ? t('backToDailyInterviews') : t('backToCalendar');

    return (
        <>
            <div className="space-y-6">
                <div>
                    <Link to={backLink} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        {backLinkText}
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">{t('interviewDetails')}</h1>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <img src={`https://picsum.photos/seed/${interview.candidateName}/40/40`} alt={interview.candidateName} className="h-10 w-10 rounded-full" />
                                {interview.candidateName}
                            </CardTitle>
                            <CardDescription>{t('candidate')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div><span className="font-semibold">{t('job')}:</span> {interview.jobTitle}</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div><span className="font-semibold">{t('timeSlot')}:</span> {new Date(interview.scheduledTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div><span className="font-semibold">{t('location')}:</span> {interview.location}</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <UserCheck className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div><span className="font-semibold">{t('interviewer')}:</span> {interview.interviewer}</div>
                            </div>
                            <div className="flex items-start gap-3 pt-3 border-t">
                                <StatusIcon className={cn("h-4 w-4 mt-1 flex-shrink-0", statusColor)} />
                                <div><span className="font-semibold">{t('status')}:</span> <Badge variant={statusInfoMap[interview.status].variant}>{interview.status}</Badge></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="lg:col-span-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> {t('evaluation')}</CardTitle>
                            <CardDescription>{t('addYourEvaluation')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={evaluationText}
                                onChange={(e) => setEvaluationText(e.target.value)}
                                placeholder={t('evaluationPlaceholder')}
                                className="min-h-[200px]"
                            />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveEvaluation} disabled={isSaving}>
                                {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                                {t('saveEvaluation')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                 {interview.status !== InterviewStatus.COMPLETED ? (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Mark as Completed</CardTitle>
                            <CardDescription>Use the following link or QR code to mark this interview as completed.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                            <LinkIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 w-full">
                                <Label htmlFor="completion-link">{t('completionLink')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="completion-link" value={completionUrl} readOnly />
                                    <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <Button onClick={() => setIsQrModalOpen(true)}>
                                <QrCode className="mr-2 h-4 w-4" />
                                {t('generateQRCode')}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-lg bg-green-500/10 border-green-500/50">
                        <CardContent className="p-6 flex items-center justify-center gap-4 text-green-700 dark:text-green-400 font-semibold text-lg">
                             <CheckCircle className="h-8 w-8" />
                             {t('interviewCompleted')}
                        </CardContent>
                    </Card>
                )}
            </div>

            <QRCodeModal 
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                url={completionUrl}
            />
        </>
    );
}

export default InterviewDetailPage;