import airportsData from '../data/iataAirports.json';
import airlinesData from '../data/airlines.json';

// Types matches the user request
export interface EnrichedAirport {
    name: string;
    city: string;
    country: string;
    timezone: string;
}

export interface EnrichedAirline {
    name: string;
    logo: string;
    alliance: string | null;
}

export interface EnrichedHotel {
    address: string;
    stars: number;
    rating: number; // 0-5 or 0-10
    image: string;
    coordinates: { lat: number; lng: number };
}

export interface EnrichedCarRental {
    logo: string;
    emergencyPhone: string;
}

class EnrichmentService {
    private airportCache = new Map<string, EnrichedAirport>();
    private airlineCache = new Map<string, EnrichedAirline>();

    constructor() {
        // Pre-populate with local data
        airportsData.forEach(a => {
            this.airportCache.set(a.code, {
                name: a.name,
                city: a.city,
                country: a.country,
                timezone: a.timezone
            });
        });

        airlinesData.forEach(a => {
            this.airlineCache.set(a.code, {
                name: a.name,
                logo: a.logo,
                alliance: a.alliance
            });
        });
    }

    async enrichAirport(iataCode: string): Promise<EnrichedAirport | null> {
        const code = iataCode.toUpperCase();
        if (this.airportCache.has(code)) {
            return this.airportCache.get(code)!;
        }

        // Fallback: Real implementation would fetch from OpenFlights or API
        // For now, return a generic placeholder if not strict or null
        console.warn(`Airport ${code} not found in local DB.`);
        return null;
    }

    async enrichAirline(iataCode: string): Promise<EnrichedAirline | null> {
        const code = iataCode.toUpperCase();
        if (this.airlineCache.has(code)) {
            return this.airlineCache.get(code)!;
        }

        // Fallback logic
        console.warn(`Airline ${code} not found in local DB.`);
        return null;
    }

    async enrichHotel(name: string, city?: string): Promise<EnrichedHotel> {
        // Placeholder: Integration with Google Places would happen here.
        // Since we don't have a live key/service setup in this file for Places directly (usually usage is client-side via Google Maps JS API),
        // we will simulate a realistic response or use a simple mock.

        // Mock simulation
        return {
            address: `${name} St, ${city || 'Unknown City'}`,
            stars: 4,
            rating: 4.5,
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
            coordinates: { lat: 0, lng: 0 } // Would come from Geocoding
        };
    }

    async enrichCarRental(company: string): Promise<EnrichedCarRental> {
        // Mock
        return {
            logo: "https://cdn-icons-png.flaticon.com/512/3097/3097180.png", // Generic car icon
            emergencyPhone: "+1 800 123 4567"
        };
    }
}

export const enrichmentService = new EnrichmentService();
