import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { HotelReservation } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toISODate, fromISODate } from '../lib/dateUtils';

interface AccommodationContextType {
    accommodations: HotelReservation[];
    isLoading: boolean;
    error: string | null;
    fetchAccommodations: (tripId: string) => Promise<void>;
    addAccommodation: (tripId: string, accommodation: Omit<HotelReservation, 'id'>) => Promise<string | null>;
    updateAccommodation: (tripId: string, accommodation: HotelReservation) => Promise<void>;
    deleteAccommodation: (tripId: string, accommodationId: string) => Promise<void>;
    migrateFromLocalStorage: (tripId: string, localAccommodations: HotelReservation[]) => Promise<void>;
}

const AccommodationContext = createContext<AccommodationContextType | null>(null);

export const AccommodationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [accommodations, setAccommodations] = useState<HotelReservation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAccommodations = useCallback(async (tripId: string) => {
        if (!user || !tripId) return;
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('accommodations')
                .select('*')
                .eq('trip_id', tripId)
                .order('check_in', { ascending: true });

            if (error) throw error;

            if (data) {
                const loadedAccommodations: HotelReservation[] = data.map(row => ({
                    id: row.id,
                    name: row.name,
                    address: row.address,
                    image: row.image,
                    rating: Number(row.rating),
                    nights: row.nights,
                    checkIn: fromISODate(row.check_in),
                    checkInTime: row.check_in_time,
                    checkOut: fromISODate(row.check_out),
                    checkOutTime: row.check_out_time,
                    confirmation: row.confirmation_code,
                    status: row.status as 'confirmed' | 'pending' | 'cancelled',
                    stars: Number(row.stars),
                    type: row.type as 'hotel' | 'home',
                    cityId: row.city_id
                }));
                setAccommodations(loadedAccommodations);
            }
        } catch (err: any) {
            console.error('Error fetching accommodations:', err);
            setError(err.message || 'Failed to fetch accommodations');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addAccommodation = async (tripId: string, accommodation: Omit<HotelReservation, 'id'>) => {
        if (!user || !tripId) return;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const tempAccommodation = { ...accommodation, id: tempId };
        setAccommodations(prev => [...prev, tempAccommodation]);

        try {
            const { error, data } = await supabase.from('accommodations').insert({
                user_id: user.id,
                trip_id: tripId,
                city_id: accommodation.cityId,
                name: accommodation.name,
                address: accommodation.address,
                image: accommodation.image,
                stars: accommodation.stars,
                rating: accommodation.rating,
                nights: accommodation.nights,
                check_in: toISODate(accommodation.checkIn),
                check_in_time: accommodation.checkInTime,
                check_out: toISODate(accommodation.checkOut),
                check_out_time: accommodation.checkOutTime,
                confirmation_code: accommodation.confirmation,
                status: accommodation.status,
                type: accommodation.type
            }).select('id').single();

            if (error) throw error;

            // Update with real ID
            if (data) {
                setAccommodations(prev => prev.map(acc => acc.id === tempId ? { ...acc, id: data.id } : acc));
                return data.id;
            }
            return null;
        } catch (err: any) {
            console.error('Error adding accommodation:', err);
            setError(err.message || 'Failed to add accommodation');
            // Revert
            setAccommodations(prev => prev.filter(acc => acc.id !== tempId));
            return null;
        }
    };

    const updateAccommodation = async (tripId: string, accommodation: HotelReservation) => {
        if (!user || !tripId) return;

        setAccommodations(prev => prev.map(acc => acc.id === accommodation.id ? accommodation : acc));

        try {
            const { error } = await supabase.from('accommodations').update({
                city_id: accommodation.cityId,
                name: accommodation.name,
                address: accommodation.address,
                image: accommodation.image,
                stars: accommodation.stars,
                rating: accommodation.rating,
                nights: accommodation.nights,
                check_in: toISODate(accommodation.checkIn),
                check_in_time: accommodation.checkInTime,
                check_out: toISODate(accommodation.checkOut),
                check_out_time: accommodation.checkOutTime,
                confirmation_code: accommodation.confirmation,
                status: accommodation.status,
                type: accommodation.type,
                updated_at: new Date().toISOString()
            }).eq('id', accommodation.id).eq('trip_id', tripId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating accommodation:', err);
            setError(err.message || 'Failed to update accommodation');
            // Optimistic revert could be hard without previous state history, but usually we just refresh
            fetchAccommodations(tripId);
        }
    };

    const deleteAccommodation = async (tripId: string, accommodationId: string) => {
        if (!user || !tripId) return;

        setAccommodations(prev => prev.filter(acc => acc.id !== accommodationId));

        try {
            const { error } = await supabase.from('accommodations').delete().eq('id', accommodationId).eq('trip_id', tripId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error deleting accommodation:', err);
            setError(err.message || 'Failed to delete accommodation');
            fetchAccommodations(tripId);
        }
    };

    const migrateFromLocalStorage = async (tripId: string, localAccommodations: HotelReservation[]) => {
        if (!user || !tripId || localAccommodations.length === 0) return;

        // This is a bulk insert simulation
        try {
            const toInsert = localAccommodations.map(acc => ({
                user_id: user.id,
                trip_id: tripId,
                city_id: acc.cityId,
                name: acc.name,
                address: acc.address,
                image: acc.image,
                stars: acc.stars,
                rating: acc.rating,
                nights: acc.nights,
                check_in: toISODate(acc.checkIn),
                check_in_time: acc.checkInTime,
                check_out: toISODate(acc.checkOut),
                check_out_time: acc.checkOutTime,
                confirmation_code: acc.confirmation,
                status: acc.status,
                type: acc.type || 'hotel'
            }));

            const { error } = await supabase.from('accommodations').insert(toInsert);
            if (error) throw error;

            // Refresh to get IDs
            await fetchAccommodations(tripId);
        } catch (err: any) {
            console.error('Error migrating accommodations:', err);
        }
    };

    return (
        <AccommodationContext.Provider
            value={{
                accommodations,
                isLoading,
                error,
                fetchAccommodations,
                addAccommodation,
                updateAccommodation,
                deleteAccommodation,
                migrateFromLocalStorage
            }}
        >
            {children}
        </AccommodationContext.Provider>
    );
};

export const useAccommodation = () => {
    const context = useContext(AccommodationContext);
    if (!context) {
        throw new Error('useAccommodation must be used within AccommodationProvider');
    }
    return context;
};
