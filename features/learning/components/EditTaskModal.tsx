
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { TeamTask, TaskStatus, UpdateTaskData } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { Spinner } from '../../../components/ui/Spinner';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: TeamTask;
    onSave: (taskId: string, data: UpdateTaskData) => void;
}

function EditTaskModal({ isOpen, onClose, task, onSave }: EditTaskModalProps) {
    const { t } = useI18n();
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setStatus(task.status);
            // Format date for input type="date" which requires YYYY-MM-DD
            setDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
        }
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        onSave(task.id, { title, dueDate, status });
        // isSaving will be reset by parent component closing the modal
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{t('editTask')}</DialogTitle>
                    <DialogDescription>{t('taskDetails')}</DialogDescription>
                </DialogHeader>
                <DialogContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">{t('taskTitle')}</Label>
                        <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('assignedTo')}</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <img src={task.studentAvatarUrl} alt={task.studentName} className="h-8 w-8 rounded-full" />
                            <span className="font-medium text-sm">{task.studentName}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-dueDate">{t('dueDate')}</Label>
                            <Input id="edit-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">{t('status')}</Label>
                            <Select id="edit-status" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                                {Object.values(TaskStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </DialogContent>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                        {t('updateTask')}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}

export default EditTaskModal;
