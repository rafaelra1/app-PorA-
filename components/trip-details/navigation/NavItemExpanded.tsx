import React from 'react';
import { Icon } from '../../ui/Base';
import { NavQuestion } from '../../../types/navigation';
import { SubTab } from '../../../types';
import NavProgressIndicator from './NavProgressIndicator';
import NavSubItems from './NavSubItems';

interface NavItemExpandedProps {
    item: NavQuestion;
    isActive: boolean;
    onClick: () => void;
    onToggleExpand?: () => void;
    isExpanded?: boolean;
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
}

/**
 * Expanded navigation item with full content
 * Shows question, description, progress, and children
 */
export const NavItemExpanded: React.FC<NavItemExpandedProps> = ({
    item,
    isActive,
    onClick,
    onToggleExpand,
    isExpanded = false,
    activeTab,
    onTabChange,
}) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className="group">
            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-haspopup={hasChildren ? 'menu' : undefined}
                className={`
          w-full flex items-start gap-3 p-2.5 rounded-xl
          text-left transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                        : 'hover:bg-gray-50 text-gray-700'
                    }
        `}
            >
                {/* Icon container */}
                <div
                    className={`
            shrink-0 w-10 h-10 rounded-lg
            flex items-center justify-center
            ${isActive ? 'bg-white/20' : 'bg-gray-100'}
          `}
                >
                    <Icon
                        name={item.icon}
                        className={`text-xl ${isActive ? 'text-white' : item.iconColor}`}
                        filled={isActive}
                    />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                    {/* Question text */}
                    <p
                        className={`
              text-sm font-medium leading-tight
              ${isActive ? 'text-white' : 'text-gray-900'}
            `}
                    >
                        {item.question}
                    </p>

                    {/* Description (only when inactive) */}
                    {!isActive && item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {item.description}
                        </p>
                    )}

                    {/* Progress bar */}
                    {item.progress !== undefined && (
                        <div className="mt-2">
                            <NavProgressIndicator progress={item.progress} isActive={isActive} />
                        </div>
                    )}
                </div>

                {/* Right side: badge and expand chevron */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                        <span
                            className={`
                min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full
                flex items-center justify-center
                ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}
              `}
                        >
                            {item.badge > 99 ? '99+' : item.badge}
                        </span>
                    )}

                    {/* Expand chevron for items with children */}
                    {hasChildren && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand?.();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleExpand?.();
                                }
                            }}
                            aria-label={isExpanded ? 'Recolher subitens' : 'Expandir subitens'}
                            className={`
                w-5 h-5 rounded flex items-center justify-center
                transition-transform duration-200 cursor-pointer
                ${isExpanded ? 'rotate-90' : ''}
                ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-600'}
              `}
                        >
                            <Icon name="chevron_right" className="text-sm" />
                        </div>
                    )}
                </div>
            </div>

            {/* Nested children */}
            {hasChildren && isExpanded && (
                <NavSubItems
                    items={item.children!}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    parentActive={isActive}
                />
            )}
        </div>
    );
};

export default NavItemExpanded;
