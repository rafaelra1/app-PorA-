import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Trip } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toISODate, fromISODate } from '../lib/dateUtils';
import { getTripBackgroundService } from '../services/tripBackgroundService';

// Helper to safely set item in localStorage
const safeLocalStorageSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e instanceof DOMException && (
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            console.warn('LocalStorage quota exceeded. Clearing cache...', e);
            localStorage.removeItem(key);
        } else {
            console.error('Failed to set item in localStorage', e);
        }
    }
};

// Helper to compress trip data for caching (removes heavy fields)
const compressTripForCache = (trip: Trip): Trip => {
    return {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        // Only keep cover image if it's a URL (short) or small base64. 
        // If it's a massive base64, we drop it for cache to save space.
        coverImage: (trip.coverImage && trip.coverImage.length < 50000) ? trip.coverImage : '',
        participants: trip.participants || [],
        isFlexibleDates: trip.isFlexibleDates,
        // AI-generated background fields
        vibe: trip.vibe,
        tags: trip.tags,
        generatedCoverImage: trip.generatedCoverImage,
        isGeneratingCover: trip.isGeneratingCover,
        // Exclude heavier fields that are fetched on detail view
        videos: [],
        tasks: [],
        luggage: [],
        detailedDestinations: []
    } as Trip;
};

interface TripContextType {
    trips: Trip[];
    selectedTripId: string | null;
    selectedTrip: Trip | null;
    editingTrip: Trip | undefined;
    isLoading: boolean;
    setTrips: (trips: Trip[]) => void;
    addTrip: (trip: Omit<Trip, 'id'>) => Promise<string | null>;
    updateTrip: (trip: Trip) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
    selectTrip: (id: string | null) => void;
    setEditingTrip: (trip: Trip | undefined) => void;
}

