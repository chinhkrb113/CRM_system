
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Team } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { useToast } from '../../../hooks/useToast';
import { createTask } from '../../../services/mockApi';
import { Spinner } from '../../../components/ui/Spinner';

interface AssignTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team;
}

function AssignTaskModal({ isOpen, onClose, team }: AssignTaskModalProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState('all');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const taskData = {
            title,
            dueDate,
            teamId: team.id,
        };

        try {
            if (assigneeId === 'all') {
                await Promise.all(
                    team.members.map(member => createTask({ ...taskData, studentId: member.id }))
                );
                toast({ title: "Success", description: `Task assigned to all ${team.members.length} members.`, variant: 'success' });
            } else {
                await createTask({ ...taskData, studentId: assigneeId });
                const member = team.members.find(m => m.id === assigneeId);
                toast({ title: "Success", description: `Task assigned to ${member?.name}.`, variant: 'success' });
            }
            onClose();
            setTitle('');
            setDueDate('');
            setAssigneeId('all');
        } catch (error) {
            toast({ title: "Error", description: "Failed to assign task.", variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{t('assignTask')}</DialogTitle>
                    <DialogDescription>Assign a new task to members of "{team.name}".</DialogDescription>
                </DialogHeader>
                <DialogContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('taskTitle')}</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">{t('dueDate')}</Label>
                            <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assigneeId">{t('assignTo')}</Label>
                            <Select id="assigneeId" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                                <option value="all">{t('allMembers')}</option>
                                {team.members.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </DialogContent>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" disabled={isSaving || !title || !dueDate}>
                        {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                        {t('assignTask')}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}

export default AssignTaskModal;