import React from 'react';
import { SubTab } from '../../types';

interface TripTabsProps {
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
}

const tabs: { id: SubTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'itinerary', label: 'Itinerário', icon: 'map' },
    { id: 'accommodation', label: 'Acomodação', icon: 'hotel' },
    { id: 'transport', label: 'Transportes', icon: 'directions_car' },
    { id: 'docs', label: 'Documentos', icon: 'description' },
    { id: 'budget', label: 'Despesas', icon: 'payments' },
    { id: 'journal', label: 'Diário', icon: 'book_2' },
];

const TripTabs: React.FC<TripTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="sticky top-0 z-40 py-2 mb-6 pointer-events-none">
            <div className="flex gap-1 p-1 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-x-auto hide-scrollbar w-full pointer-events-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 py-2 px-4 text-xs font-bold transition-all whitespace-nowrap rounded-xl ${activeTab === tab.id
                            ? 'bg-primary text-text-main shadow-sm'
                            : 'text-text-muted hover:text-text-main hover:bg-white/50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TripTabs;
