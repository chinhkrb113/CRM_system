
import React, { createContext, useState, useCallback } from 'react';
import { Toast } from '../components/ui/Toast';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastOptions = Omit<ToastMessage, 'id'>;

interface ToastContextType {
  toast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = toastCount++;
    setToasts((prevToasts) => [...prevToasts, { id, ...options }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-[var(--toast-gap)] right-[var(--toast-gap)] z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            onDismiss={() => dismiss(t.id)}
          >
             <div className="grid gap-1">
                <p className="font-semibold">{t.title}</p>
                {t.description && (
                    <p className="text-sm opacity-90">{t.description}</p>
                )}
            </div>
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}