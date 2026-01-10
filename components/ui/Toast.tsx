import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, onClose, duration]);

    const typeStyles = {
        success: 'bg-green-50 text-green-800 border-green-100',
        error: 'bg-red-50 text-red-800 border-red-100',
        info: 'bg-blue-50 text-blue-800 border-blue-100',
        warning: 'bg-amber-50 text-amber-800 border-amber-100',
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning',
    };

    const role = type === 'error' ? 'alert' : 'status';
    const ariaLive = type === 'error' ? 'assertive' : 'polite';

    return (
        <div
            role={role}
            aria-live={ariaLive}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right-full duration-300 ${typeStyles[type]}`}
        >
            <span className="material-symbols-outlined">{icons[type]}</span>
            <p className="text-sm font-semibold flex-1 text-left">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="size-6 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Fechar"
            >
                <span className="material-symbols-outlined text-base">close</span>
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-3 max-w-md w-full pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} />
                </div>
            ))}
        </div>
    );
};

export default Toast;
