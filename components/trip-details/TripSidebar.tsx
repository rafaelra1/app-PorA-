import * as React from 'react';
import { useState } from 'react';

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

    tripStats,

    onBack,

}) => {

    const [tooltipState, setTooltipState] = useState<{ id: SubTab; top: number; left: number } | null>(null);

    // Calculate logistics badge (hotels + transports)
    const logisticsBadge = (tripStats?.hotels || 0) + (tripStats?.transports || 0);

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
            label: 'Roteiro',
            icon: 'map',
            badge: tripStats?.activities,
            gradient: 'from-sky-500 to-blue-600',
            iconColor: 'text-sky-500',
        },
        {
            id: 'logistics',
            label: 'Logística',
            icon: 'layers',
            badge: logisticsBadge > 0 ? logisticsBadge : undefined,
            gradient: 'from-amber-500 to-orange-600',
            iconColor: 'text-amber-500',
        },
        {
            id: 'docs',
            label: 'Documentos',
            icon: 'description',
            badge: tripStats?.documents,
            gradient: 'from-rose-500 to-pink-600',
            iconColor: 'text-rose-500',
        },
        {
            id: 'budget',
            label: 'Despesas',
            icon: 'payments',
            badge: tripStats?.expenses,
            gradient: 'from-indigo-500 to-blue-600',
            iconColor: 'text-indigo-500',
        },
        {
            id: 'memories',
            label: 'Memórias',
            icon: 'book_2',
            gradient: 'from-fuchsia-500 to-purple-600',
            iconColor: 'text-fuchsia-500',
        },
    ];

    const activeTooltipItem = tooltipState ? navItems.find(i => i.id === tooltipState.id) : null;
    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        let newIndex = index;
        if (e.key === 'ArrowDown') {
            newIndex = (index + 1) % navItems.length;
        } else if (e.key === 'ArrowUp') {
            newIndex = (index - 1 + navItems.length) % navItems.length;
        } else if (e.key === 'Home') {
            newIndex = 0;
        } else if (e.key === 'End') {
            newIndex = navItems.length - 1;
        } else {
            return;
        }

        e.preventDefault();
        onTabChange(navItems[newIndex].id);
        tabRefs.current[newIndex]?.focus();
    };

    return (
        <aside className="h-full w-[72px] flex flex-col shrink-0 z-[60] overflow-hidden pt-4 bg-white border-r border-gray-100">
            {/* Back Button */}
            {onBack && (
                <div className="px-3 pt-4 pb-2">
                    <button
                        onClick={onBack}
                        className="w-full h-12 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                        title="Voltar"
                    >
                        <Icon name="arrow_back" className="text-xl" />
                    </button>
                </div>
            )}

            {/* Divider */}
            {onBack && <div className="mx-4 border-b border-gray-100 mb-2" />}

            {/* Navigation Items */}
            <div
                className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar"
                role="tablist"
                aria-orientation="vertical"
                aria-label="Menu de detalhes da viagem"
            /* onScroll={() => setTooltipState(null)} - Div doesn't scroll often here, but kept if originally useful. Changing to div from nav to avoid landmark conflict if using role=tablist */
            >
                {navItems.map((item, index) => {
                    const isActive = activeTab === item.id;

                    return (
                        <div key={item.id} className="relative">
                            <button
                                ref={(el) => { tabRefs.current[index] = el; }}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${item.id}`}
                                id={`tab-${item.id}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => onTabChange(item.id)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltipState({
                                        id: item.id,
                                        top: rect.top + (rect.height / 2),
                                        left: rect.right
                                    });
                                }}
                                onMouseLeave={() => setTooltipState(null)}
                                className={`
                                    w-full h-12 flex items-center justify-center rounded-xl transition-all duration-200 relative
                                    ${isActive
                                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                                        : `text-gray-500 hover:bg-gray-50 ${item.iconColor}`
                                    }
                                `}
                            >
                                {/* Icon */}
                                <Icon
                                    name={item.icon}
                                    className={`text-[22px] transition-colors duration-200 ${isActive ? '' : ''}`}
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
                        </div>
                    );
                })}
            </div>

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

            {/* Global Tooltip (Fixed Position) */}
            {activeTooltipItem && tooltipState && (
                <div
                    className="fixed z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        top: tooltipState.top,
                        left: tooltipState.left + 16, // Increased spacing slightly
                        transform: 'translateY(-50%)'
                    }}
                >
                    <div className={`
                        px-3 py-2 rounded-xl whitespace-nowrap shadow-xl flex items-center gap-2
                        bg-gradient-to-r ${activeTooltipItem.gradient} text-white
                    `}>
                        <span className="text-sm font-semibold">{activeTooltipItem.label}</span>

                        {activeTooltipItem.badge !== undefined && activeTooltipItem.badge > 0 && (
                            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-bold">
                                {activeTooltipItem.badge}
                            </span>
                        )}

                        {/* Tooltip arrow */}
                        <div
                            className={`
                                absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2
                                w-2 h-2 rotate-45
                                bg-gradient-to-br ${activeTooltipItem.gradient}
                            `}
                        />
                    </div>
                </div>
            )}
        </aside>

    );

};



export default TripSidebar;
