import React from 'react';
import { Participant } from '../../../types';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface TravelerFilterProps {
    travelers: Participant[];
    selectedTravelerId: string | null;
    onSelect: (travelerId: string | null) => void;
}

// =============================================================================
// Main Component
// =============================================================================

const TravelerFilter: React.FC<TravelerFilterProps> = ({
    travelers,
    selectedTravelerId,
    onSelect
}) => {
    if (travelers.length <= 1) return null;

    return (
        <div className="flex items-center gap-3 mb-6 overflow-x-auto hide-scrollbar pb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest shrink-0">
                Filtrar por:
            </span>

            {/* All travelers button */}
            <button
                onClick={() => onSelect(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all shrink-0 ${selectedTravelerId === null
                        ? 'bg-text-main text-white border-text-main shadow-md'
                        : 'bg-white text-text-muted border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
            >
                <span className="material-symbols-outlined text-base">group</span>
                Todos
            </button>

            {/* Individual traveler buttons */}
            {travelers.map(traveler => (
                <button
                    key={traveler.id}
                    onClick={() => onSelect(traveler.id)}
                    className={`flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border text-sm font-semibold transition-all shrink-0 ${selectedTravelerId === traveler.id
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-md'
                            : 'bg-white text-text-muted border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    {/* Avatar */}
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${selectedTravelerId === traveler.id
                                ? 'bg-white/20 text-white'
                                : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
                            }`}
                    >
                        {traveler.initials || traveler.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-24">{traveler.name.split(' ')[0]}</span>
                </button>
            ))}
        </div>
    );
};

export default TravelerFilter;
