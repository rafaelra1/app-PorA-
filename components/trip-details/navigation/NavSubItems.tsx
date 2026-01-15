import React from 'react';
import { Icon } from '../../ui/Base';
import { NavQuestion } from '../../../types/navigation';
import { SubTab } from '../../../types';

interface NavSubItemsProps {
    items: NavQuestion[];
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
    parentActive?: boolean;
    isCollapsed?: boolean;
}

/**
 * Nested navigation items list
 * Used for logistics children (hotels/transport) and dynamic cities
 */
export const NavSubItems: React.FC<NavSubItemsProps> = ({
    items,
    activeTab,
    onTabChange,
    parentActive = false,
    isCollapsed = false,
}) => {
    if (isCollapsed || items.length === 0) {
        return null;
    }

    return (
        <ul className="mt-1 ml-6 space-y-1 border-l-2 border-gray-100 pl-3">
            {items.map((item) => {
                const isActive = activeTab === item.id;

                return (
                    <li key={item.id}>
                        <button
                            onClick={() => onTabChange(item.id)}
                            className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg
                text-left text-sm transition-all duration-150
                ${isActive
                                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
              `}
                        >
                            <Icon
                                name={item.icon}
                                className={`text-base ${isActive ? 'text-white' : item.iconColor}`}
                                filled={isActive}
                            />
                            <span className="truncate">{item.shortLabel}</span>

                            {/* Badge */}
                            {item.badge !== undefined && item.badge > 0 && (
                                <span
                                    className={`
                    ml-auto min-w-[18px] h-[18px] px-1
                    text-[10px] font-bold rounded-full
                    flex items-center justify-center
                    ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}
                  `}
                                >
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default NavSubItems;
