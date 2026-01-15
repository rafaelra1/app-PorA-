import React from 'react';
import { Icon } from '../../ui/Base';

interface CollapseToggleProps {
    isCollapsed: boolean;
    onToggle: () => void;
    className?: string;
}

/**
 * Button to toggle sidebar collapsed/expanded state
 * Shows chevron indicating expand/collapse direction
 */
export const CollapseToggle: React.FC<CollapseToggleProps> = ({
    isCollapsed,
    onToggle,
    className = '',
}) => {
    return (
        <button
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!isCollapsed}
            className={`
        flex items-center justify-center
        w-8 h-8 rounded-lg
        bg-gray-100 hover:bg-gray-200
        text-gray-500 hover:text-gray-700
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
        >
            <Icon
                name={isCollapsed ? 'chevron_right' : 'chevron_left'}
                className="text-lg transition-transform duration-200"
            />
        </button>
    );
};

export default CollapseToggle;
