
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const Dialog = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={onClose}
        >
            <div
                className="relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-2xl"
                onClick={e => e.stopPropagation()}
            >
                {children}
                 <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </Button>
            </div>
        </div>
    );
};

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

const DialogContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);

export { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogContent };