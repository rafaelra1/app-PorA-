import * as React from 'react';
import { SubTab } from '../../types';

interface TripTabsProps {
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
    tripTitle?: string;
}

const tabs: { id: SubTab; label: string; icon: string; badge?: 'trip' }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'checklist', label: 'Checklist', icon: 'checklist_rtl' },
    { id: 'itinerary', label: 'Roteiro', icon: 'route' },
    { id: 'logistics', label: 'Logística', icon: 'local_shipping' },
    { id: 'docs', label: 'Documentos', icon: 'description', badge: 'trip' },
    { id: 'budget', label: 'Orçamento', icon: 'account_balance_wallet' },
    { id: 'journal', label: 'Diário', icon: 'book_2', badge: 'trip' },
];

const TripTabs: React.FC<TripTabsProps> = ({ activeTab, onTabChange, tripTitle }) => {
    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        let newIndex = index;
        if (e.key === 'ArrowRight') {
            newIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
            newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            newIndex = 0;
        } else if (e.key === 'End') {
            newIndex = tabs.length - 1;
        } else {
            return;
        }

        e.preventDefault();
        onTabChange(tabs[newIndex].id);
        tabRefs.current[newIndex]?.focus();
    };

    return (
        <div className="sticky top-0 z-40 py-2 mb-6 pointer-events-none mx-6 md:mx-12">
            <div
                role="tablist"
                aria-label="Abas de detalhes da viagem"
                className="flex gap-1 p-1.5 bg-gray-100/60 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl overflow-x-auto hide-scrollbar w-full pointer-events-auto"
            >
                {tabs.map((tab, index) => {
                    const isSelected = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            ref={(el) => { tabRefs.current[index] = el; }}
                            role="tab"
                            aria-selected={isSelected}
                            aria-controls={`panel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => onTabChange(tab.id)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold transition-all whitespace-nowrap rounded-xl ${isSelected
                                ? 'bg-primary text-text-main shadow-sm'
                                : 'text-text-muted hover:text-text-main hover:bg-white/50'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            {tab.label}
                            {/* Badge contextual */}
                            {tab.badge === 'trip' && tripTitle && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full">
                                    📍 {tripTitle.split(' ')[0]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TripTabs;

