import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { MatchingCandidate } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { Spinner } from '../../../components/ui/Spinner';

interface RequestInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: { scheduledTime: string; location: string }) => void;
    candidate: MatchingCandidate;
    isRequesting: boolean;
}

function RequestInterviewModal({ isOpen, onClose, onConfirm, candidate, isRequesting }: RequestInterviewModalProps) {
    const { t } = useI18n();
    const [scheduledTime, setScheduledTime] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({ scheduledTime, location });
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{t('requestInterviewDetails')}</DialogTitle>
                    <DialogDescription>
                        Set the time and location for the interview with {candidate.name}.
                    </DialogDescription>
                </DialogHeader>
                <DialogContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="scheduledTime">{t('interviewTime')}</Label>
                        <Input
                            id="scheduledTime"
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={e => setScheduledTime(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">{t('interviewLocation')}</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder={t('interviewLocationPlaceholder')}
                            required
                        />
                    </div>
                </DialogContent>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" disabled={isRequesting || !scheduledTime || !location}>
                        {isRequesting && <Spinner className="mr-2 h-4 w-4" />}
                        {t('confirmRequest')}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}

export default RequestInterviewModal;
