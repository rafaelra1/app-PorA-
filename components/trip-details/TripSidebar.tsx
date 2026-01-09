import React, { useState } from 'react';
import { SubTab } from '../../types';
import { Icon } from '../ui/Base';

interface TripSidebarProps {
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
    tripStats?: {
        cities?: number;
        days?: number;
        hotels?: number;
        transports?: number;
        documents?: number;
        expenses?: number;
        activities?: number;
    };
    onBack?: () => void;
}

interface NavItem {
    id: SubTab;
    label: string;
    icon: string;
    badge?: number;
    gradient: string;
    iconColor: string;
}

const TripSidebar: React.FC<TripSidebarProps> = ({
    activeTab,
    onTabChange,
    tripStats = {},
    onBack,
}) => {
    const [hoveredItem, setHoveredItem] = useState<SubTab | null>(null);

    const navItems: NavItem[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: 'dashboard',
            gradient: 'from-violet-500 to-purple-600',
            iconColor: 'text-violet-500',
        },
        {
            id: 'itinerary',
            label: 'Itinerário',
            icon: 'event_note',
            badge: tripStats.activities,
            gradient: 'from-sky-500 to-blue-600',
            iconColor: 'text-sky-500',
        },
        {
            id: 'accommodation',
            label: 'Hospedagem',
            icon: 'hotel',
            badge: tripStats.hotels,
            gradient: 'from-amber-500 to-orange-500',
            iconColor: 'text-amber-500',
        },
        {
            id: 'transport',
            label: 'Transportes',
            icon: 'directions_car',
            badge: tripStats.transports,
            gradient: 'from-emerald-500 to-teal-600',
            iconColor: 'text-emerald-500',
        },
        {
            id: 'docs',
            label: 'Documentos',
            icon: 'folder_open',
            badge: tripStats.documents,
            gradient: 'from-rose-500 to-pink-600',
            iconColor: 'text-rose-500',
        },
        {
            id: 'budget',
            label: 'Despesas',
            icon: 'account_balance_wallet',
            badge: tripStats.expenses,
            gradient: 'from-indigo-500 to-blue-600',
            iconColor: 'text-indigo-500',
        },
        {
            id: 'journal',
            label: 'Diário',
            icon: 'auto_stories',
            gradient: 'from-fuchsia-500 to-purple-600',
            iconColor: 'text-fuchsia-500',
        },
    ];

    return (
        <aside className="h-full w-[72px] bg-white/80 backdrop-blur-sm border-r border-gray-100 flex flex-col shrink-0 z-40 relative">
            {/* Back Button */}
            {onBack && (
                <div className="px-3 pt-4 pb-2">
                    <button
                        onClick={onBack}
                        className="w-full h-12 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
                        title="Voltar"
                    >
                        <Icon name="arrow_back" className="text-xl" />
                    </button>
                </div>
            )}

            {/* Divider */}
            {onBack && <div className="mx-4 border-b border-gray-100 mb-2" />}

            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isHovered = hoveredItem === item.id;

                    return (
                        <div key={item.id} className="relative">
                            <button
                                onClick={() => onTabChange(item.id)}
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={`
                                    w-full h-12 flex items-center justify-center rounded-xl transition-all duration-200 relative
                                    ${isActive
                                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                                    }
                                `}
                            >
                                {/* Icon */}
                                <Icon
                                    name={item.icon}
                                    className={`text-[22px] ${isActive ? '' : ''}`}
                                    filled={isActive}
                                />

                                {/* Badge */}
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span
                                        className={`
                                            absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                                            text-[10px] font-bold rounded-full flex items-center justify-center
                                            ${isActive
                                                ? 'bg-white text-gray-800 shadow-sm'
                                                : 'bg-rose-500 text-white'
                                            }
                                        `}
                                    >
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}

                                {/* Active indicator line */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-r-full -ml-3" />
                                )}
                            </button>

                            {/* Tooltip */}
                            {isHovered && (
                                <div
                                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] pointer-events-none animate-fade-in"
                                    style={{ animationDuration: '150ms' }}
                                >
                                    <div className={`
                                        px-3 py-2 rounded-xl whitespace-nowrap shadow-xl
                                        ${isActive
                                            ? `bg-gradient-to-r ${item.gradient} text-white`
                                            : 'bg-gray-900 text-white'
                                        }
                                    `}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">{item.label}</span>
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-bold">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div
                                            className={`
                                                absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2
                                                w-2 h-2 rotate-45
                                                ${isActive
                                                    ? `bg-gradient-to-br ${item.gradient}`
                                                    : 'bg-gray-900'
                                                }
                                            `}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Section - Settings */}
            <div className="px-3 pb-4 pt-2 border-t border-gray-100 mt-auto">
                <button
                    className="w-full h-12 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all group"
                    title="Configurações"
                >
                    <Icon
                        name="settings"
                        className="text-xl transition-transform duration-500 group-hover:rotate-90"
                    />
                </button>
            </div>
        </aside>
    );
};

export default TripSidebar;
