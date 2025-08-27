
import React from 'react';
import { Lead, LeadTier, LeadStatus, UserRole } from '../../../types';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../../components/ui/DropdownMenu';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Eye, FilePenLine, Trash2, Sparkles, BarChart, MoreHorizontal } from 'lucide-react';
import { useI18n } from '../../../hooks/useI18n';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { Spinner } from '../../../components/ui/Spinner';

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

type SortConfig = { key: string; direction: 'ascending' | 'descending' };

interface LeadsTableProps {
    leads: Lead[] | null;
    onView: (lead: Lead) => void;
    onEdit: (lead: Lead) => void;
    onDelete: (leadId: string) => void;
    requestSort: (key: string) => void;
    sortConfig: SortConfig;
    onAnalyze: (leadId: string) => void;
    analyzingId: string | null;
    onShowAnalysis: (lead: Lead) => void;
}

export function LeadsTable({ 
    leads, 
    onView, 
    onEdit, 
    onDelete, 
    requestSort, 
    sortConfig, 
    onAnalyze, 
    analyzingId,
    onShowAnalysis
}: LeadsTableProps): React.ReactNode {
    const { t } = useI18n();
    const { user } = useAuth();
    const isAdminOrAgent = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT;

    const getSortDirection = (key: string) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>{t('name')}</TableHead>
                    <TableHead onClick={() => requestSort('email')} isSorted={getSortDirection('email')}>{t('email')}</TableHead>
                    <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                    <TableHead onClick={() => requestSort('tier')} isSorted={getSortDirection('tier')}>{t('tier')}</TableHead>
                    <TableHead onClick={() => requestSort('score')} isSorted={getSortDirection('score')}>{t('score')}</TableHead>
                    <TableHead onClick={() => requestSort('source')} isSorted={getSortDirection('source')}>{t('source')}</TableHead>
                    <TableHead onClick={() => requestSort('assignee.name')} isSorted={getSortDirection('assignee.name')}>{t('assignee')}</TableHead>
                    <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('created')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {leads ? (
                    leads.map(lead => (
                        <TableRow key={lead.id}>
                            <TableCell>
                                <div className="font-medium">{lead.name}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">{lead.email}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={cn("h-2 w-2 rounded-full", statusColorMap[lead.status])}></span>
                                    <span>{lead.status}</span>
                                </div>
                            </TableCell>
                             <TableCell><Badge variant={tierVariantMap[lead.tier]}>{lead.tier}</Badge></TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{lead.score ?? '-'}</span>
                                    {lead.aiAnalysis && (
                                        <button onClick={() => onShowAnalysis(lead)} title="View AI Analysis">
                                            <BarChart className="h-4 w-4 text-purple-400 cursor-pointer" />
                                        </button>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{lead.source}</TableCell>
                            <TableCell>
                                {lead.assignee ? (
                                    <div className="flex items-center gap-2">
                                        <img src={lead.assignee.avatarUrl} alt={lead.assignee.name} className="h-6 w-6 rounded-full" />
                                        <span>{lead.assignee.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('unassigned')}</span>
                                )}
                            </TableCell>
                            <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView(lead)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('view')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(lead)}>
                                            <FilePenLine className="mr-2 h-4 w-4" />
                                            {t('edit')}
                                        </DropdownMenuItem>
                                        {isAdminOrAgent && (
                                            <DropdownMenuItem onClick={() => onAnalyze(lead.id)} disabled={analyzingId === lead.id}>
                                                {analyzingId === lead.id ? <Spinner className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                {t('analyzeWithAI')}
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}