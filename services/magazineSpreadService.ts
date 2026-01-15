// =============================================================================
// Magazine Spread Service
// Handles caching and retrieval of generated magazine spreads from Supabase
// =============================================================================

import { supabase } from '../lib/supabase';
import { DailyMagazineSpread } from '../types/magazine';
import { ItineraryActivity } from '../types';

// Hash activities to detect changes
function hashActivities(activities: ItineraryActivity[]): string {
    const ids = activities.map(a => a.id).sort().join(',');
    // Simple hash for cache invalidation
    let hash = 0;
    for (let i = 0; i < ids.length; i++) {
        const char = ids.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

/**
 * Get cached magazine spread for a specific day
 */
export async function getCachedSpread(
    tripId: string,
    dayNumber: number,
    activities: ItineraryActivity[]
): Promise<DailyMagazineSpread | null> {
    try {
        const activitiesHash = hashActivities(activities);

        const { data, error } = await supabase
            .from('magazine_spreads')
            .select('*')
            .eq('trip_id', tripId)
            .eq('day_number', dayNumber)
            .eq('activities_hash', activitiesHash)
            .maybeSingle();

        if (error) {
            console.error('[MagazineSpreadService] Error fetching cached spread:', error);
            return null;
        }

        if (data?.content) {
            console.log(`[MagazineSpreadService] Cache HIT for day ${dayNumber}`);
            return data.content as DailyMagazineSpread;
        }

        console.log(`[MagazineSpreadService] Cache MISS for day ${dayNumber}`);
        return null;
    } catch (error) {
        console.error('[MagazineSpreadService] getCachedSpread error:', error);
        return null;
    }
}

/**
 * Cache a generated magazine spread
 */
export async function cacheSpread(
    tripId: string,
    userId: string,
    spread: DailyMagazineSpread,
    activities: ItineraryActivity[]
): Promise<boolean> {
    try {
        const activitiesHash = hashActivities(activities);

        const { error } = await supabase
            .from('magazine_spreads')
            .upsert({
                trip_id: tripId,
                user_id: userId,
                day_number: spread.dayNumber,
                date: spread.date,
                city: spread.city,
                content: spread,
                activities_hash: activitiesHash,
            }, {
                onConflict: 'trip_id,day_number',
            });

        if (error) {
            console.error('[MagazineSpreadService] Error caching spread:', error);
            return false;
        }

        console.log(`[MagazineSpreadService] Cached spread for day ${spread.dayNumber}`);
        return true;
    } catch (error) {
        console.error('[MagazineSpreadService] cacheSpread error:', error);
        return false;
    }
}

/**
 * Invalidate cache for a specific day (force refresh)
 */
export async function invalidateSpreadCache(
    tripId: string,
    dayNumber: number
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('magazine_spreads')
            .delete()
            .eq('trip_id', tripId)
            .eq('day_number', dayNumber);

        if (error) {
            console.error('[MagazineSpreadService] Error invalidating cache:', error);
            return false;
        }

        console.log(`[MagazineSpreadService] Invalidated cache for day ${dayNumber}`);
        return true;
    } catch (error) {
        console.error('[MagazineSpreadService] invalidateSpreadCache error:', error);
        return false;
    }
}

/**
 * Invalidate all cached spreads for a trip
 */
export async function invalidateTripCache(tripId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('magazine_spreads')
            .delete()
            .eq('trip_id', tripId);

        if (error) {
            console.error('[MagazineSpreadService] Error invalidating trip cache:', error);
            return false;
        }

        console.log(`[MagazineSpreadService] Invalidated all spreads for trip ${tripId}`);
        return true;
    } catch (error) {
        console.error('[MagazineSpreadService] invalidateTripCache error:', error);
        return false;
    }
}
