import { City } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface DateOverlap {
    cityA: City;
    cityB: City;
    overlapDays: number;
    overlapStart: string;
    overlapEnd: string;
}

export interface DateGap {
    afterCity: City;
    beforeCity: City;
    gapDays: number;
    gapStart: string;
    gapEnd: string;
}

export interface DateValidationResult {
    isValid: boolean;
    overlaps: DateOverlap[];
    gaps: DateGap[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse date string to Date object at noon (to avoid timezone issues)
 */
const parseDate = (dateStr: string): Date => {
    return new Date(dateStr + 'T12:00:00');
};

/**
 * Format Date to YYYY-MM-DD string
 */
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Calculate days between two dates
 */
const daysBetween = (start: Date, end: Date): number => {
    const diffTime = end.getTime() - start.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// =============================================================================
// Main Validation Functions
// =============================================================================

/**
 * Check if a new city's dates overlap with any existing cities
 */
export function checkDateOverlap(
    existingCities: City[],
    newArrival: string,
    newDeparture: string,
    excludeCityId?: string
): DateOverlap[] {
    const overlaps: DateOverlap[] = [];
    const newStart = parseDate(newArrival);
    const newEnd = parseDate(newDeparture);

    existingCities.forEach(city => {
        // Skip the city being edited
        if (excludeCityId && city.id === excludeCityId) return;

        const cityStart = parseDate(city.arrivalDate);
        const cityEnd = parseDate(city.departureDate);

        // Check for overlap: ranges overlap if start1 <= end2 AND start2 <= end1
        if (newStart <= cityEnd && cityStart <= newEnd) {
            const overlapStart = new Date(Math.max(newStart.getTime(), cityStart.getTime()));
            const overlapEnd = new Date(Math.min(newEnd.getTime(), cityEnd.getTime()));
            const overlapDays = daysBetween(overlapStart, overlapEnd) + 1;

            overlaps.push({
                cityA: city,
                cityB: {
                    id: 'new',
                    name: 'Nova Cidade',
                    country: '',
                    arrivalDate: newArrival,
                    departureDate: newDeparture,
                    nights: 0,
                    headline: '',
                    image: ''
                },
                overlapDays,
                overlapStart: formatDate(overlapStart),
                overlapEnd: formatDate(overlapEnd),
            });
        }
    });

    return overlaps;
}

/**
 * Find gaps between cities (days without a destination)
 * Cities must be sorted by arrivalDate
 */
export function findDateGaps(cities: City[], tripStart?: string, tripEnd?: string): DateGap[] {
    if (cities.length === 0) return [];

    const gaps: DateGap[] = [];
    const sortedCities = [...cities].sort((a, b) =>
        parseDate(a.arrivalDate).getTime() - parseDate(b.arrivalDate).getTime()
    );

    // Check each consecutive pair
    for (let i = 0; i < sortedCities.length - 1; i++) {
        const current = sortedCities[i];
        const next = sortedCities[i + 1];

        const currentEnd = parseDate(current.departureDate);
        const nextStart = parseDate(next.arrivalDate);

        // Add one day to current end to get the day after departure
        const gapStart = new Date(currentEnd);
        gapStart.setDate(gapStart.getDate() + 1);

        // Subtract one day from next start to get the day before arrival
        const gapEnd = new Date(nextStart);
        gapEnd.setDate(gapEnd.getDate() - 1);

        const gapDays = daysBetween(gapStart, gapEnd) + 1;

        if (gapDays > 0) {
            gaps.push({
                afterCity: current,
                beforeCity: next,
                gapDays,
                gapStart: formatDate(gapStart),
                gapEnd: formatDate(gapEnd),
            });
        }
    }

    return gaps;
}

/**
 * Validate all cities and return comprehensive result
 */
export function validateAllCityDates(
    cities: City[],
    tripStart?: string,
    tripEnd?: string
): DateValidationResult {
    const allOverlaps: DateOverlap[] = [];

    // Check each pair of cities for overlap
    for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
            const cityA = cities[i];
            const cityB = cities[j];

            const overlaps = checkDateOverlap(
                [cityA],
                cityB.arrivalDate,
                cityB.departureDate
            );

            if (overlaps.length > 0) {
                allOverlaps.push({
                    ...overlaps[0],
                    cityB: cityB,
                });
            }
        }
    }

    const gaps = findDateGaps(cities, tripStart, tripEnd);

    return {
        isValid: allOverlaps.length === 0,
        overlaps: allOverlaps,
        gaps,
    };
}

// =============================================================================
// Message Helpers
// =============================================================================

/**
 * Get human-readable warning message for overlaps
 */
export function getOverlapWarning(overlaps: DateOverlap[]): string {
    if (overlaps.length === 0) return '';

    const messages = overlaps.map(o =>
        `${o.cityA.name}: ${o.overlapDays} dia(s) de sobreposição (${new Date(o.overlapStart + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        } - ${new Date(o.overlapEnd + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        })`
    );

    return `⚠️ Datas conflitantes com: ${messages.join(', ')}`;
}

/**
 * Get human-readable info message for gaps
 */
export function getGapInfo(gaps: DateGap[]): string {
    if (gaps.length === 0) return '';

    const messages = gaps.map(g =>
        `${g.gapDays} dia(s) sem destino entre ${g.afterCity.name} e ${g.beforeCity.name}`
    );

    return `ℹ️ ${messages.join('; ')}`;
}
