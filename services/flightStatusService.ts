// services/flightStatusService.ts
// Flight Status API service for real-time flight tracking

import { FlightLiveStatus, FlightStatusCode, FlightStatusChange } from '../types';

// Cache for flight status data
interface CacheEntry {
    data: FlightLiveStatus;
    timestamp: number;
}

const flightStatusCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// Status labels in PT-BR
const STATUS_LABELS: Record<FlightStatusCode, string> = {
    scheduled: 'Programado',
    active: 'Em Voo',
    landed: 'Pousou',
    cancelled: 'Cancelado',
    diverted: 'Desviado',
    delayed: 'Atrasado',
    unknown: 'Desconhecido',
};

// Status colors for UI
export const STATUS_COLORS: Record<FlightStatusCode, { bg: string; text: string; border: string }> = {
    scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    active: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    landed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    diverted: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    delayed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

// Mock data generator for development
function generateMockFlightStatus(flightNumber: string, date: string): FlightLiveStatus {
    const statuses: FlightStatusCode[] = ['scheduled', 'active', 'landed', 'delayed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const baseDate = new Date(date);
    const scheduledDeparture = new Date(baseDate);
    scheduledDeparture.setHours(10, 30, 0, 0);

    const scheduledArrival = new Date(scheduledDeparture);
    scheduledArrival.setHours(scheduledArrival.getHours() + 10);

    const delay = randomStatus === 'delayed' ? Math.floor(Math.random() * 60) + 15 : 0;

    return {
        flightNumber,
        status: randomStatus,
        departureAirport: 'GRU',
        departureTerminal: '3',
        departureGate: String(Math.floor(Math.random() * 50) + 200),
        scheduledDeparture: scheduledDeparture.toISOString(),
        estimatedDeparture: delay > 0
            ? new Date(scheduledDeparture.getTime() + delay * 60000).toISOString()
            : undefined,
        actualDeparture: randomStatus === 'active' || randomStatus === 'landed'
            ? new Date(scheduledDeparture.getTime() + delay * 60000).toISOString()
            : undefined,
        arrivalAirport: 'LIS',
        arrivalTerminal: '1',
        arrivalGate: randomStatus === 'landed' ? String(Math.floor(Math.random() * 30) + 10) : undefined,
        arrivalBaggage: randomStatus === 'landed' ? String(Math.floor(Math.random() * 10) + 1) : undefined,
        scheduledArrival: scheduledArrival.toISOString(),
        estimatedArrival: delay > 0
            ? new Date(scheduledArrival.getTime() + delay * 60000).toISOString()
            : undefined,
        actualArrival: randomStatus === 'landed'
            ? new Date(scheduledArrival.getTime() + delay * 60000).toISOString()
            : undefined,
        departureDelay: delay > 0 ? delay : undefined,
        arrivalDelay: delay > 0 ? delay : undefined,
        aircraftType: 'Airbus A350-900',
        aircraftRegistration: 'PR-XTD',
        lastUpdated: new Date().toISOString(),
    };
}

export const flightStatusService = {
    /**
     * Get flight status for a specific flight
     * @param flightNumber Flight number (e.g., "LA8084")
     * @param date Date of the flight in ISO format
     * @returns FlightLiveStatus or null if not found
     */
    async getFlightStatus(flightNumber: string, date: string): Promise<FlightLiveStatus | null> {
        const cacheKey = `${flightNumber}-${date}`;
        const cached = flightStatusCache.get(cacheKey);

        // Return cached data if still valid
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        try {
            // TODO: Replace with real API call to AviationStack or AeroDataBox
            // const response = await fetch(`https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}`);
            // const data = await response.json();

            // For now, use mock data
            const mockData = generateMockFlightStatus(flightNumber, date);

            // Cache the result
            flightStatusCache.set(cacheKey, {
                data: mockData,
                timestamp: Date.now(),
            });

            return mockData;
        } catch (error) {
            console.error('Error fetching flight status:', error);
            return null;
        }
    },

    /**
     * Get status for multiple flights at once
     * @param flights Array of flight objects with flightNumber and date
     * @returns Array of FlightLiveStatus
     */
    async getMultipleFlightStatuses(
        flights: { flightNumber: string; date: string }[]
    ): Promise<FlightLiveStatus[]> {
        const results = await Promise.all(
            flights.map(f => this.getFlightStatus(f.flightNumber, f.date))
        );
        return results.filter((r): r is FlightLiveStatus => r !== null);
    },

    /**
     * Detect changes between previous and current status
     * @param previous Previous status (or null if first check)
     * @param current Current status
     * @returns Array of detected changes
     */
    detectChanges(
        previous: FlightLiveStatus | null,
        current: FlightLiveStatus,
        transportId: string
    ): FlightStatusChange[] {
        const changes: FlightStatusChange[] = [];
        const now = new Date().toISOString();

        if (!previous) {
            return changes;
        }

        // Status change
        if (previous.status !== current.status) {
            let changeType: FlightStatusChange['changeType'] = 'status_update';
            let details = `Status alterado de ${STATUS_LABELS[previous.status]} para ${STATUS_LABELS[current.status]}`;

            if (current.status === 'cancelled') {
                changeType = 'cancellation';
                details = `Voo ${current.flightNumber} foi CANCELADO`;
            } else if (current.status === 'diverted') {
                changeType = 'diversion';
                details = `Voo ${current.flightNumber} foi desviado`;
            } else if (current.status === 'delayed' || (current.departureDelay && current.departureDelay > 0)) {
                changeType = 'delay';
                details = `Voo ${current.flightNumber} atrasado ${current.departureDelay || 0} minutos`;
            }

            changes.push({
                transportId,
                previousStatus: previous.status,
                newStatus: current.status,
                changeType,
                details,
                timestamp: now,
            });
        }

        // Gate change
        if (previous.departureGate && current.departureGate && previous.departureGate !== current.departureGate) {
            changes.push({
                transportId,
                previousStatus: previous.status,
                newStatus: current.status,
                changeType: 'gate_change',
                details: `Portão de embarque alterado de ${previous.departureGate} para ${current.departureGate}`,
                timestamp: now,
            });
        }

        return changes;
    },

    /**
     * Format delay in minutes to human-readable string
     * @param minutes Delay in minutes
     * @returns Formatted string (e.g., "1h 30min" or "45min")
     */
    formatDelay(minutes: number): string {
        if (minutes < 60) {
            return `${minutes}min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    },

    /**
     * Get PT-BR label for status code
     * @param status FlightStatusCode
     * @returns Localized label
     */
    getStatusLabel(status: FlightStatusCode): string {
        return STATUS_LABELS[status] || 'Desconhecido';
    },

    /**
     * Check if a flight is eligible for tracking (within 48h of departure)
     * @param departureDate Departure date in ISO format or DD/MM/YYYY
     * @returns true if trackable
     */
    isTrackable(departureDate: string): boolean {
        const now = new Date();
        let departure: Date;

        // Handle DD/MM/YYYY format
        if (departureDate.includes('/')) {
            const [day, month, year] = departureDate.split('/').map(Number);
            departure = new Date(year, month - 1, day);
        } else {
            departure = new Date(departureDate);
        }

        const diff = departure.getTime() - now.getTime();
        const hoursDiff = diff / (1000 * 60 * 60);

        // Trackable if departure is within next 48 hours or already departed (but less than 24h ago)
        return hoursDiff <= 48 && hoursDiff >= -24;
    },

    /**
     * Clear the cache for a specific flight or all flights
     * @param flightNumber Optional flight number to clear specific cache
     */
    clearCache(flightNumber?: string): void {
        if (flightNumber) {
            for (const key of flightStatusCache.keys()) {
                if (key.startsWith(flightNumber)) {
                    flightStatusCache.delete(key);
                }
            }
        } else {
            flightStatusCache.clear();
        }
    },
};

export default flightStatusService;
