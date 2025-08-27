
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { Button } from './Button';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export function AlertDialog({ isOpen, onClose, onConfirm, title, description }: AlertDialogProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirm}>Confirm</Button>
            </DialogFooter>
        </Dialog>
    );
}