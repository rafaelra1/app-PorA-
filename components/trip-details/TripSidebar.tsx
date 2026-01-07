import React, { useState } from 'react';
import { SubTab } from '../../types';
import { Icon } from '../ui/Base';

interface TripSidebarProps {
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
}

const tabs: { id: SubTab; label: string; icon: string }[] = [
    { id: 'itinerary', label: 'Roteiro', icon: 'map' },
    { id: 'cities', label: 'Cidades', icon: 'location_city' },
    { id: 'docs', label: 'Documentos', icon: 'description' },
    { id: 'journal', label: 'Diário', icon: 'book_2' },
];

const TripSidebar: React.FC<TripSidebarProps> = ({ activeTab, onTabChange }) => {
    return (
        <aside className="h-full w-20 hover:w-64 bg-[#231212] border-r border-[#231212]/20 transition-all duration-300 z-40 flex flex-col group py-6 items-center hover:items-stretch overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.15)]">

            {/* Navigation Items */}
            <nav className="flex-1 w-full space-y-1 px-3 mt-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative w-full h-14 flex items-center rounded-2xl transition-all duration-300 group/item overflow-hidden ${activeTab === tab.id
                            ? 'bg-[#d0cfe1] text-[#231212] shadow-lg shadow-[#d0cfe1]/30'
                            : 'text-[#eceaea]/60 hover:bg-[#d0cfe1]/10 hover:text-[#eceaea]'
                            }`}
                    >
                        {/* Icon */}
                        <div className="absolute left-0 w-14 h-14 flex items-center justify-center shrink-0">
                            <Icon
                                name={tab.icon}
                                className={`text-[26px] transition-transform duration-300 ${activeTab === tab.id ? '' : 'group-hover/item:scale-110'}`}
                                filled={activeTab === tab.id}
                            />
                        </div>

                        {/* Label */}
                        <span className={`pl-16 text-[15px] font-bold tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 ${activeTab === tab.id ? 'font-extrabold' : 'font-medium'}`}>
                            {tab.label}
                        </span>

                        {/* Active Indicator (Dot instead of strip for modern look, only visible when collapsed?) 
                            Actually, full bg is better for modern look. 
                            Let's add a small glow or nothing else.
                        */}
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto px-3 w-full space-y-2">
                <button className="w-full h-12 flex items-center rounded-2xl text-[#eceaea]/60 hover:bg-[#d0cfe1]/10 hover:text-[#eceaea] transition-all overflow-hidden relative group/item">
                    <div className="absolute left-0 w-14 h-12 flex items-center justify-center shrink-0">
                        <Icon name="settings" className="text-2xl group-hover/item:rotate-90 transition-transform duration-500" />
                    </div>
                    <span className="pl-16 text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                        Configurações
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default TripSidebar;
