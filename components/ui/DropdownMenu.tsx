
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

const DropdownMenuContext = createContext({
  open: false,
  setOpen: (open: React.SetStateAction<boolean>) => {},
});

const useDropdownMenu = () => useContext(DropdownMenuContext);

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, asChild = false }: { children: React.ReactNode, asChild?: boolean }) => {
  const { setOpen } = useDropdownMenu();
  const child = React.Children.only(children) as React.ReactElement<any>;

  const handleClick = (e: React.MouseEvent) => {
      setOpen(o => !o);
      if (child.props.onClick) child.props.onClick(e);
  };
  
  if (asChild) {
     return React.cloneElement(child, { onClick: handleClick });
  }

  return <button onClick={() => setOpen(o => !o)}>{children}</button>;
};

const DropdownMenuContent = ({ children, className, align = 'start' }: { children: React.ReactNode, className?: string, align?: 'start' | 'end' }) => {
  const { open, setOpen } = useDropdownMenu();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, className, ...props }: { children: React.ReactNode, className?: string, onClick?: () => void, disabled?: boolean }) => {
  const { setOpen } = useDropdownMenu();
  return (
    <div
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground',
        props.disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onClick={() => {
          if(!props.disabled) {
            props.onClick?.();
            setOpen(false);
          }
      }}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// Simplified Sub-menu for demo purposes
const DropdownMenuSub = ({ children }: {children: React.ReactNode}) => <div className="relative group">{children}</div>;
const DropdownMenuSubTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent hover:bg-accent", className)}>{children}</div>;
const DropdownMenuPortal = ({ children }: {children: React.ReactNode}) => <>{children}</>;
const DropdownMenuSubContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("absolute left-full -top-2 z-50 min-w-[8rem] hidden group-hover:block overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg", className)}>{children}</div>;


export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent };