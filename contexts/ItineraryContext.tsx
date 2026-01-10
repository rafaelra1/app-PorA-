import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ItineraryActivity } from '../types';
import { useAuth } from './AuthContext';

interface ItineraryContextType {
    activities: ItineraryActivity[];
    isLoading: boolean;
    error: string | null;
    fetchActivities: (tripId: string) => Promise<void>;
    addActivity: (tripId: string, activity: Omit<ItineraryActivity, 'id'>) => Promise<string | null>;
    updateActivity: (tripId: string, activity: ItineraryActivity) => Promise<void>;
    deleteActivity: (tripId: string, activityId: string) => Promise<void>;
    migrateFromLocalStorage: (tripId: string) => Promise<void>;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const ItineraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activities, setActivities] = useState<ItineraryActivity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchActivities = useCallback(async (tripId: string) => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('itinerary_activities')
                .select('*')
                .eq('trip_id', tripId)
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;

            // Transform data to match ItineraryActivity interface
            const validActivities: ItineraryActivity[] = (data || []).map(item => ({
                id: item.id,
                day: item.day,
                date: item.date, // Assumes YYYY-MM-DD from DB
                time: item.time ? item.time.slice(0, 5) : '00:00', // HH:mm:ss -> HH:mm
                title: item.title,
                location: item.location,
                locationDetail: item.location_detail,
                type: item.type as any,
                completed: item.completed,
                notes: item.notes,
                image: item.image,
                price: item.price ? String(item.price) : undefined,
            }));

            setActivities(validActivities);
        } catch (err: any) {
            console.error('Error fetching activities:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addActivity = useCallback(async (tripId: string, activity: Omit<ItineraryActivity, 'id'>) => {
        if (!user) return null;

        // Optimistic Update
        const tempId = `temp-${Math.random().toString(36).substr(2, 9)}`;
        const tempActivity = { ...activity, id: tempId };
        setActivities(prev => [...prev, tempActivity]);

        try {
            // Prepare the data to insert, only including fields that exist in the table
            const insertData: any = {
                trip_id: tripId,
                day: activity.day,
                date: activity.date,
                time: activity.time,
                title: activity.title,
                type: activity.type,
                completed: activity.completed || false,
            };

            // Add optional fields only if they have values
            if (activity.location) insertData.location = activity.location;
            if (activity.locationDetail) insertData.location_detail = activity.locationDetail;
            if (activity.notes) insertData.notes = activity.notes;
            if (activity.image) insertData.image = activity.image;
            if (activity.price) {
                const priceValue = typeof activity.price === 'string'
                    ? parseFloat(activity.price.replace(/[^0-9.]/g, ''))
                    : activity.price;
                if (!isNaN(priceValue)) insertData.price = priceValue;
            }

            console.log('📝 Inserting data:', insertData);

            const { data, error } = await supabase
                .from('itinerary_activities')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            // Replace temp with real
            setActivities(prev => prev.map(a => a.id === tempId ? {
                ...activity,
                id: data.id
            } : a));

            return data.id;
        } catch (err: any) {
            console.error('Error adding activity:', err);
            setError(err.message);
            // Rollback
            setActivities(prev => prev.filter(a => a.id !== tempId));
            return null;
        }
    }, [user]);

    const updateActivity = useCallback(async (tripId: string, activity: ItineraryActivity) => {
        if (!user) return;

        // Optimistic Update
        setActivities(prev => prev.map(a => a.id === activity.id ? activity : a));

        try {
            const { error } = await supabase
                .from('itinerary_activities')
                .update({
                    day: activity.day,
                    date: activity.date,
                    time: activity.time,
                    title: activity.title,
                    location: activity.location,
                    location_detail: activity.locationDetail,
                    type: activity.type,
                    completed: activity.completed,
                    notes: activity.notes,
                    image: activity.image,
                    price: activity.price ? parseFloat(activity.price.toString().replace(/[^0-9.]/g, '')) : null,
                })
                .eq('id', activity.id)
                .eq('trip_id', tripId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating activity:', err);
            setError(err.message);
            // Ideally rollback here, but for simplicity assuming success or refresh
            fetchActivities(tripId);
        }
    }, [user, fetchActivities]);

    const deleteActivity = useCallback(async (tripId: string, activityId: string) => {
        if (!user) return;

        // Optimistic Update
        const previousActivities = [...activities];
        setActivities(prev => prev.filter(a => a.id !== activityId));

        try {
            const { error } = await supabase
                .from('itinerary_activities')
                .delete()
                .eq('id', activityId)
                .eq('trip_id', tripId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error deleting activity:', err);
            setError(err.message);
            // Rollback
            setActivities(previousActivities);
        }
    }, [user, activities]);

    const migrateFromLocalStorage = useCallback(async (tripId: string) => {
        const localData = localStorage.getItem(`porai_trip_${tripId}_itinerary_activities`);

        if (localData) {
            try {
                const parsed: ItineraryActivity[] = JSON.parse(localData);
                if (parsed.length > 0) {
                    console.log('Migrating activities from LocalStorage...');
                    for (const act of parsed) {
                        if (activities.length === 0) {
                            await addActivity(tripId, act);
                        }
                    }
                    localStorage.removeItem(`porai_trip_${tripId}_itinerary_activities`);
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        }
    }, [activities.length, addActivity]);

    const value = useMemo(() => ({
        activities,
        isLoading,
        error,
        fetchActivities,
        addActivity,
        updateActivity,
        deleteActivity,
        migrateFromLocalStorage
    }), [
        activities,
        isLoading,
        error,
        fetchActivities,
        addActivity,
        updateActivity,
        deleteActivity,
        migrateFromLocalStorage
    ]);

    return (
        <ItineraryContext.Provider value={value}>
            {children}
        </ItineraryContext.Provider>
    );
};

export const useItinerary = () => {
    const context = useContext(ItineraryContext);
    if (context === undefined) {
        throw new Error('useItinerary must be used within an ItineraryProvider');
    }
    return context;
};
