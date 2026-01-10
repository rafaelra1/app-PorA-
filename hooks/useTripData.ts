import { useMemo, useEffect, useCallback } from 'react';
import { useItinerary } from '../contexts/ItineraryContext';
import { useAccommodation } from '../contexts/AccommodationContext';
import { useTransport } from '../contexts/TransportContext';
import { ItineraryActivity, HotelReservation, Transport } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface TripDataResult {
    /** All activities for the trip */
    activities: ItineraryActivity[];
    /** All accommodations for the trip */
    accommodations: HotelReservation[];
    /** All transports for the trip */
    transports: Transport[];
    /** Combined loading state */
    isLoading: boolean;
    /** Combined error state */
    error: string | null;
    /** Refresh all data */
    refresh: () => Promise<void>;
}

export interface TripDataStats {
    /** Total number of activities */
    totalActivities: number;
    /** Total number of accommodations */
    totalAccommodations: number;
    /** Total number of transports */
    totalTransports: number;
    /** Activities grouped by day */
    activitiesByDay: Map<number, ItineraryActivity[]>;
    /** Activities grouped by type */
    activitiesByType: Map<string, ItineraryActivity[]>;
    /** Total nights of accommodation */
    totalNights: number;
    /** Number of flights */
    totalFlights: number;
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to access combined trip data from multiple contexts
 *
 * This hook consolidates data from Itinerary, Accommodation, and Transport contexts
 * into a single, easy-to-use interface. It automatically fetches data when the
 * tripId changes and provides a unified loading/error state.
 *
 * @param tripId - The ID of the trip to fetch data for
 * @param options - Optional configuration
 * @returns Combined trip data with loading state and refresh function
 *
 * @example
 * ```tsx
 * const { activities, accommodations, transports, isLoading } = useTripData(tripId);
 *
 * if (isLoading) return <Loading />;
 *
 * return (
 *   <div>
 *     <h3>{activities.length} atividades</h3>
 *     <h3>{accommodations.length} hospedagens</h3>
 *     <h3>{transports.length} transportes</h3>
 *   </div>
 * );
 * ```
 */
export function useTripData(
    tripId: string | null | undefined,
    options?: {
        /** Whether to auto-fetch on mount/tripId change (default: true) */
        autoFetch?: boolean;
    }
): TripDataResult {
    const { autoFetch = true } = options || {};

    // Get data from individual contexts
    const {
        activities: allActivities,
        isLoading: activitiesLoading,
        error: activitiesError,
        fetchActivities
    } = useItinerary();

    const {
        accommodations: allAccommodations,
        isLoading: accommodationsLoading,
        error: accommodationsError,
        fetchAccommodations
    } = useAccommodation();

    const {
        transports: allTransports,
        isLoading: transportsLoading,
        error: transportsError,
        fetchTransports
    } = useTransport();

    // Combined loading state
    const isLoading = activitiesLoading || accommodationsLoading || transportsLoading;

    // Combined error state (first error found)
    const error = activitiesError || accommodationsError || transportsError;

    // Fetch all data for the trip
    const refresh = useCallback(async () => {
        if (!tripId) return;

        await Promise.all([
            fetchActivities(tripId),
            fetchAccommodations(tripId),
            fetchTransports(tripId)
        ]);
    }, [tripId, fetchActivities, fetchAccommodations, fetchTransports]);

    // Auto-fetch on mount and tripId change
    useEffect(() => {
        if (autoFetch && tripId) {
            refresh();
        }
    }, [tripId, autoFetch, refresh]);

    // The contexts already filter by trip internally when fetching,
    // so we just return all data from the contexts
    // Note: If contexts don't filter, uncomment the memoized filtered versions below

    return useMemo(() => ({
        activities: allActivities,
        accommodations: allAccommodations,
        transports: allTransports,
        isLoading,
        error,
        refresh
    }), [allActivities, allAccommodations, allTransports, isLoading, error, refresh]);
}

// =============================================================================
// Stats Hook
// =============================================================================

/**
 * Hook to get computed statistics for trip data
 *
 * @param tripData - Data from useTripData hook
 * @returns Computed statistics about the trip
 *
 * @example
 * ```tsx
 * const tripData = useTripData(tripId);
 * const stats = useTripDataStats(tripData);
 *
 * console.log(`${stats.totalActivities} atividades em ${stats.activitiesByDay.size} dias`);
 * ```
 */
export function useTripDataStats(
    tripData: Pick<TripDataResult, 'activities' | 'accommodations' | 'transports'>
): TripDataStats {
    return useMemo(() => {
        const { activities, accommodations, transports } = tripData;

        // Group activities by day
        const activitiesByDay = new Map<number, ItineraryActivity[]>();
        activities.forEach(activity => {
            const day = activity.day;
            if (!activitiesByDay.has(day)) {
                activitiesByDay.set(day, []);
            }
            activitiesByDay.get(day)!.push(activity);
        });

        // Group activities by type
        const activitiesByType = new Map<string, ItineraryActivity[]>();
        activities.forEach(activity => {
            const type = activity.type;
            if (!activitiesByType.has(type)) {
                activitiesByType.set(type, []);
            }
            activitiesByType.get(type)!.push(activity);
        });

        // Calculate total nights
        const totalNights = accommodations.reduce((sum, acc) => sum + (acc.nights || 0), 0);

        // Count flights
        const totalFlights = transports.filter(t => t.type === 'flight').length;

        return {
            totalActivities: activities.length,
            totalAccommodations: accommodations.length,
            totalTransports: transports.length,
            activitiesByDay,
            activitiesByType,
            totalNights,
            totalFlights
        };
    }, [tripData]);
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to get activities for a specific day
 *
 * @param tripId - Trip ID
 * @param day - Day number (1-indexed)
 * @returns Activities for the specified day
 */
export function useDayActivities(tripId: string | null | undefined, day: number) {
    const { activities } = useTripData(tripId);

    return useMemo(() => {
        return activities
            .filter(a => a.day === day)
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [activities, day]);
}

/**
 * Hook to get upcoming transports (from today)
 *
 * @param tripId - Trip ID
 * @returns Upcoming transports sorted by date
 */
export function useUpcomingTransports(tripId: string | null | undefined) {
    const { transports } = useTripData(tripId);

    return useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return transports
            .filter(t => t.departureDate >= today)
            .sort((a, b) => {
                const dateCompare = a.departureDate.localeCompare(b.departureDate);
                if (dateCompare !== 0) return dateCompare;
                return (a.departureTime || '').localeCompare(b.departureTime || '');
            });
    }, [transports]);
}

/**
 * Hook to get current accommodation (based on today's date)
 *
 * @param tripId - Trip ID
 * @returns Current accommodation or null
 */
export function useCurrentAccommodation(tripId: string | null | undefined) {
    const { accommodations } = useTripData(tripId);

    return useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return accommodations.find(acc => {
            return acc.checkIn <= today && acc.checkOut >= today;
        }) || null;
    }, [accommodations]);
}

export default useTripData;
