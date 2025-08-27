import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Mocking cva for CDN environment
const mockCva = (base, config) => (props) => {
    const variantClasses = props?.variant ? config.variants.variant[props.variant] : config.variants.variant[config.defaultVariants.variant];
    return cn(base, variantClasses, props?.className);
};
const cvaImpl = typeof cva === 'function' ? cva : mockCva;


const badgeVariants = cvaImpl(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-red-600 text-red-50 hover:bg-red-600/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-600 text-green-50 hover:bg-green-600/80',
        warning: 'border-transparent bg-amber-500 text-white',
        high: 'border-transparent bg-blue-500 text-white',
        medium: 'border-transparent bg-amber-500 text-white',
        low: 'border-transparent bg-red-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'high' | 'medium' | 'low';
  children?: React.ReactNode;
  className?: string;
}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
