import { parseISO, addMinutes, subMinutes, isBefore, isAfter, differenceInMinutes, isValid } from 'date-fns';
import { Transport, HotelReservation } from '../types';

export interface ConflictResult {
    type: 'overlap' | 'impossible_connection' | 'missing_transport' | 'checkout_after_flight' | 'checkin_before_flight' | 'location_mismatch';
    severity: 'warning' | 'error';
    message: string;
    suggestedFix?: string;
}

export class ConflictDetector {

    private parseDateTime(date: string, time: string): Date {
        // Basic combining of date and time.
        // In a real app with timezones, we would need the Transport object's arrival/departure timezone.
        // For this implementation, we assume dates/times are "local" to their event or comparable if in same context.
        return parseISO(`${date}T${time}`);
    }

    // Detects overlaps between transport segments
    checkTransportConflicts(
        newTransport: Transport,
        existingTransports: Transport[]
    ): ConflictResult[] {
        const conflicts: ConflictResult[] = [];

        // Helper to get start/end times
        const getTimes = (t: Transport) => {
            try {
                const start = this.parseDateTime(t.departureDate, t.departureTime);
                const end = this.parseDateTime(t.arrivalDate, t.arrivalTime);
                return { start, end };
            } catch (e) {
                return null;
            }
        };

        const newT = getTimes(newTransport);
        if (!newT) return []; // Invalid dates in new transport

        for (const existing of existingTransports) {
            if (existing.id === newTransport.id) continue;

            const exT = getTimes(existing);
            if (!exT) continue;

            // 1. Direct Time Overlap
            // New starts before Existing ends AND New ends after Existing starts
            if (isBefore(newT.start, exT.end) && isAfter(newT.end, exT.start)) {
                conflicts.push({
                    type: 'overlap',
                    severity: 'error',
                    message: `Conflito de horário com ${existing.type} (${existing.reference || 'Sem ref'}).`,
                    suggestedFix: 'Verifique os horários de partida e chegada.'
                });
            }

            // 2. Impossible Connection (Tight connection)
            // Logic: If one arrives shortly before the other departs at the SAME location (or generic connection)
            const bufferMinutesInternation = 120;
            const bufferMinutesDomestic = 60;

            // Case A: Existing arrives -> New departs (Connection)
            if (isBefore(exT.end, newT.start)) {
                const diff = differenceInMinutes(newT.start, exT.end);
                if (diff < bufferMinutesDomestic && diff >= 0) {
                    conflicts.push({
                        type: 'impossible_connection',
                        severity: 'warning',
                        message: `Conexão muito curta (${diff} min) após ${existing.type}.`,
                        suggestedFix: `Recomendado pelo menos ${bufferMinutesDomestic}min para conexões.`
                    });
                }
            }

            // Case B: New arrives -> Existing departs (Connection)
            if (isBefore(newT.end, exT.start)) {
                const diff = differenceInMinutes(exT.start, newT.end);
                if (diff < bufferMinutesDomestic && diff >= 0) {
                    conflicts.push({
                        type: 'impossible_connection',
                        severity: 'warning',
                        message: `Chegada muito próxima da partida de ${existing.type} (${diff} min).`,
                        suggestedFix: `Recomendado pelo menos ${bufferMinutesDomestic}min para conexões.`
                    });
                }
            }
        }

        return conflicts;
    }

    checkAccommodationConflicts(
        newAccommodation: HotelReservation,
        flights: Transport[]
    ): ConflictResult[] {
        const conflicts: ConflictResult[] = [];

        const checkInDate = parseISO(newAccommodation.checkIn); // Usually just Date, assume 14:00 if no time?
        // Let's assume CheckIn is 14:00 and CheckOut is 11:00 for strict checks, or just compare dates.
        // Simplification: Compare Dates.

        // 1. Check if arrival flight arrives AFTER check-in date (technically okay, just late check-in)
        // BUT if arrival flight arrives AFTER check-out date, that's an error.

        // 2. Check if departure flight leaves BEFORE check-out date (Waste of money? Or impossible?)
        // Critical: Departure flight leaves BEFORE check-in date. (Error)

        for (const flight of flights) {
            // Flight Departure DateTime
            const flightDep = this.parseDateTime(flight.departureDate, flight.departureTime);
            // Flight Arrival DateTime
            const flightArr = this.parseDateTime(flight.arrivalDate, flight.arrivalTime);

            // Hotel Dates (Set to start/end of day or standard hotel times)
            const hotelCheckIn = parseISO(`${newAccommodation.checkIn}T14:00:00`);
            const hotelCheckOut = parseISO(`${newAccommodation.checkOut}T11:00:00`);

            if (!isValid(flightDep) || !isValid(flightArr) || !isValid(hotelCheckIn) || !isValid(hotelCheckOut)) continue;

            // ERROR: Flight arrives AFTER Hotel Checkout (User misses the hotel entirely)
            if (isAfter(flightArr, hotelCheckOut)) {
                conflicts.push({
                    type: 'checkout_after_flight',
                    severity: 'error',
                    message: `O voo chega em ${flight.arrivalDate} mas o checkout do hotel é ${newAccommodation.checkOut}.`,
                    suggestedFix: 'Ajuste as datas da reserva.'
                });
            }

            // ERROR: Flight departs BEFORE Hotel Checkin (User leaves before staying)
            if (isBefore(flightDep, hotelCheckIn)) {
                conflicts.push({
                    type: 'checkin_before_flight',
                    severity: 'error',
                    message: `O voo parte em ${flight.departureDate} antes do check-in do hotel (${newAccommodation.checkIn}).`,
                    suggestedFix: 'Verifique a ordem da viagem.'
                });
            }

            // WARNING: Hotel in different city than Flight Arrival (if this is the arrival flight)
            // This requires complex logic to know WHICH flight is the arrival one for this hotel.
            // Simple heuristic: If flight arrival date == checkin date, cities should match.
            if (flight.arrivalDate === newAccommodation.checkIn && flight.arrivalCity && newAccommodation.address) {
                // Very fuzzy check. In real app, we'd use City IDs or robust geo-check.
                const cityMatch = newAccommodation.address.toLowerCase().includes(flight.arrivalCity.toLowerCase());
                if (!cityMatch) {
                    // Disabled for now to avoid false positives with unstructured addresses
                    // conflicts.push({ ... }) 
                }
            }
        }

        return conflicts;
    }
}

export const conflictDetector = new ConflictDetector();
