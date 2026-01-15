import { useEffect } from 'react';
import { SubTab } from '../types';
import { NavQuestion } from '../types/navigation';

/**
 * Hook for keyboard navigation in the sidebar
 * Supports Arrow Up/Down, Home, End, and [ to collapse
 */
export function useSidebarKeyboard(
    items: NavQuestion[],
    activeTab: SubTab,
    onTabChange: (tab: SubTab) => void,
    onToggleCollapse?: () => void
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only active if focus is within sidebar or body (global shortcut check)
            // Check if we are typing in an input - if so, ignore shortcuts except maybe Esc
            const activeElement = document.activeElement;
            const isInput = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.getAttribute('contenteditable') === 'true';

            if (isInput) return;

            // Find current index
            const currentIndex = items.findIndex(i => i.id === activeTab);
            if (currentIndex === -1) return;

            switch (e.key) {
                case 'ArrowDown':
                case 'j': // Vim style
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % items.length;
                    onTabChange(items[nextIndex].id);
                    break;

                case 'ArrowUp':
                case 'k': // Vim style
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + items.length) % items.length;
                    onTabChange(items[prevIndex].id);
                    break;

                case 'Home':
                    e.preventDefault();
                    if (items.length > 0) onTabChange(items[0].id);
                    break;

                case 'End':
                    e.preventDefault();
                    if (items.length > 0) onTabChange(items[items.length - 1].id);
                    break;

                case '[':
                    if (onToggleCollapse) {
                        e.preventDefault();
                        onToggleCollapse();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, activeTab, onTabChange, onToggleCollapse]);
}

export default useSidebarKeyboard;
