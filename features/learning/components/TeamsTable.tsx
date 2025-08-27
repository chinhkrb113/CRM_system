


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Team, TeamStatus } from '../../../types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useI18n } from '../../../hooks/useI18n';
import { cn } from '../../../lib/utils';
import { Eye, FilePenLine, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/DropdownMenu';

const statusColorMap: Record<TeamStatus, string> = {
    'Planning': 'bg-yellow-500',
    'In Progress': 'bg-blue-500',
    'Completed': 'bg-green-500',
};

type SortConfig = { key: string; direction: 'ascending' | 'descending' };

interface TeamsTableProps {
    teams: Team[] | null;
    onView: (team: Team) => void;
    onEdit: (team: Team) => void;
    onDelete: (team: Team) => void;
    requestSort: (key: string) => void;
    sortConfig: SortConfig;
}

export function TeamsTable({ teams, onView, onEdit, onDelete, requestSort, sortConfig }: TeamsTableProps) {
    const { t } = useI18n();
    const navigate = useNavigate();

    const getSortDirection = (key: string) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>{t('teamName')}</TableHead>
                    <TableHead onClick={() => requestSort('project')} isSorted={getSortDirection('project')}>Project</TableHead>
                    <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                    <TableHead onClick={() => requestSort('members')} isSorted={getSortDirection('members')}>Members</TableHead>
                    <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('created')}</TableHead>
                    <TableHead onClick={() => requestSort('updatedAt')} isSorted={getSortDirection('updatedAt')}>{t('updated')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {teams ? teams.map(team => (
                    <TableRow key={team.id}>
                        <TableCell className="font-semibold">{team.name}</TableCell>
                        <TableCell>{team.project}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", statusColorMap[team.status])}></span>
                                <span>{team.status}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center">
                                {team.members.slice(0, 5).map((member, index) => (
                                    <img 
                                        key={member.id} 
                                        src={member.avatarUrl} 
                                        alt={member.name} 
                                        className="h-8 w-8 rounded-full border-2 border-background"
                                        style={{ marginLeft: index > 0 ? '-10px' : 0, zIndex: team.members.length - index }}
                                        title={member.name}
                                    />
                                ))}
                                 {team.members.length > 5 && (
                                    <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold" style={{ marginLeft: '-10px', zIndex: 0 }}>
                                        +{team.members.length - 5}
                                    </div>
                                )}
                                <span className="ml-2 text-sm text-muted-foreground">({team.members.length})</span>
                            </div>
                        </TableCell>
                        <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{team.updatedAt ? new Date(team.updatedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(team)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('view')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(team)}>
                                        <FilePenLine className="mr-2 h-4 w-4" />
                                        {t('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(team)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )) : Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}