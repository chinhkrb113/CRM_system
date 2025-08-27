
import React from 'react';
import { useState, useEffect } from 'react';
import { getTasksForStudent } from '../../../services/mockApi';
import { Task, TaskStatus } from '../../../types';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';
import { useI18n } from '../../../hooks/useI18n';
import { cn } from '../../../lib/utils';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface StudentProgressProps {
    studentId: string;
}

const statusMap: Record<TaskStatus, { icon: React.ElementType, color: string, variant: 'success' | 'warning' | 'secondary' }> = {
    [TaskStatus.COMPLETED]: { icon: CheckCircle2, color: 'text-green-500', variant: 'success' },
    [TaskStatus.IN_PROGRESS]: { icon: Clock, color: 'text-blue-500', variant: 'secondary' },
    [TaskStatus.PENDING]: { icon: AlertCircle, color: 'text-amber-500', variant: 'warning' },
};

function StudentProgress({ studentId }: StudentProgressProps): React.ReactNode {
    const { t } = useI18n();
    const [tasks, setTasks] = useState<Task[] | null>(null);

    useEffect(() => {
        const fetchTasks = async () => {
            const data = await getTasksForStudent(studentId);
            setTasks(data);
        };
        fetchTasks();
    }, [studentId]);

    if (!tasks) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-5 w-1/5" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ul className="space-y-4">
            {tasks.map(task => {
                const StatusIcon = statusMap[task.status].icon;
                return (
                    <li key={task.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <StatusIcon className={cn("h-5 w-5", statusMap[task.status].color)} />
                            <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t('dueDate')}: {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <Badge variant={statusMap[task.status].variant}>{task.status}</Badge>
                    </li>
                );
            })}
        </ul>
    );
}

export default StudentProgress;