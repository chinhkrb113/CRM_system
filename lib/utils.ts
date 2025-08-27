
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Note: In a real project, you would install clsx and tailwind-merge.
// For this environment, we provide mock implementations.
const mockClsx = (...args: any[]): string => args.filter(Boolean).join(' ');
const mockTwMerge = (classes: string): string => {
  const classMap: { [key: string]: boolean } = {};
  classes.split(/\s+/).forEach(cls => {
    if (cls) {
        const parts = cls.split('-');
        const key = parts.length > 1 ? parts.slice(0, -1).join('-') : parts[0];
        if (key.startsWith('p') || key.startsWith('m') || key.startsWith('w-') || key.startsWith('h-') || key.startsWith('bg-') || key.startsWith('text-')) {
            // Overwrite previous utility of same type
            Object.keys(classMap).forEach(k => {
                if(k.startsWith(key.split('-')[0])) delete classMap[k];
            });
        }
        classMap[cls] = true;
    }
  });
  return Object.keys(classMap).join(' ');
};


export function cn(...inputs: ClassValue[]) {
  // Using mocks as a fallback for the CDN environment
  const clsxImpl = typeof clsx === 'function' ? clsx : mockClsx;
  const twMergeImpl = typeof twMerge === 'function' ? twMerge : mockTwMerge;
  return twMergeImpl(clsxImpl(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatNumber(num: number) {
    return new Intl.NumberFormat('en-US').format(num);
}