const TripContext = createContext<TripContextType | null>(null);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [trips, setTripsState] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [editingTrip, setEditingTrip] = useState<Trip | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const selectedTrip = trips.find(t => t.id === selectedTripId) || null;

    // Load from cache on mount
    useEffect(() => {
        const cached = localStorage.getItem('pora_trips_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setTripsState(parsed);
            } catch (e) {
                console.error("Failed to load cached trips", e);
            }
        }
    }, []);

    // Fetch trips when user changes
    useEffect(() => {
        if (!user) {
            setTripsState([]);
            setIsLoading(false);
            return;
        }

        const fetchTrips = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('start_date', { ascending: true });

                if (error) throw error;

                if (data) {
                    // Map db rows back to Trip objects
                    const loadedTrips: Trip[] = data.map(row => ({
                        id: row.id,
                        title: row.title,
                        destination: row.destination,
                        startDate: fromISODate(row.start_date),
                        endDate: fromISODate(row.end_date),
                        status: row.status,
                        coverImage: row.cover_image,
                        ...row.data // Spread the complex JSONB data
                    }));
                    setTripsState(loadedTrips);
                    // Update cache with robust error handling and compression
                    const compressedTrips = loadedTrips.map(compressTripForCache);
                    safeLocalStorageSetItem('pora_trips_cache', JSON.stringify(compressedTrips));
                }
            } catch (error) {
                console.error('Error fetching trips:', error);
                // If error (offline), we rely on the initial cache load or existing state
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [user]);

    const setTrips = useCallback((newTrips: Trip[]) => {
        setTripsState(newTrips);
    }, []);

    // Helper to update cache
    const updateCache = useCallback((currentTrips: Trip[]) => {
        const compressedTrips = currentTrips.map(compressTripForCache);
        safeLocalStorageSetItem('pora_trips_cache', JSON.stringify(compressedTrips));
    }, []);

    const addTrip = useCallback(async (newTripData: Omit<Trip, 'id'>): Promise<string | null> => {
        if (!user) throw new Error('Usuário não autenticado');

        // Detect vibe for the new trip
        const tripBackgroundService = getTripBackgroundService();
        const detectedVibe = tripBackgroundService.detectVibe(newTripData.destination);

        // 1. Optimistic Update with Temp ID
        const tempId = `temp-${Date.now()}`;
        const optimisticTrip: Trip = {
            ...newTripData,
            id: tempId,
            vibe: detectedVibe,
            isGeneratingCover: true  // Show loading state in UI
        };

        setTripsState(prev => {
            const newState = [optimisticTrip, ...prev];
            updateCache(newState);
            return newState;
        });

        try {
            // 2. Prepare Data for Supabase
            const { title, destination, startDate, endDate, status, coverImage, ...rest } = newTripData;

            // 3. Insert and Select Single (to get real ID)
            const { data, error } = await supabase.from('trips').insert({
                user_id: user.id,
                title,
                destination,
                start_date: toISODate(startDate),
                end_date: toISODate(endDate),
                status,
                cover_image: coverImage,
                data: { ...rest, vibe: detectedVibe } // Include detected vibe in JSONB
            }).select('id').single();

            if (error) throw error;

            // 4. Update State with Real ID
            if (data) {
                const realId = data.id;

                setTripsState(prev => {
                    const newState = prev.map(t => t.id === tempId ? { ...t, id: realId } : t);
                    updateCache(newState);
                    return newState;
                });

                // 5. Trigger AI Background Generation (async, don't block)
                (async () => {
                    try {
                        const tripWithRealId: Trip = { ...optimisticTrip, id: realId };
                        const result = await tripBackgroundService.generateBackground(tripWithRealId);

                        if (result?.url) {
                            // Update trip with generated image
                            setTripsState(prev => {
                                const newState = prev.map(t =>
                                    t.id === realId
                                        ? { ...t, generatedCoverImage: result.url, isGeneratingCover: false }
                                        : t
                                );
                                updateCache(newState);
                                return newState;
                            });

                            // Also persist to Supabase
                            await supabase
                                .from('trips')
                                .update({
                                    data: { ...rest, vibe: detectedVibe, generatedCoverImage: result.url }
                                })
                                .eq('id', realId);
                        }
                    } catch (bgError) {
                        console.warn('Background generation failed (non-blocking):', bgError);
                        // Turn off loading state even on failure
                        setTripsState(prev => {
                            const newState = prev.map(t =>
                                t.id === realId
                                    ? { ...t, isGeneratingCover: false }
                                    : t
                            );
                            return newState;
                        });
                    }
                })();

                return realId;
            }
            return null;

        } catch (error) {
            console.error('Error adding trip:', error);
            // 5. Rollback on Error
            setTripsState(prev => {
                const newState = prev.filter(t => t.id !== tempId);
                updateCache(newState);
                return newState;
            });
            throw error; // Re-throw to let component know
        }
    }, [user, updateCache]);

    const updateTrip = useCallback(async (updatedTrip: Trip): Promise<void> => {
        if (!user) throw new Error('Usuário não autenticado');

        // Save previous state for rollback
        const previousTrips = trips;

        setTripsState(prev => {
            const newState = prev.map(t => t.id === updatedTrip.id ? updatedTrip : t);
            updateCache(newState);
            return newState;
        });

        try {
            const { id, title, destination, startDate, endDate, status, coverImage, ...rest } = updatedTrip;

            const { error } = await supabase
                .from('trips')
                .update({
                    title,
                    destination,
                    start_date: toISODate(startDate),
                    end_date: toISODate(endDate),
                    status,
                    cover_image: coverImage,
                    data: rest,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating trip:', error);
            // Rollback on error
            setTripsState(previousTrips);
            updateCache(previousTrips);
            throw error;
        }
    }, [user, trips, updateCache]);

    const deleteTrip = useCallback(async (id: string): Promise<void> => {
        if (!user) throw new Error('Usuário não autenticado');

        // Save previous state for rollback
        const previousTrips = trips;
        const previousSelectedId = selectedTripId;

        setTripsState(prev => {
            const newState = prev.filter(t => t.id !== id);
            updateCache(newState);
            return newState;
        });

        if (selectedTripId === id) {
            setSelectedTripId(null);
        }

        try {
            const { error } = await supabase.from('trips').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting trip:', error);
            // Rollback on error
            setTripsState(previousTrips);
            updateCache(previousTrips);
            setSelectedTripId(previousSelectedId);
            throw error;
        }
    }, [user, trips, selectedTripId, updateCache]);

    const selectTrip = useCallback((id: string | null) => {
        setSelectedTripId(id);
    }, []);

    // Helper to reload if needed (not exported but used internally)
    const fetchTrips = async () => {
        if (!user) return;
        const { data } = await supabase.from('trips').select('*').eq('user_id', user.id);
        if (data) {
            const loadedTrips: Trip[] = data.map(row => ({
                id: row.id,
                title: row.title,
                destination: row.destination,
                startDate: fromISODate(row.start_date),
                endDate: fromISODate(row.end_date),
                status: row.status,
                coverImage: row.cover_image,
                ...row.data
            }));
            setTripsState(loadedTrips);
        }
    };

    const value = useMemo(() => ({
        trips,
        selectedTripId,
        selectedTrip,
        editingTrip,
        isLoading,
        setTrips,
        addTrip,
        updateTrip,
        deleteTrip,
        selectTrip,
        setEditingTrip
    }), [
        trips,
        selectedTripId,
        selectedTrip,
        editingTrip,
        isLoading,
        addTrip,
        updateTrip,
        deleteTrip,
        selectTrip
    ]);

    return (
        <TripContext.Provider value={value}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrips = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTrips must be used within TripProvider');
    }
    return context;
};
