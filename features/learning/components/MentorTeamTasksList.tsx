


import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal, Trash2,FilePenLine } from 'lucide-react';
import { useI18n } from '../../../hooks/useI18n';
import { useAuth } from '../../../contexts/AuthContext';
import { TeamTask, TaskStatus, UserRole } from '../../../types';

interface MentorTeamTasksListProps {
    tasks: TeamTask[];
    onDeleteTask?: (taskId: string) => void;
}

const statusVariantMap: Record<TaskStatus, 'success' | 'secondary' | 'warning'> = {
    [TaskStatus.COMPLETED]: 'success',
    [TaskStatus.IN_PROGRESS]: 'secondary',
    [TaskStatus.PENDING]: 'warning',
};

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: string; direction: SortDirection };

function MentorTeamTasksList({ tasks, onDeleteTask }: MentorTeamTasksListProps) {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'ascending' });
    
    const sortedTasks = useMemo(() => {
        let sortableItems = [...tasks];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [tasks, sortConfig]);

    const requestSort = (key: string) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortDirection = (key: string) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('teamTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead onClick={() => requestSort('title')} isSorted={getSortDirection('title')}>{t('taskTitle')}</TableHead>
                            <TableHead onClick={() => requestSort('studentName')} isSorted={getSortDirection('studentName')}>{t('assignedTo')}</TableHead>
                            <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                            <TableHead onClick={() => requestSort('dueDate')} isSorted={getSortDirection('dueDate')}>{t('dueDate')}</TableHead>
                            <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedTasks.length > 0 ? sortedTasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <img src={task.studentAvatarUrl} alt={task.studentName} className="h-8 w-8 rounded-full" />
                                        <span>{task.studentName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusVariantMap[task.status]}>{task.status}</Badge>
                                </TableCell>
                                <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    {user?.role !== UserRole.ADMIN && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/learning/teams/${task.teamId}/tasks/${task.id}/edit`)}>
                                                <FilePenLine className="mr-2 h-4 w-4" />
                                                    {t('edit')}
                                                </DropdownMenuItem>
                                                {user?.role === UserRole.MENTOR && onDeleteTask && (
                                                    <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('delete')}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No tasks assigned to this team yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default MentorTeamTasksList;