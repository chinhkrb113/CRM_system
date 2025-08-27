import React, { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const mockCva = (base, config) => (props) => {
    const variantClasses = props?.variant ? config.variants.variant[props.variant] : config.variants.variant[config.defaultVariants.variant];
    return cn(base, variantClasses, props?.className);
};
const cvaImpl = typeof cva === 'function' ? cva : mockCva;


const toastVariants = cvaImpl(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive group border-destructive bg-destructive/10 text-destructive',
        success: 'success group border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const variantIcons = {
    destructive: <AlertTriangle className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    default: null,
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive' | 'success';
    onDismiss?: () => void;
    duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, onDismiss, duration = 5000, children, ...props }, ref) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, duration);

      return () => clearTimeout(timer);
    }, [duration]);
    
    useEffect(() => {
        if(isExiting) {
            const timer = setTimeout(() => {
                onDismiss?.();
            }, 300); // match animation duration
            return () => clearTimeout(timer);
        }
    }, [isExiting, onDismiss]);

    const Icon = variant ? variantIcons[variant] : null;

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), isExiting ? 'animate-out slide-out-to-right-full duration-300' : 'animate-in slide-in-from-right-full duration-300', className)}
        {...props}
      >
        <div className="flex items-start gap-3">
            {Icon && <div className="flex-shrink-0">{Icon}</div>}
            {children}
        </div>
        <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 rounded-md opacity-70 transition-opacity hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.success]:text-green-400 group-[.success]:hover:text-green-600"
            onClick={() => setIsExiting(true)}
            >
            <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

export { Toast };