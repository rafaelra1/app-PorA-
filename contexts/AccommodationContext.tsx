import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HotelReservation } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AccommodationContextType {
    accommodations: HotelReservation[];
    isLoading: boolean;
    getAccommodationsByTripId: (tripId: string) => HotelReservation[];
    addAccommodation: (tripId: string, accommodation: Omit<HotelReservation, 'id'>) => Promise<{ success: boolean; error?: string; data?: HotelReservation }>;
    updateAccommodation: (accommodation: HotelReservation) => Promise<{ success: boolean; error?: string }>;
    deleteAccommodation: (id: string) => Promise<{ success: boolean; error?: string }>;
    refreshAccommodations: (tripId?: string) => Promise<void>;
}

const AccommodationContext = createContext<AccommodationContextType | null>(null);

// Helpers para converter datas
const toISODate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Se já está em formato ISO, retorna
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // Converte de DD/MM/YYYY para YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
};

const fromISODate = (isoDate: string | null): string => {
    if (!isoDate) return '';
    // Converte de YYYY-MM-DD para DD/MM/YYYY
    const parts = isoDate.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
};

export const AccommodationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [accommodations, setAccommodations] = useState<HotelReservation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch all accommodations when user changes
    useEffect(() => {
        if (!user) {
            setAccommodations([]);
            return;
        }
        fetchAllAccommodations();
    }, [user]);

    const fetchAllAccommodations = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('accommodations')
                .select('*')
                .eq('user_id', user.id)
                .order('check_in', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: HotelReservation[] = data.map(row => ({
                    id: row.id,
                    name: row.name,
                    address: row.address || '',
                    image: row.image || '',
                    rating: row.rating || 0,
                    stars: row.stars,
                    nights: row.nights || 0,
                    checkIn: fromISODate(row.check_in),
                    checkInTime: row.check_in_time || '',
                    checkOut: fromISODate(row.check_out),
                    checkOutTime: row.check_out_time || '',
                    confirmation: row.confirmation || '',
                    status: row.status || 'pending',
                    type: row.type || 'hotel',
                    cityId: row.city_id,
                    tripId: row.trip_id,
                }));
                setAccommodations(mapped);
            }
        } catch (error) {
            console.error('Error fetching accommodations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshAccommodations = async (tripId?: string) => {
        await fetchAllAccommodations();
    };

    const getAccommodationsByTripId = (tripId: string): HotelReservation[] => {
        return accommodations.filter(a => (a as any).tripId === tripId);
    };

    const addAccommodation = async (
        tripId: string,
        accommodation: Omit<HotelReservation, 'id'>
    ): Promise<{ success: boolean; error?: string; data?: HotelReservation }> => {
        if (!user) return { success: false, error: 'Usuário não autenticado' };

        try {
            const { data, error } = await supabase
                .from('accommodations')
                .insert({
                    trip_id: tripId,
                    user_id: user.id,
                    name: accommodation.name,
                    address: accommodation.address,
                    image: accommodation.image,
                    rating: accommodation.rating,
                    stars: accommodation.stars,
                    nights: accommodation.nights,
                    check_in: toISODate(accommodation.checkIn),
                    check_in_time: accommodation.checkInTime || null,
                    check_out: toISODate(accommodation.checkOut),
                    check_out_time: accommodation.checkOutTime || null,
                    confirmation: accommodation.confirmation,
                    status: accommodation.status || 'pending',
                    type: accommodation.type || 'hotel',
                    city_id: accommodation.cityId,
                })
                .select()
                .single();

            if (error) throw error;

            const newAccommodation: HotelReservation = {
                id: data.id,
                name: data.name,
                address: data.address || '',
                image: data.image || '',
                rating: data.rating || 0,
                stars: data.stars,
                nights: data.nights || 0,
                checkIn: fromISODate(data.check_in),
                checkInTime: data.check_in_time || '',
                checkOut: fromISODate(data.check_out),
                checkOutTime: data.check_out_time || '',
                confirmation: data.confirmation || '',
                status: data.status || 'pending',
                type: data.type || 'hotel',
                cityId: data.city_id,
                tripId: data.trip_id,
            } as HotelReservation & { tripId: string };

            setAccommodations(prev => [...prev, newAccommodation]);

            return { success: true, data: newAccommodation };
        } catch (error: any) {
            console.error('Error adding accommodation:', error);
            if (error.message?.includes('valid_dates')) {
                return { success: false, error: 'A data de check-out deve ser após a data de check-in.' };
            }
            return { success: false, error: 'Erro ao salvar hospedagem. Tente novamente.' };
        }
    };

    const updateAccommodation = async (
        accommodation: HotelReservation
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Usuário não autenticado' };

        const previousAccommodations = accommodations;
        setAccommodations(prev => prev.map(a => a.id === accommodation.id ? accommodation : a));

        try {
            const { error } = await supabase
                .from('accommodations')
                .update({
                    name: accommodation.name,
                    address: accommodation.address,
                    image: accommodation.image,
                    rating: accommodation.rating,
                    stars: accommodation.stars,
                    nights: accommodation.nights,
                    check_in: toISODate(accommodation.checkIn),
                    check_in_time: accommodation.checkInTime || null,
                    check_out: toISODate(accommodation.checkOut),
                    check_out_time: accommodation.checkOutTime || null,
                    confirmation: accommodation.confirmation,
                    status: accommodation.status,
                    type: accommodation.type,
                    city_id: accommodation.cityId,
                })
                .eq('id', accommodation.id)
                .eq('user_id', user.id);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error updating accommodation:', error);
            setAccommodations(previousAccommodations);
            if (error.message?.includes('valid_dates')) {
                return { success: false, error: 'A data de check-out deve ser após a data de check-in.' };
            }
            return { success: false, error: 'Erro ao atualizar hospedagem. Tente novamente.' };
        }
    };

    const deleteAccommodation = async (id: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Usuário não autenticado' };

        const previousAccommodations = accommodations;
        setAccommodations(prev => prev.filter(a => a.id !== id));

        try {
            const { error } = await supabase
                .from('accommodations')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting accommodation:', error);
            setAccommodations(previousAccommodations);
            return { success: false, error: 'Erro ao excluir hospedagem. Tente novamente.' };
        }
    };

    return (
        <AccommodationContext.Provider
            value={{
                accommodations,
                isLoading,
                getAccommodationsByTripId,
                addAccommodation,
                updateAccommodation,
                deleteAccommodation,
                refreshAccommodations,
            }}
        >
            {children}
        </AccommodationContext.Provider>
    );
};

export const useAccommodations = () => {
    const context = useContext(AccommodationContext);
    if (!context) {
        throw new Error('useAccommodations must be used within AccommodationProvider');
    }
    return context;
};
