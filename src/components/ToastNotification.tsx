import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite" aria-atomic="false" className="toast-stack fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: '90vw' }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="animate-fade-in flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg pointer-events-auto"
            style={{
              backgroundColor: toast.type === 'error' ? '#151515' : '#151515',
              color: '#FFFEF7',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 12px 32px rgba(21, 21, 21, 0.25)'
            }}
          >
            {toast.type === 'success' && <Check size={16} strokeWidth={2.5} style={{ color: '#FFD76D' }} />}
            {toast.type === 'error' && <AlertCircle size={16} strokeWidth={2.5} style={{ color: '#F2755B' }} />}
            {toast.type === 'info' && <Info size={16} strokeWidth={2.5} style={{ color: '#BFD9F8' }} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
