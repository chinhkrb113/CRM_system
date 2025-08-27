import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
    value: number;
    className?: string;
}

const ProgressBar = ({ value, className }: ProgressBarProps) => (
    <div className={cn("w-full bg-muted rounded-full h-2.5", className)}>
        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
    </div>
);
export { ProgressBar };
