

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { JobPosting } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';

interface JobDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: JobPosting;
}

function JobDetailsModal({ isOpen, onClose, job }: JobDetailsModalProps) {
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{job.title}</DialogTitle>
                <DialogDescription>
                    {job.companyName} - Posted on {new Date(job.createdAt).toLocaleDateString()}
                </DialogDescription>
            </DialogHeader>
            <DialogContent>
                <div className="max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap">
                    <p>{job.description}</p>
                </div>
            </DialogContent>
            <DialogFooter>
                <Button type="button" onClick={onClose}>Close</Button>
            </DialogFooter>
        </Dialog>
    );
}

export default JobDetailsModal;