import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Transport, TransportType, TransportStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toISODate, fromISODate } from '../lib/dateUtils';

interface TransportContextType {
    transports: Transport[];
    isLoading: boolean;
    error: string | null;
    fetchTransports: (tripId: string) => Promise<void>;
    addTransport: (tripId: string, transport: Omit<Transport, 'id'>) => Promise<string | null>;
    updateTransport: (tripId: string, transport: Transport) => Promise<void>;
    deleteTransport: (tripId: string, transportId: string) => Promise<void>;
    migrateFromLocalStorage: (tripId: string, localTransports: Transport[]) => Promise<void>;
}

const TransportContext = createContext<TransportContextType | null>(null);

export const TransportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [transports, setTransports] = useState<Transport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransports = useCallback(async (tripId: string) => {
        if (!user || !tripId) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('transports')
                .select('*')
                .eq('trip_id', tripId)
                .order('departure_date', { ascending: true });

            if (error) throw error;

            if (data) {
                const loadedTransports: Transport[] = data.map(row => ({
                    id: row.id,
                    type: row.type as TransportType,
                    operator: row.operator,
                    reference: row.reference,
                    departureLocation: row.departure_location,
                    departureCity: row.departure_city,
                    departureDate: fromISODate(row.departure_date),
                    departureTime: row.departure_time,
                    arrivalLocation: row.arrival_location,
                    arrivalCity: row.arrival_city,
                    arrivalDate: fromISODate(row.arrival_date),
                    arrivalTime: row.arrival_time,
                    duration: row.duration,
                    class: row.class,
                    seat: row.seat,
                    vehicle: row.vehicle,
                    status: row.status as TransportStatus,
                    confirmation: row.reference
                }));
                setTransports(loadedTransports);
            }
        } catch (err: any) {
            console.error('Error fetching transports:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addTransport = useCallback(async (tripId: string, transport: Omit<Transport, 'id'>) => {
        if (!user || !tripId) return null;
        setError(null);

        // Optimistic Update
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tempTransport = { ...transport, id: tempId };
        setTransports(prev => [...prev, tempTransport]);

        try {
            const departureDateISO = toISODate(transport.departureDate);
            const arrivalDateISO = toISODate(transport.arrivalDate) || departureDateISO;

            const payload = {
                trip_id: tripId,
                type: transport.type,
                operator: transport.operator || 'Unknown',
                reference: transport.reference || '',
                departure_location: transport.departureLocation || '',
                departure_city: transport.departureCity || '',
                departure_date: departureDateISO,
                departure_time: transport.departureTime ? transport.departureTime.slice(0, 5) : '00:00',
                arrival_location: transport.arrivalLocation || '',
                arrival_city: transport.arrivalCity || '',
                arrival_date: arrivalDateISO,
                arrival_time: transport.arrivalTime ? transport.arrivalTime.slice(0, 5) : '00:00',
                duration: transport.duration || null,
                class: transport.class || null,
                seat: transport.seat || null,
                vehicle: transport.vehicle || null,
                status: transport.status
            };

            const { error, data } = await supabase.from('transports').insert(payload).select().single();

            if (error) throw error;

            if (data) {
                setTransports(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
                return data.id;
            }
            return null;

        } catch (err: any) {
            console.error('Error adding transport:', err);
            setError(err.message);
            setTransports(prev => prev.filter(t => t.id !== tempId));
            return null;
        }
    }, [user]);

    const updateTransport = useCallback(async (tripId: string, transport: Transport) => {
        if (!user || !tripId) return;
        setError(null);

        setTransports(prev => prev.map(t => t.id === transport.id ? transport : t));

        try {
            const { error } = await supabase.from('transports').update({
                type: transport.type,
                operator: transport.operator,
                reference: transport.reference,
                departure_location: transport.departureLocation,
                departure_city: transport.departureCity,
                departure_date: toISODate(transport.departureDate),
                departure_time: transport.departureTime,
                arrival_location: transport.arrivalLocation,
                arrival_city: transport.arrivalCity,
                arrival_date: toISODate(transport.arrivalDate),
                arrival_time: transport.arrivalTime,
                duration: transport.duration,
                class: transport.class,
                seat: transport.seat,
                vehicle: transport.vehicle,
                status: transport.status,
                updated_at: new Date().toISOString()
            }).eq('id', transport.id).eq('trip_id', tripId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating transport:', err);
            setError(err.message);
            fetchTransports(tripId);
        }
    }, [user, fetchTransports]);

    const deleteTransport = useCallback(async (tripId: string, transportId: string) => {
        if (!user || !tripId) return;
        setTransports(prev => prev.filter(t => t.id !== transportId));

        try {
            const { error } = await supabase.from('transports').delete().eq('id', transportId).eq('trip_id', tripId);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error deleting transport:', err);
            setError(err.message);
            fetchTransports(tripId);
        }
    }, [user, fetchTransports]);

    const migrateFromLocalStorage = useCallback(async (tripId: string, localTransports: Transport[]) => {
        if (!user || !tripId || localTransports.length === 0) return;

        const promises = localTransports.map(t => {
            return addTransport(tripId, t);
        });

        await Promise.all(promises);
    }, [user, addTransport]);

    const value = useMemo(() => ({
        transports,
        isLoading,
        error,
        fetchTransports,
        addTransport,
        updateTransport,
        deleteTransport,
        migrateFromLocalStorage
    }), [
        transports,
        isLoading,
        error,
        fetchTransports,
        addTransport,
        updateTransport,
        deleteTransport,
        migrateFromLocalStorage
    ]);

    return (
        <TransportContext.Provider value={value}>
            {children}
        </TransportContext.Provider>
    );
};

export const useTransport = () => {
    const context = useContext(TransportContext);
    if (!context) {
        throw new Error('useTransport must be used within a TransportProvider');
    }
    return context;
};
