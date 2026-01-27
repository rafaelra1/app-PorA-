import React from 'react';
import { CityTab } from '../../../types';

interface CityGuideNavigationProps {
    activeTab: CityTab;
    onTabChange: (tab: CityTab) => void;
}

const SHORTCUTS = [
    { id: 'info', label: 'o que saber\nantes', icon: 'help', action: 'info' },
    { id: 'accommodation', label: 'onde\ndormir', icon: 'bed', action: 'accommodation' },
    { id: 'attractions', label: 'o que\nfazer', icon: 'camera_alt', action: 'attractions' },
    { id: 'gastronomy', label: 'o que\ncomer', icon: 'skillet', action: 'gastronomy' },
    { id: 'restaurants', label: 'onde\ncomer', icon: 'restaurant', action: 'restaurants' },
    { id: 'transport', label: 'transporte', icon: 'flight_takeoff', action: 'transport' },
    { id: 'search', label: 'pesquisas', icon: 'travel_explore', action: 'search' },
];

export const CityGuideNavigation: React.FC<CityGuideNavigationProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar scroll-smooth">
            {SHORTCUTS.map((item) => {
                const isActive = activeTab === item.id;
                // Determine icon based on Material Symbols
                // Adjusted icons to better match the description "cloche" (skillet/soup_kitchen/room_service) and "fork/spoon"
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.action as CityTab)}
                        className="flex flex-col items-center gap-2 p-0 group flex-shrink-0 w-[84px]"
                    >
                        <div className={`
                            size-[84px] rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300
                            ${isActive
                                ? 'bg-[#1A1A1A] text-white shadow-md scale-105'
                                : 'bg-[#F3F4F6] text-[#1A1A1A] hover:bg-[#E5E7EB] hover:-translate-y-1'
                            }
                        `}>
                            <span className={`material-symbols-outlined text-[32px] ${isActive ? 'filled' : ''}`}>
                                {item.icon}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-center leading-tight lowercase text-gray-700 group-hover:text-[#1A1A1A] h-8 flex items-center">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
