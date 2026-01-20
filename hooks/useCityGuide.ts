import { useState, useCallback, useMemo } from 'react';
import { getGeminiService } from '../services/geminiService';
import { City, CityGuide, GroundingInfo } from '../types';
import { useTrips } from '../contexts/TripContext';

// =============================================================================
// Types & Constants
// =============================================================================

interface CachedCityGuide {
    guide: CityGuide;
    cachedAt: number; // timestamp
}

const CACHE_KEY_PREFIX = 'city-guide-';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface UseCityGuideReturn {
    cityGuide: CityGuide | null;
    groundingInfo: string;
    groundingLinks: any[];
    isLoadingGuide: boolean;
    isLoadingGrounding: boolean;
    error: string | null;
    isCached: boolean;
    lastUpdated: Date | null;
    fetchCityGuide: (city: City, forceRefresh?: boolean) => Promise<void>;
    fetchGroundingInfo: (cityName: string) => Promise<void>;
    invalidateCache: (cityId: string) => void;
    reset: () => void;
}

// =============================================================================
// Cache Helper Functions
// =============================================================================

const getCacheKey = (cityId: string): string => `${CACHE_KEY_PREFIX}${cityId}`;

const getFromCache = (cityId: string): CachedCityGuide | null => {
    try {
        const cached = localStorage.getItem(getCacheKey(cityId));
        if (!cached) return null;

        const parsed: CachedCityGuide = JSON.parse(cached);
        const age = Date.now() - parsed.cachedAt;

        // Return null if cache is expired
        if (age > CACHE_DURATION_MS) {
            localStorage.removeItem(getCacheKey(cityId));
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
};

const saveToCache = (cityId: string, guide: CityGuide): void => {
    try {
        const cached: CachedCityGuide = {
            guide,
            cachedAt: Date.now(),
        };
        localStorage.setItem(getCacheKey(cityId), JSON.stringify(cached));
    } catch (error) {
        console.error('Error saving to cache:', error);
        // Handle quota exceeded - clear old caches
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            clearOldCaches();
        }
    }
};

const clearOldCaches = (): void => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
    const caches: { key: string; cachedAt: number }[] = [];

    keys.forEach(key => {
        try {
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            caches.push({ key, cachedAt: cached.cachedAt || 0 });
        } catch {
            // Remove invalid entries
            localStorage.removeItem(key);
        }
    });

    // Sort by oldest first and remove half of them
    caches.sort((a, b) => a.cachedAt - b.cachedAt);
    const toRemove = Math.ceil(caches.length / 2);
    caches.slice(0, toRemove).forEach(c => localStorage.removeItem(c.key));
};

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Custom hook for managing city guide data with localStorage caching
 * Handles fetching city guide information and grounding data from AI service
 * 
 * Features:
 * - 7-day cache with automatic expiration
 * - Force refresh option
 * - Cache invalidation
 * 
 * @returns Object with city guide data, loading states, cache info, and fetch functions
 * 
 * @example
 * const { cityGuide, isLoadingGuide, isCached, fetchCityGuide, invalidateCache } = useCityGuide();
 * await fetchCityGuide(city); // Uses cache if available
 * await fetchCityGuide(city, true); // Forces refresh
 * invalidateCache(city.id); // Clears cache for this city
 */
export function useCityGuide(): UseCityGuideReturn {
    const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);
    const [groundingInfo, setGroundingInfo] = useState<string>('');
    const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
    const [isLoadingGuide, setIsLoadingGuide] = useState(false);
    const [isLoadingGrounding, setIsLoadingGrounding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const { selectedTrip, updateDestination } = useTrips();

    const fetchCityGuide = useCallback(async (city: City, forceRefresh = false) => {
        if (!selectedTrip) return;

        setIsLoadingGuide(true);
        setError(null);

        const currentDestination = selectedTrip.detailedDestinations?.find(d => d.id === city.id || d.name === city.name);

        try {
            // Check Supabase "cache" first (unless forcing refresh)
            if (!forceRefresh && currentDestination?.guideData) {
                setCityGuide(currentDestination.guideData);
                setIsCached(true);
                // We don't have a specific timestamp but we can use today or null
                setLastUpdated(null);
                setIsLoadingGuide(false);
                return;
            }

            // Fallback to localStorage for migration period or if offline
            if (!forceRefresh) {
                const cached = getFromCache(city.id);
                if (cached) {
                    setCityGuide(cached.guide);
                    setIsCached(true);
                    setLastUpdated(new Date(cached.cachedAt));

                    // Proactively sync to Supabase if missing there
                    if (currentDestination) {
                        updateDestination(selectedTrip.id, currentDestination.id, { guideData: cached.guide });
                    }

                    setIsLoadingGuide(false);
                    return;
                }
            }

            // Fetch from API
            const service = getGeminiService();
            const guide = await service.generateCityGuide(city.name, city.country);

            // Save to context/Supabase
            if (currentDestination) {
                await updateDestination(selectedTrip.id, currentDestination.id, { guideData: guide });
            }

            // Still save to localStorage for offline access
            saveToCache(city.id, guide);

            setCityGuide(guide);
            setIsCached(false);
            setLastUpdated(new Date());
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch city guide';
            setError(errorMessage);
            console.error('Error fetching city guide:', err);
        } finally {
            setIsLoadingGuide(false);
        }
    }, [selectedTrip, updateDestination]);

    const fetchGroundingInfo = useCallback(async (cityName: string) => {
        setIsLoadingGrounding(true);
        setError(null);

        try {
            const service = getGeminiService();
            const info = await service.fetchGroundingInfo(cityName);
            setGroundingInfo(info.text);
            setGroundingLinks(info.links);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grounding info';
            setError(errorMessage);
            console.error('Error fetching grounding info:', err);
        } finally {
            setIsLoadingGrounding(false);
        }
    }, []);

    const invalidateCache = useCallback((cityId: string) => {
        try {
            localStorage.removeItem(getCacheKey(cityId));
            // Note: This only invalidates local cache. 
            // In a full implementation, we might want to clear guideData in Supabase too if forceRefresh is used.
            setIsCached(false);
        } catch (error) {
            console.error('Error invalidating cache:', error);
        }
    }, []);

    const reset = useCallback(() => {
        setCityGuide(null);
        setGroundingInfo('');
        setGroundingLinks([]);
        setError(null);
        setIsLoadingGuide(false);
        setIsLoadingGrounding(false);
        setIsCached(false);
        setLastUpdated(null);
    }, []);

    return {
        cityGuide,
        groundingInfo,
        groundingLinks,
        isLoadingGuide,
        isLoadingGrounding,
        error,
        isCached,
        lastUpdated,
        fetchCityGuide,
        fetchGroundingInfo,
        invalidateCache,
        reset,
    };
}

export default useCityGuide;
