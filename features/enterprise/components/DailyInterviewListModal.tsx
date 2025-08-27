import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Interview, InterviewStatus } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';

const statusVariantMap: Record<InterviewStatus, 'success' | 'destructive' | 'secondary' | 'warning' | 'default'> = {
    [InterviewStatus.PENDING]: 'warning',
    [InterviewStatus.ACCEPTED]: 'success',
    [InterviewStatus.DECLINED]: 'destructive',
    [InterviewStatus.COMPLETED]: 'success',
};

interface DailyInterviewListModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    interviews: Interview[];
}

function DailyInterviewListModal({ isOpen, onClose, date, interviews }: DailyInterviewListModalProps) {
    const { t, language } = useI18n();
    const navigate = useNavigate();
    
    const handleViewDetails = (interviewId: string) => {
        navigate(`/enterprise/interviews/${interviewId}`);
        onClose();
    };

    const formattedDate = date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{t('dailyInterviewsFor', { date: formattedDate })}</DialogTitle>
                <DialogDescription>
                    {interviews.length} {interviews.length === 1 ? 'interview' : 'interviews'} scheduled.
                </DialogDescription>
            </DialogHeader>
            <DialogContent className="max-w-2xl">
                <div className="max-h-[60vh] overflow-y-auto">
                    {interviews.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('candidate')}</TableHead>
                                    <TableHead>{t('time')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {interviews.sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                                .map(interview => (
                                    <TableRow key={interview.id}>
                                        <TableCell className="font-medium">{interview.candidateName}</TableCell>
                                        <TableCell>{new Date(interview.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</TableCell>
                                        <TableCell><Badge variant={statusVariantMap[interview.status]}>{interview.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(interview.id)}>
                                                {t('viewDetails')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">{t('noInterviewsToday')}</p>
                    )}
                </div>
            </DialogContent>
            <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Close</Button>
            </DialogFooter>
        </Dialog>
    );
}
export default DailyInterviewListModal;