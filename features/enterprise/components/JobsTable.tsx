import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JobPosting, UserRole } from '../../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { FilePenLine, Trash2, Eye, MoreHorizontal, Users, Facebook } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/DropdownMenu';
import { useI18n } from '../../../hooks/useI18n';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { Spinner } from '../../../components/ui/Spinner';

const statusColorMap: Record<JobPosting['status'], string> = {
    Open: 'bg-green-500',
    Interviewing: 'bg-blue-500',
    Closed: 'bg-gray-500',
};

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof JobPosting; direction: SortDirection };

interface JobsTableProps {
    jobs: JobPosting[] | null;
    sortConfig: SortConfig;
    requestSort: (key: keyof JobPosting) => void;
    onView: (job: JobPosting) => void;
    onEdit: (job: JobPosting) => void;
    onDelete: (job: JobPosting) => void;
    onPostToFacebook: (job: JobPosting) => void;
    postingId: string | null;
}

function JobsTable({ jobs, sortConfig, requestSort, onView, onEdit, onDelete, onPostToFacebook, postingId }: JobsTableProps) {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();

    const getSortDirection = (key: keyof JobPosting) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('title')} isSorted={getSortDirection('title')}>Job Title</TableHead>
                    {user?.role !== UserRole.COMPANY_USER && <TableHead onClick={() => requestSort('companyName')} isSorted={getSortDirection('companyName')}>Company</TableHead>}
                    <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>Status</TableHead>
                    {user?.role !== UserRole.ADMIN && <TableHead onClick={() => requestSort('matchCount')} isSorted={getSortDirection('matchCount')}>Matched</TableHead>}
                    <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('created')}</TableHead>
                    <TableHead onClick={() => requestSort('updatedAt')} isSorted={getSortDirection('updatedAt')}>{t('updated')}</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {jobs ? jobs.map(job => {
                    const isPosting = postingId === job.id;
                    return (
                        <TableRow key={job.id}>
                            <TableCell className="font-semibold">{job.title}</TableCell>
                            {user?.role !== UserRole.COMPANY_USER && <TableCell>{job.companyName}</TableCell>}
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={cn("h-2 w-2 rounded-full", statusColorMap[job.status])}></span>
                                    <span>{job.status}</span>
                                </div>
                            </TableCell>
                            {user?.role !== UserRole.ADMIN && <TableCell>{job.matchCount} Candidates</TableCell>}
                            <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            {isPosting ? <Spinner className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView(job)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('view')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(job)}>
                                            <FilePenLine className="mr-2 h-4 w-4" />
                                            {t('edit')}
                                        </DropdownMenuItem>
                                        {user?.role !== UserRole.ADMIN && (
                                            <DropdownMenuItem onClick={() => navigate(`/enterprise/jobs/${job.id}/matches`)}>
                                                <Users className="mr-2 h-4 w-4" />
                                                {t('viewMatches')}
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => onPostToFacebook(job)} disabled={isPosting}>
                                            <Facebook className="mr-2 h-4 w-4" />
                                            {t('postToFacebook')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(job)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                }) : Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        {user?.role !== UserRole.COMPANY_USER && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        {user?.role !== UserRole.ADMIN && <TableCell><Skeleton className="h-5 w-28" /></TableCell>}
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default JobsTable;