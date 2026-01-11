import * as React from 'react';

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
}) => {

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
            id: 'map',
            label: 'Mapa 3D',
            icon: 'explore',
            gradient: 'from-emerald-500 to-teal-600',
            iconColor: 'text-emerald-500',
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
            id: 'media',
            label: 'Mídias',
            icon: 'perm_media',
            gradient: 'from-fuchsia-500 to-purple-600',
            iconColor: 'text-fuchsia-500',
        },
        {
            id: 'memories',
            label: 'Memórias',
            icon: 'book_2',
            gradient: 'from-pink-500 to-rose-600',
            iconColor: 'text-pink-500',
        },
    ];

    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        let newIndex = index;
        if (e.key === 'ArrowRight') {
            newIndex = (index + 1) % navItems.length;
        } else if (e.key === 'ArrowLeft') {
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
        <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-[60]">
            <div className="px-6 md:px-8 py-2">
                {/* Navigation Items */}
                <div
                    className="flex items-center gap-1 overflow-x-auto no-scrollbar"
                    role="tablist"
                    aria-orientation="horizontal"
                    aria-label="Menu de detalhes da viagem"
                >
                    {navItems.map((item, index) => {
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                ref={(el) => { tabRefs.current[index] = el; }}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${item.id}`}
                                id={`tab-${item.id}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => onTabChange(item.id)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className={`
                                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0
                                    ${isActive
                                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                                        : `text-gray-500 hover:bg-gray-50 ${item.iconColor}`
                                    }
                                `}
                            >
                                {/* Icon */}
                                <Icon
                                    name={item.icon}
                                    className="text-lg"
                                    filled={isActive}
                                />

                                {/* Label */}
                                <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                                    {item.label}
                                </span>

                                {/* Badge */}
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span
                                        className={`
                                            min-w-[18px] h-[18px] px-1
                                            text-[10px] font-bold rounded-full flex items-center justify-center
                                            ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-rose-500 text-white'
                                            }
                                        `}
                                    >
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}

                                {/* Active indicator line (bottom) */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/50 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );

};



export default TripSidebar;
