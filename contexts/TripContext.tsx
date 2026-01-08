import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toISODate, fromISODate } from '../lib/dateUtils';

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
                    // We merge top-level columns with the JSONB 'data' column
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
                }
            } catch (error) {
                console.error('Error fetching trips:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [user]);

    const setTrips = (newTrips: Trip[]) => {
        setTripsState(newTrips);
    };

    const addTrip = async (newTripData: Omit<Trip, 'id'>) => {
        if (!user) return null;

        // 1. Optimistic Update with Temp ID
        const tempId = `temp-${Date.now()}`;
        const optimisticTrip: Trip = { ...newTripData, id: tempId };

        setTripsState(prev => [optimisticTrip, ...prev]);

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
                data: rest // Store remainder as JSONB
            }).select('id').single();

            if (error) throw error;

            // 4. Update State with Real ID
            if (data) {
                setTripsState(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
                return data.id;
            }
            return null;

        } catch (error) {
            console.error('Error adding trip:', error);
            // 5. Rollback on Error
            setTripsState(prev => prev.filter(t => t.id !== tempId));
            throw error; // Re-throw to let component know
        }
    };

    const updateTrip = async (updatedTrip: Trip): Promise<void> => {
        if (!user) throw new Error('Usuário não autenticado');

        // Save previous state for rollback
        const previousTrips = trips;
        setTripsState(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));

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
            throw error;
        }
    };

    const deleteTrip = async (id: string): Promise<void> => {
        if (!user) throw new Error('Usuário não autenticado');

        // Save previous state for rollback
        const previousTrips = trips;
        const previousSelectedId = selectedTripId;

        setTripsState(prev => prev.filter(t => t.id !== id));
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
            setSelectedTripId(previousSelectedId);
            throw error;
        }
    };

    const selectTrip = (id: string | null) => {
        setSelectedTripId(id);
    };

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

    return (
        <TripContext.Provider
            value={{
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
                setEditingTrip,
            }}
        >
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
