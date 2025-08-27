
import React from 'react';
import { Lead, LeadTier, LeadStatus } from '../../../types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Spinner } from '../../../components/ui/Spinner';
import { useI18n } from '../../../hooks/useI18n';
import { cn } from '../../../lib/utils';

const tierVariantMap: Record<LeadTier, 'high' | 'medium' | 'low'> = {
    [LeadTier.HIGH]: 'high',
    [LeadTier.MEDIUM]: 'medium',
    [LeadTier.LOW]: 'low',
};

const statusColorMap: Record<LeadStatus, string> = {
    [LeadStatus.NEW]: 'bg-blue-500',
    [LeadStatus.WORKING]: 'bg-yellow-500',
    [LeadStatus.QUALIFIED]: 'bg-green-500',
    [LeadStatus.UNQUALIFIED]: 'bg-gray-500',
};

type SortConfig = { key: keyof Lead; direction: 'ascending' | 'descending' };

interface UnassignedLeadsTableProps {
    leads: Lead[] | null;
    onClaim: (lead: Lead) => void;
    claimingId: string | null;
    requestSort: (key: keyof Lead) => void;
    sortConfig: SortConfig;
}

function UnassignedLeadsTable({ leads, onClaim, claimingId, requestSort, sortConfig }: UnassignedLeadsTableProps): React.ReactNode {
    const { t } = useI18n();

    const getSortDirection = (key: keyof Lead) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>{t('name')}</TableHead>
                    <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                    <TableHead onClick={() => requestSort('tier')} isSorted={getSortDirection('tier')}>{t('tier')}</TableHead>
                    <TableHead onClick={() => requestSort('score')} isSorted={getSortDirection('score')}>{t('score')}</TableHead>
                    <TableHead onClick={() => requestSort('source')} isSorted={getSortDirection('source')}>{t('source')}</TableHead>
                    <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('created')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {leads ? (
                    leads.map(lead => {
                        const isClaiming = claimingId === lead.id;
                        return (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">
                                    <div className="font-semibold">{lead.name}</div>
                                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("h-2 w-2 rounded-full", statusColorMap[lead.status])}></span>
                                        <span>{lead.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant={tierVariantMap[lead.tier]}>{lead.tier}</Badge></TableCell>
                                <TableCell>{lead.score}</TableCell>
                                <TableCell>{lead.source}</TableCell>
                                <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => onClaim(lead)} disabled={isClaiming}>
                                        {isClaiming && <Spinner className="mr-2 h-4 w-4" />}
                                        {isClaiming ? t('claiming') : t('claim')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

export default UnassignedLeadsTable;