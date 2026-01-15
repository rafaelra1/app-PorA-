import React from 'react';
import { Icon } from '../../ui/Base';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

/**
 * Overlay drawer for mobile navigation
 * Slides in from left with backdrop
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
    isOpen,
    onClose,
    children,
}) => {
    // Prevent body scroll when drawer is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu de navegação"
                className={`
          fixed left-0 top-0 h-full w-[280px] bg-white z-50
          transform transition-transform duration-300 ease-out
          shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Navegação</h2>
                    <button
                        onClick={onClose}
                        aria-label="Fechar menu"
                        className="
              w-8 h-8 rounded-lg flex items-center justify-center
              text-gray-500 hover:bg-gray-100 hover:text-gray-700
              transition-colors
            "
                    >
                        <Icon name="close" className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-60px)] p-4">
                    {children}
                </div>
            </aside>
        </>
    );
};

export default MobileDrawer;
