import React, { useMemo } from 'react';
import { Trip, HotelReservation } from '../../../types';

interface AccommodationProgressBarProps {
    trip: Trip;
    hotels: HotelReservation[];
}

const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
};

// Helper: Checks if a date falls within a reservation (inclusive check-in, exclusive check-out)
const isDateCovered = (date: Date, hotels: HotelReservation[]): { covered: boolean; hotelName?: string } => {
    for (const hotel of hotels) {
        if (hotel.status === 'cancelled') continue;

        const checkIn = parseDate(hotel.checkIn);
        const checkOut = parseDate(hotel.checkOut);

        // Normalize times to midnight for accurate comparison
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        // Standard hotel night logic: You stay the night of check-in up to (but not including) the night of check-out
        if (date.getTime() >= checkIn.getTime() && date.getTime() < checkOut.getTime()) {
            return { covered: true, hotelName: hotel.name };
        }
    }
    return { covered: false };
};

const AccommodationProgressBar: React.FC<AccommodationProgressBarProps> = ({ trip, hotels }) => {
    const tripDays = useMemo(() => {
        const days: { date: Date; label: string; covered: boolean; hotelName?: string }[] = [];
        const start = parseDate(trip.startDate);
        const end = parseDate(trip.endDate);

        // Create a new date instance to avoid modifying 'start'
        const current = new Date(start);

        // We iterate through all days of the trip, inclusive of start and end
        // Note: The last day of a trip acts as the checkout day for the last night.
        // Usually, you need accommodation for (Trip Duration - 1) nights.
        // e.g. Trip Jan 1 to Jan 3 (3 days total duration usually means 2 nights: Jan 1 & Jan 2).
        // Let's assume startDate to endDate defines the full span.

        // Calculate total duration in days
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // We need segments for nights. So if trip is 5 days, we usually need 4 nights of accommodation.
        // However, the user request says "divided in equal parts by the number of days of the trip".
        // If I interpret "days of the trip" as calendar days, then the last day (departure) typically doesn't need a hotel night.
        // But let's stick to showing "nights" as that's what matters for accommodation coverage.
        // If the user strictly said "days", I should maybe show all days? 
        // "Só seriam pintadas aquelas em que já há reserva de hotel".
        // A reservation on the last day (checkout) does not cover the night of the last day.
        // So visual segments should probably represent *nights*.
        // Let's Loop from Start Date until < End Date.

        for (let i = 0; i < diffDays; i++) {
            const dateToCheck = new Date(start);
            dateToCheck.setDate(start.getDate() + i);

            const coverage = isDateCovered(dateToCheck, hotels);

            days.push({
                date: dateToCheck,
                label: dateToCheck.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                ...coverage
            });
        }

        return days;
    }, [trip.startDate, trip.endDate, hotels]);

    if (tripDays.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100/50 p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">bed</span>
                    Cobertura de Hospedagem
                </h4>
                <span className="text-xs text-text-muted">
                    {tripDays.filter(d => d.covered).length}/{tripDays.length} noites cobertas
                </span>
            </div>

            <div className="flex w-full h-8 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/50">
                {tripDays.map((day, index) => (
                    <div
                        key={index}
                        className={`h-full border-r border-white/20 last:border-r-0 transition-all duration-300 relative group flex-1
                ${day.covered
                                ? 'bg-primary hover:bg-primary-dark'
                                : 'bg-transparent hover:bg-gray-200'
                            }`}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                            <p className="font-bold">{day.label}</p>
                            <p className="font-normal text-gray-300">
                                {day.covered ? day.hotelName : 'Sem hospedagem'}
                            </p>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccommodationProgressBar;
