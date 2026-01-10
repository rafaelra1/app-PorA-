import React, { useEffect } from 'react';
import { Icon } from '../../ui/Base';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    footer?: React.ReactNode;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    footer
}: ModalProps): React.ReactElement | null => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    const previousActiveElement = React.useRef<HTMLElement | null>(null);
    const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

    // Focus management and close on ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        const handleTab = (e: KeyboardEvent) => {
            if (!isOpen || !modalRef.current) return;

            const updateFocusableElements = () => {
                if (!modalRef.current) return [];
                return modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
            };

            const focusableElements = updateFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('keydown', handleTab);
            document.body.style.overflow = 'hidden';

            // Focus on first element after a small delay to ensure rendering
            setTimeout(() => {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements && focusableElements.length > 0) {
                    (focusableElements[0] as HTMLElement).focus();
                } else {
                    modalRef.current?.focus();
                }
            }, 50);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleTab);
            document.body.style.overflow = 'unset';
            // Restore focus
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Size classes
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw] max-h-[95vh]'
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div
                ref={modalRef}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} mx-4 animate-in zoom-in-95 duration-200 focus:outline-none`}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2
                        id={titleId}
                        className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent"
                    >
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Fechar modal"
                        >
                            <Icon name="close" className="text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
