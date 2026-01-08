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
    addTrip: (trip: Trip) => Promise<{ success: boolean; error?: string }>;
    updateTrip: (trip: Trip) => Promise<{ success: boolean; error?: string }>;
    deleteTrip: (id: string) => Promise<{ success: boolean; error?: string }>;
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

    const addTrip = async (newTrip: Trip): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Usuário não autenticado' };

        try {
            // Split data into columns and JSONB payload
            const { id, title, destination, startDate, endDate, status, coverImage, ...rest } = newTrip;

            // Insert and get the generated ID back
            const { data, error } = await supabase
                .from('trips')
                .insert({
                    user_id: user.id,
                    title,
                    destination,
                    start_date: toISODate(startDate),
                    end_date: toISODate(endDate),
                    status,
                    cover_image: coverImage,
                    data: rest
                })
                .select()
                .single();

            if (error) throw error;

            // Add trip with the real ID from Supabase
            const tripWithRealId: Trip = {
                ...newTrip,
                id: data.id
            };
            setTripsState(prev => [tripWithRealId, ...prev]);

            return { success: true };
        } catch (error) {
            console.error('Error adding trip:', error);
            return { success: false, error: 'Erro ao salvar viagem. Tente novamente.' };
        }
    };

    const updateTrip = async (updatedTrip: Trip): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Usuário não autenticado' };

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
            return { success: true };
        } catch (error) {
            console.error('Error updating trip:', error);
            // Rollback on error
            setTripsState(previousTrips);
            return { success: false, error: 'Erro ao atualizar viagem. Tente novamente.' };
        }
    };

    const deleteTrip = async (id: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Usuário não autenticado' };

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
            return { success: true };
        } catch (error) {
            console.error('Error deleting trip:', error);
            // Rollback on error
            setTripsState(previousTrips);
            setSelectedTripId(previousSelectedId);
            return { success: false, error: 'Erro ao excluir viagem. Tente novamente.' };
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
