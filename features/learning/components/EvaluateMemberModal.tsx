
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Student } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { useToast } from '../../../hooks/useToast';
import { updateStudentSkills } from '../../../services/mockApi';
import { Spinner } from '../../../components/ui/Spinner';
import { Trash2, PlusCircle } from 'lucide-react';

interface EvaluateMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    onSuccess: () => void;
}

function EvaluateMemberModal({ isOpen, onClose, student, onSuccess }: EvaluateMemberModalProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const [skills, setSkills] = useState<{ skill: string; score: number }[]>([]);
    const [newSkillName, setNewSkillName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (student) {
            const initialSkills = student.skillMap
                ? Object.entries(student.skillMap).map(([skill, score]) => ({ skill, score }))
                : student.skills.map(skill => ({ skill, score: 50 }));
            
            // Add any skills from the main list that aren't in the map yet
            student.skills.forEach(skillName => {
                if (!initialSkills.some(s => s.skill.toLowerCase() === skillName.toLowerCase())) {
                    initialSkills.push({ skill: skillName, score: 50 });
                }
            });

            setSkills(initialSkills);
        }
    }, [student]);

    const handleScoreChange = (index: number, score: number) => {
        const updatedSkills = [...skills];
        updatedSkills[index].score = score;
        setSkills(updatedSkills);
    };

    const handleRemoveSkill = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleAddSkill = () => {
        if (newSkillName.trim() && !skills.some(s => s.skill.toLowerCase() === newSkillName.trim().toLowerCase())) {
            setSkills([...skills, { skill: newSkillName.trim(), score: 50 }]);
            setNewSkillName('');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateStudentSkills(student.id, skills);
            toast({
                title: "Success!",
                description: t('skillEvaluationSuccess', { studentName: student.name }),
                variant: 'success'
            });
            onSuccess();
        } catch (error) {
            toast({
                title: "Error",
                description: t('skillEvaluationError'),
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{t('evaluateMember', { studentName: student.name })}</DialogTitle>
                <DialogDescription>{t('evaluateMemberDesc')}</DialogDescription>
            </DialogHeader>
            <DialogContent>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {skills.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>{item.skill}</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-primary w-12 text-right">{item.score} / 100</span>
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveSkill(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={item.score}
                                onChange={(e) => handleScoreChange(index, parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-4 border-t">
                    <Input
                        placeholder={t('newSkillName')}
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill}>
                         <PlusCircle className="mr-2 h-4 w-4" />
                        {t('addSkill')}
                    </Button>
                </div>
            </DialogContent>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                    {t('save')}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}

export default EvaluateMemberModal;
