import React from 'react';
import { Trip, City } from '../../../types';
import { calculateNights } from '../../../lib/dateUtils';

interface SidebarMetricsProps {
    trip: Trip;
    cities: City[];
}

export const SidebarMetrics: React.FC<SidebarMetricsProps> = ({ trip, cities }) => {
    const cityCount = cities.length || (trip.detailedDestinations?.length || 1);
    const tripDays = calculateNights(trip.startDate, trip.endDate) + 1; // Days = Nights + 1 usually
    const participantCount = (trip.participants?.length || 0); // Include user? Usually participats list includes everyone or just invitees. Assuming list size.

    return (
        <div className="grid grid-cols-3 gap-3">
            {/* Cities Metric */}
            <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-3 flex flex-col items-center justify-center text-center aspect-square">
                <span className="text-3xl font-black text-[#1A1A1A] leading-none mb-1">{cityCount}</span>
                <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wide">cidades</span>
            </div>

            {/* Days Metric */}
            <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-3 flex flex-col items-center justify-center text-center aspect-square">
                <span className="text-3xl font-black text-[#1A1A1A] leading-none mb-1">{tripDays}</span>
                <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wide">dias</span>
            </div>

            {/* Travelers Metric */}
            <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-3 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden">
                {/* Overlapping avatars preview if possible, or just number */}
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-3xl font-black text-[#1A1A1A] leading-none">{participantCount || 1}</span>
                </div>
                <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wide">viajantes</span>
            </div>
        </div>
    );
};
