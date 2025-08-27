



import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Interview, InterviewStatus } from '../../../types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useI18n } from '../../../hooks/useI18n';

const statusVariantMap: Record<InterviewStatus, 'success' | 'destructive' | 'secondary' | 'warning' | 'default'> = {
    [InterviewStatus.PENDING]: 'warning',
    [InterviewStatus.ACCEPTED]: 'success',
    [InterviewStatus.DECLINED]: 'destructive',
    [InterviewStatus.COMPLETED]: 'success',
};

type SortConfig = { key: keyof Interview; direction: 'ascending' | 'descending' };

interface InterviewsTableProps {
    interviews: Interview[] | null;
    requestSort: (key: keyof Interview) => void;
    sortConfig: SortConfig;
}

function InterviewsTable({ interviews, requestSort, sortConfig }: InterviewsTableProps) {
    const { t } = useI18n();
    const navigate = useNavigate();

    const getSortDirection = (key: keyof Interview) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    const handleViewDetails = (interviewId: string) => {
        navigate(`/enterprise/interviews/${interviewId}`);
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('candidateName')} isSorted={getSortDirection('candidateName')}>{t('candidate')}</TableHead>
                    <TableHead onClick={() => requestSort('jobTitle')} isSorted={getSortDirection('jobTitle')}>{t('job')}</TableHead>
                    <TableHead onClick={() => requestSort('scheduledTime')} isSorted={getSortDirection('scheduledTime')}>{t('timeSlot')}</TableHead>
                    <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                    <TableHead onClick={() => requestSort('declineReason')} isSorted={getSortDirection('declineReason')}>{t('declineReasonColumn')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {interviews ? (
                    interviews.map(interview => (
                        <TableRow key={interview.id}>
                            <TableCell className="font-medium">{interview.candidateName}</TableCell>
                            <TableCell>{interview.jobTitle}</TableCell>
                            <TableCell>{new Date(interview.scheduledTime).toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariantMap[interview.status]}>{interview.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[250px] whitespace-normal">
                                {interview.declineReason || ''}
                            </TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(interview.id)}>
                                    {t('viewDetails')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

export default InterviewsTable;