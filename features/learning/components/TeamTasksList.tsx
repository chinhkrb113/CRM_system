

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';
import { useI18n } from '../../../hooks/useI18n';
import { getTasksForStudent, updateTask } from '../../../services/mockApi';
import { Task, TaskStatus } from '../../../types';
import { useToast } from '../../../hooks/useToast';


interface TeamTasksListProps {
    teamId: string;
    studentId: string;
}

const statusMap: Record<TaskStatus, 'success' | 'warning' | 'secondary'> = {
    [TaskStatus.COMPLETED]: 'success',
    [TaskStatus.IN_PROGRESS]: 'secondary',
    [TaskStatus.PENDING]: 'warning',
};

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof Task; direction: SortDirection };

function TeamTasksList({ teamId, studentId }: TeamTasksListProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[] | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'ascending' });

    useEffect(() => {
        const fetchAndFilterTasks = async () => {
            const allTasks = await getTasksForStudent(studentId);
            const teamTasks = allTasks.filter(task => task.teamId === teamId);
            setTasks(teamTasks);
        };
        fetchAndFilterTasks();
    }, [teamId, studentId]);
    
    const sortedTasks = useMemo(() => {
        if (!tasks) return null;
        const sortableItems = [...tasks];
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key]! < b[sortConfig.key]!) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key]! > b[sortConfig.key]!) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [tasks, sortConfig]);

    const requestSort = (key: keyof Task) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortDirection = (key: keyof Task) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    const handleStatusChange = async (task: Task, isCompleted: boolean) => {
        const originalStatus = task.status;
        const newStatus = isCompleted ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS;

        const updatedTasks = tasks!.map(t => 
            t.id === task.id ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        try {
            await updateTask(task.id, { status: newStatus });
            toast({
                title: 'Success!',
                description: isCompleted ? t('taskCompletedSuccess') : t('taskInProgressSuccess'),
                variant: 'success'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: t('taskUpdateError'),
                variant: 'destructive'
            });
            const revertedTasks = tasks!.map(t => 
                t.id === task.id ? { ...t, status: originalStatus } : t
            );
            setTasks(revertedTasks);
        }
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
                            <TableHead onClick={() => requestSort('title')} isSorted={getSortDirection('title')}>Task</TableHead>
                            <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>Status</TableHead>
                            <TableHead onClick={() => requestSort('dueDate')} isSorted={getSortDirection('dueDate')}>Due Date</TableHead>
                            <TableHead className="text-center">{t('complete')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedTasks ? (
                            sortedTasks.length > 0 ? sortedTasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusMap[task.status]}>{task.status}</Badge>
                                    </TableCell>
                                    <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={task.status === TaskStatus.COMPLETED}
                                            onChange={(e) => handleStatusChange(task, e.target.checked)}
                                            aria-label={`Mark task ${task.title} as complete`}
                                        />
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No tasks assigned for this team project yet.
                                    </TableCell>
                                </TableRow>
                            )
                        ) : (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default TeamTasksList;
