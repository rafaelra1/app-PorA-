import React from 'react';
import { Trip } from '../../../types';

interface SidebarDestinationCardProps {
    trip: Trip;
    onEdit?: () => void;
}

export const SidebarDestinationCard: React.FC<SidebarDestinationCardProps> = ({ trip, onEdit }) => {
    return (
        <div className="bg-[#D4F541] rounded-2xl p-6 relative">
            {/* Menu / Options Button */}
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-[#1A1A1A]">more_vert</span>
                </button>
            )}

            {/* Label */}
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">Destino</p>

            {/* Title */}
            <h1 className="text-3xl font-black text-[#1A1A1A] uppercase leading-none tracking-tight mb-4">
                {trip.title || trip.destination.split(',')[0]}
            </h1>

            {/* Date */}
            <p className="text-sm font-medium text-[#1A1A1A] mb-6">
                {trip.startDate} a {trip.endDate}
            </p>

            {/* Footer: Participants & Flag */}
            <div className="flex items-center justify-between">
                {/* Participants */}
                <div className="flex -space-x-2">
                    {trip.participants && trip.participants.length > 0 ? (
                        trip.participants.slice(0, 3).map((p, i) => (
                            <div key={p.id || i} className="size-10 rounded-full border-2 border-[#D4F541] overflow-hidden bg-gray-300">
                                {p.avatar ? (
                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#6B5B95] text-white text-xs font-bold">
                                        {p.initials || p.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="size-10 rounded-full border-2 border-[#D4F541] bg-gray-200 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-sm">person</span>
                        </div>
                    )}
                </div>

                {/* Flag (Mocked based on country or default) */}
                <div className="text-2xl" title="Brasil">
                    {/* TODO: Dynamic flag based on destination */}
                    🇧🇷
                </div>
            </div>
        </div>
    );
};
