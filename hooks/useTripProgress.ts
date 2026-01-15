import { useMemo } from 'react';
import { Trip, City } from '../types';
import { calculateNights } from '../lib/dateUtils';

interface TripStats {
    cities?: number;
    days?: number;
    hotels?: number;
    transports?: number;
    checklistComplete?: number;
    checklistTotal?: number;
    activeDays?: number; // Days with at least one activity
}

interface SectionProgress {
    overview: number;
    itinerary: number;
    logistics: number;
    docs: number;
    budget: number;
    checklist: number;
    [key: string]: number; // Allow dynamic keys
}

/**
 * Hook to calculate completion progress for each trip section
 * Used to show progress bars in the sidebar
 */
export function useTripProgress(trip: Trip, stats: TripStats): SectionProgress {
    return useMemo(() => {
        // Basic validation
        if (!trip) {
            return { overview: 0, itinerary: 0, logistics: 0, docs: 0, budget: 0, checklist: 0 };
        }

        const tripDays = trip.startDate && trip.endDate
            ? calculateNights(trip.startDate, trip.endDate) + 1
            : 0;

        // Calculate itinerary progress: % of days that have activities
        // Note: This relies on stats.activeDays which needs to be calculated elsewhere or derived here
        // For now we'll use a simple heuristic if stats.activeDays isn't available
        const itineraryProgress = tripDays > 0 && stats.activeDays !== undefined
            ? Math.min(100, (stats.activeDays / tripDays) * 100)
            : 0;

        // Logistics progress: Do we have at least one hotel and one transport?
        // Heuristic: 50% for hotel, 50% for transport (if needed)
        // Simple version: 100% if we have both
        const hasHotel = (stats.hotels || 0) > 0;
        const hasTransport = (stats.transports || 0) > 0;
        const logisticsProgress = (hasHotel ? 50 : 0) + (hasTransport ? 50 : 0);

        // Docs progress: Do we have passports for travelers? (Mock logic for now)
        // If we have any custom docs uploaded, assume some progress
        const docsProgress = (stats.checklistComplete || 0) > 0 ? 50 : 0;

        // Budget progress: Is a budget set?
        // If trip has a budget value > 0, we assume this section is "started"
        // Since types.ts doesn't explicitly show totalBudget on Trip interface (it's passed to BudgetView separately sometimes),
        // we might need to check if expenses exist
        const budgetProgress = (stats.expenses || 0) > 0 ? 100 : 0;

        // Checklist progress: direct calculation
        const checklistProgress = stats.checklistTotal && stats.checklistTotal > 0
            ? (stats.checklistComplete || 0) / stats.checklistTotal * 100
            : 0;

        return {
            overview: 100, // Overview is always "ready"
            itinerary: itineraryProgress,
            logistics: logisticsProgress,
            docs: docsProgress,
            budget: budgetProgress,
            checklist: checklistProgress,
        };
    }, [trip, stats]);
}

export default useTripProgress;
