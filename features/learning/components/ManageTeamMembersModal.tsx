
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getStudents, updateTeam } from '../../../services/mockApi';
import { Student, Team } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { useI18n } from '../../../hooks/useI18n';

interface ManageTeamMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team;
    onTeamUpdate: () => void;
}

function ManageTeamMembersModal({ isOpen, onClose, team, onTeamUpdate }: ManageTeamMembersModalProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const [allStudents, setAllStudents] = useState<Student[] | null>(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchAllStudents = async () => {
                const data = await getStudents();
                // Show current members and unassigned students as options
                setAllStudents(data.filter(s => !s.teamIds || s.teamIds.length === 0 || s.teamIds.includes(team.id)));
            };
            fetchAllStudents();
            setSelectedMemberIds(new Set(team.members.map(m => m.id)));
        }
    }, [isOpen, team]);

    const handleMemberToggle = (studentId: string) => {
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateTeam(team.id, {
                ...team,
                memberIds: Array.from(selectedMemberIds),
            });
            toast({ title: "Success", description: "Team members updated successfully.", variant: 'success' });
            onTeamUpdate();
            onClose();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update team members.", variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{t('manageMembers')}</DialogTitle>
                <DialogDescription>Add or remove students from "{team.name}".</DialogDescription>
            </DialogHeader>
            <DialogContent>
                <div className="max-h-80 overflow-y-auto space-y-2 rounded-md border p-2">
                    {allStudents ? (
                        allStudents.map(student => (
                            <div key={student.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                <input
                                    type="checkbox"
                                    id={`student-member-${student.id}`}
                                    checked={selectedMemberIds.has(student.id)}
                                    onChange={() => handleMemberToggle(student.id)}
                                    className="h-4 w-4"
                                />
                                <label htmlFor={`student-member-${student.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                                    <img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full" />
                                    <div>
                                        <p className="font-medium text-sm">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">{student.course}</p>
                                    </div>
                                </label>
                            </div>
                        ))
                    ) : (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                    )}
                </div>
            </DialogContent>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : t('save')}</Button>
            </DialogFooter>
        </Dialog>
    );
}

export default ManageTeamMembersModal;
