import { TripDocument, Transport, HotelReservation, CarRental, ItineraryActivity, ItineraryActivityType } from '../types';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';

export interface GenerationSource {
    documents: TripDocument[];
    transports: Transport[];
    accommodations: HotelReservation[];
    carRentals: CarRental[];
}

/**
 * Generates an itinerary preview from existing documents and entities
 */
export const generateItineraryFromDocuments = (
    tripId: string,
    startDate: string,
    sources: GenerationSource
): ItineraryActivity[] => {
    const activities: ItineraryActivity[] = [];
    const tripStart = parseISO(startDate);

    const getDayNumber = (dateStr: string) => {
        if (!dateStr) return 1;
        try {
            const date = parseISO(dateStr);
            return Math.max(1, differenceInDays(date, tripStart) + 1);
        } catch (e) {
            return 1;
        }
    };

    // 1. Map Transports
    sources.transports.forEach(t => {
        activities.push({
            id: `gen_t_${t.id}`,
            day: getDayNumber(t.departureDate),
            date: t.departureDate,
            time: t.departureTime || '00:00',
            title: `${getTransportEmoji(t.type)} ${t.type.toUpperCase()}: ${t.operator}`,
            location: t.departureLocation,
            type: 'transport',
            completed: false,
            notes: `Ref: ${t.reference || 'N/A'}`
        });
    });

    // 2. Map Accommodations
    sources.accommodations.forEach(acc => {
        // Check-in
        activities.push({
            id: `gen_acc_in_${acc.id}`,
            day: getDayNumber(acc.checkIn),
            date: acc.checkIn,
            time: acc.checkInTime || '15:00',
            title: `🏨 Check-in: ${acc.name}`,
            location: acc.address,
            type: 'accommodation',
            completed: false,
            notes: `Conf: ${acc.confirmation || 'N/A'}`
        });

        // Check-out
        activities.push({
            id: `gen_acc_out_${acc.id}`,
            day: getDayNumber(acc.checkOut),
            date: acc.checkOut,
            time: acc.checkOutTime || '11:00',
            title: `👋 Check-out: ${acc.name}`,
            location: acc.address,
            type: 'accommodation',
            completed: false
        });
    });

    // 3. Map Car Rentals
    sources.carRentals.forEach(car => {
        activities.push({
            id: `gen_car_${car.id}`,
            day: getDayNumber(car.startDate),
            date: car.startDate,
            time: '10:00',
            title: `🚗 Retirada Carro: ${car.company}`,
            location: car.pickupLocation,
            type: 'transport',
            completed: false,
            notes: `Modelo: ${car.model}. Ref: ${car.confirmation}`
        });
    });

    // Sort by day and time
    return activities.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.time.localeCompare(b.time);
    });
};

const getTransportEmoji = (type: string) => {
    switch (type) {
        case 'flight': return '✈️';
        case 'train': return '🚂';
        case 'bus': return '🚌';
        case 'car': return '🚗';
        case 'ferry': return '⛴️';
        default: return '🚀';
    }
};

/**
 * Simple gap analysis (can be expanded with AI later)
 */
export const identifyItineraryGaps = (
    activities: ItineraryActivity[],
    totalDays: number
): number[] => {
    const activeDays = new Set(activities.map(a => a.day));
    const gaps: number[] = [];

    for (let i = 1; i <= totalDays; i++) {
        if (!activeDays.has(i)) {
            gaps.push(i);
        }
    }

    return gaps;
};
