import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state
 * Provides open, close, and toggle functionality with type safety
 * 
 * @example
 * const modal = useModal();
 * modal.open();
 * modal.close();
 * modal.toggle();
 */
export function useModal(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return {
        isOpen,
        open,
        close,
        toggle,
        setIsOpen,
    };
}

export default useModal;
