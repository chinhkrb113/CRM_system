


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { getTeamTaskById, updateTask } from '../../services/mockApi';
import { TeamTask, TaskStatus, UpdateTaskData } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';

function EditTaskPage() {
    const { teamId, taskId } = useParams();
    const navigate = useNavigate();
    const { t } = useI18n();
    const { toast } = useToast();

    const [task, setTask] = useState<TeamTask | null>(null);
    const [formData, setFormData] = useState({ title: '', dueDate: '', status: TaskStatus.PENDING });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        const fetchTask = async () => {
            if (taskId) {
                setLoading(true);
                const data = await getTeamTaskById(taskId);
                setTask(data);
                if (data) {
                    setFormData({
                        title: data.title,
                        status: data.status,
                        dueDate: new Date(data.dueDate).toISOString().split('T')[0],
                    });
                }
                setLoading(false);
            }
        };
        fetchTask();
    }, [taskId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskId) return;

        setIsSaving(true);
        try {
            await updateTask(taskId, formData);
            toast({
                title: "Success!",
                description: "Task has been updated.",
                variant: 'success'
            });
            navigate(`/learning/teams/${teamId}`);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update task.",
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="space-y-4 p-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
    }

    if (!task) {
        return <div className="p-8">Task not found.</div>
    }

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <Link to={`/learning/teams/${teamId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Team Details
            </Link>
             <form onSubmit={handleSubmit}>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t('editTask')}</CardTitle>
                        <CardDescription>{t('taskDetails')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('taskTitle')}</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('assignedTo')}</Label>
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <img src={task.studentAvatarUrl} alt={task.studentName} className="h-8 w-8 rounded-full" />
                                <span className="font-medium text-sm">{task.studentName}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">{t('dueDate')}</Label>
                                <Input id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">{t('status')}</Label>
                                <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                                    {Object.values(TaskStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                     <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                            {t('updateTask')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

export default EditTaskPage;