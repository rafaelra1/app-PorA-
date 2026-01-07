import React, { useMemo } from 'react';
import { Trip, HotelReservation, Transport } from '../../../types';
import { differenceInCalendarDays, parse, addDays, isSameDay, isWithinInterval } from 'date-fns';

interface TravelCoverageProps {
    trip: Trip;
    hotels: HotelReservation[];
    transports: Transport[];
}

const TravelCoverage: React.FC<TravelCoverageProps> = ({ trip, hotels, transports }) => {
    const { totalNights, accommodationCoverage, transportCoverage, totalDays } = useMemo(() => {
        const startDate = parse(trip.startDate, 'dd/MM/yyyy', new Date());
        const endDate = parse(trip.endDate, 'dd/MM/yyyy', new Date());

        // Calculate Total Nights (as per user request: start to end diff)
        const totalNights = differenceInCalendarDays(endDate, startDate);
        // Total days for transport logic (usually includes the last day for return travel)
        const totalDays = totalNights + 1; // 14 to 06 is 20 nights, but 21 days involved

        // --- Accommodation Coverage Logic ---
        let coveredNightsCount = 0;

        // We check each night from start date up to (but not including) end date
        for (let i = 0; i < totalNights; i++) {
            const nightDate = addDays(startDate, i);

            // Check if this night is covered by any hotel reservation
            const isCovered = hotels.some(hotel => {
                if (hotel.status === 'cancelled') return false;
                const checkIn = parse(hotel.checkIn, 'dd/MM/yyyy', new Date());
                const checkOut = parse(hotel.checkOut, 'dd/MM/yyyy', new Date());

                // Night is covered if: checkIn <= nightDate < checkOut
                // We use isWithinInterval but need to handle the exclusive end carefully or just simple comparison
                return (
                    (isSameDay(nightDate, checkIn) || nightDate > checkIn) &&
                    nightDate < checkOut
                );
            });

            if (isCovered) {
                coveredNightsCount++;
            }
        }

        // --- Transport Coverage Logic ---
        // "Considere dias com aluguel de carro ou datas de voos/trens como 'dias cobertos'"
        // We will check each DAY (including the last one)
        let coveredDaysCount = 0;

        for (let i = 0; i < totalDays; i++) {
            const currentDay = addDays(startDate, i);

            const isCovered = transports.some(transport => {
                if (transport.status === 'cancelled') return false;

                // Case 1: Car Rental (Range)
                if (transport.type === 'car') {
                    // Assuming car rental has startDate/endDate or departureDate/arrivalDate mapping to pickup/dropoff
                    // Trip type interface uses startDate/endDate for CarRental but Transport uses departureDate/arrivalDate
                    // types.ts: Transport has departureDate/arrivalDate.
                    const pickup = parse(transport.departureDate, 'dd/MM/yyyy', new Date());
                    const dropoff = parse(transport.arrivalDate, 'dd/MM/yyyy', new Date());

                    return isWithinInterval(currentDay, { start: pickup, end: dropoff });
                }

                // Case 2: Flight/Train/Bus (Point in time)
                // Covered if the day matches departure OR arrival date
                const departure = parse(transport.departureDate, 'dd/MM/yyyy', new Date());
                const arrival = parse(transport.arrivalDate, 'dd/MM/yyyy', new Date());

                return isSameDay(currentDay, departure) || isSameDay(currentDay, arrival);
            });

            if (isCovered) {
                coveredDaysCount++;
            }
        }

        return {
            totalNights,
            totalDays,
            accommodationCoverage: coveredNightsCount,
            transportCoverage: coveredDaysCount
        };
    }, [trip.startDate, trip.endDate, hotels, transports]);

    const accPercentage = Math.min(Math.round((accommodationCoverage / totalNights) * 100), 100);
    // For transport, we compare to totalDays as travel can happen on the last day too
    const transPercentage = Math.min(Math.round((transportCoverage / totalDays) * 100), 100);

    return (
        <div className="space-y-4">

            {/* Accommodation Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">hotel</span>
                        <span className="text-sm font-bold text-text-main">Hospedagem</span>
                    </div>
                    <span className="text-xs text-text-muted font-medium">
                        <strong className="text-text-main">{accommodationCoverage}</strong>/{totalNights} noites
                    </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${accPercentage}%` }}
                    />
                </div>
            </div>

            {/* Transport Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">directions_car</span>
                        <span className="text-sm font-bold text-text-main">Transporte</span>
                    </div>
                    <span className="text-xs text-text-muted font-medium">
                        <strong className="text-text-main">{transportCoverage}</strong>/{totalDays} dias
                    </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${transPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TravelCoverage;
