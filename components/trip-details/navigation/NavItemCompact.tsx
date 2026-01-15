import React from 'react';
import { Icon } from '../../ui/Base';
import { Tooltip } from '../../ui/Tooltip';
import { NavQuestion } from '../../../types/navigation';

interface NavItemCompactProps {
    item: NavQuestion;
    isActive: boolean;
    onClick: () => void;
}

/**
 * Compact navigation item (icon only)
 * Shows tooltip with question on hover
 */
export const NavItemCompact: React.FC<NavItemCompactProps> = ({
    item,
    isActive,
    onClick,
}) => {
    return (
        <Tooltip content={item.question} side="right">
            <button
                onClick={onClick}
                aria-label={item.shortLabel}
                aria-current={isActive ? 'page' : undefined}
                className={`
          relative w-12 h-12 rounded-xl
          flex items-center justify-center
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isActive
                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                        : `hover:bg-gray-100 ${item.iconColor}`
                    }
        `}
            >
                <Icon name={item.icon} className="text-xl" filled={isActive} />

                {/* Minified badge */}
                {item.badge !== undefined && item.badge > 0 && (
                    <span
                        className={`
              absolute -top-1 -right-1 min-w-[16px] h-4 px-1
              text-[10px] font-bold rounded-full
              flex items-center justify-center
              ${isActive ? 'bg-white text-gray-900' : 'bg-rose-500 text-white'}
            `}
                    >
                        {item.badge > 9 ? '9+' : item.badge}
                    </span>
                )}

                {/* Circular progress indicator */}
                {item.progress !== undefined && !isActive && item.progress > 0 && (
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                        viewBox="0 0 48 48"
                    >
                        <circle
                            cx="24"
                            cy="24"
                            r="22"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${(item.progress / 100) * 138} 138`}
                            className="text-green-500 opacity-40"
                        />
                    </svg>
                )}
            </button>
        </Tooltip>
    );
};

export default NavItemCompact;
