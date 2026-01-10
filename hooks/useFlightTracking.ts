// hooks/useFlightTracking.ts
// Hook for automatic flight status tracking with polling and notifications

import { useState, useEffect, useCallback, useRef } from 'react';
import { Transport, FlightLiveStatus, FlightStatusChange } from '../types';
import { flightStatusService } from '../services/flightStatusService';
import { createNotification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

interface UseFlightTrackingOptions {
    /** Polling interval in milliseconds (default: 15 minutes) */
    pollingInterval?: number;
    /** Whether to enable automatic polling (default: true) */
    enablePolling?: boolean;
    /** Callback when status changes are detected */
    onStatusChange?: (changes: FlightStatusChange[]) => void;
    /** Trip ID for notification linking */
    tripId?: string;
}

interface UseFlightTrackingReturn {
    /** Map of transport ID to flight status */
    statuses: Map<string, FlightLiveStatus>;
    /** Whether currently fetching status */
    isLoading: boolean;
    /** Last update timestamp */
    lastUpdate: Date | null;
    /** Error message if any */
    error: string | null;
    /** Manually refresh all flight statuses */
    refresh: () => Promise<void>;
    /** Refresh a specific flight status */
    refreshFlight: (transportId: string) => Promise<void>;
}

const DEFAULT_POLLING_INTERVAL = 1000 * 60 * 15; // 15 minutes

export function useFlightTracking(
    transports: Transport[],
    options: UseFlightTrackingOptions = {}
): UseFlightTrackingReturn {
    const {
        pollingInterval = DEFAULT_POLLING_INTERVAL,
        enablePolling = true,
        onStatusChange,
        tripId,
    } = options;

    const { user } = useAuth();
    const [statuses, setStatuses] = useState<Map<string, FlightLiveStatus>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const previousStatusesRef = useRef<Map<string, FlightLiveStatus>>(new Map());

    // Filter for trackable flights only
    const trackableFlights = transports.filter(
        t => t.type === 'flight' && t.reference && flightStatusService.isTrackable(t.departureDate)
    );

    const refreshFlight = useCallback(async (transportId: string) => {
        const transport = transports.find(t => t.id === transportId);
        if (!transport || transport.type !== 'flight' || !transport.reference) {
            return;
        }

        try {
            const status = await flightStatusService.getFlightStatus(
                transport.reference,
                transport.departureDate
            );

            if (status) {
                // Detect changes
                const previousStatus = previousStatusesRef.current.get(transportId);
                const changes = flightStatusService.detectChanges(previousStatus || null, status, transportId);

                // Notify about changes
                if (changes.length > 0 && user?.id) {
                    onStatusChange?.(changes);

                    // Create notifications for significant changes
                    for (const change of changes) {
                        if (change.changeType === 'cancellation' || change.changeType === 'delay' || change.changeType === 'diversion') {
                            createNotification({
                                userId: user.id,
                                type: 'flight_change',
                                title: change.changeType === 'cancellation'
                                    ? `⚠️ Voo ${status.flightNumber} CANCELADO`
                                    : change.changeType === 'diversion'
                                        ? `Voo ${status.flightNumber} desviado`
                                        : `Voo ${status.flightNumber} atrasado`,
                                message: change.details,
                                tripId: tripId,
                                metadata: { changeType: change.changeType, flightNumber: status.flightNumber },
                            }).catch(err => console.error('Error creating flight notification:', err));
                        }
                    }
                }

                // Update state
                setStatuses(prev => {
                    const newMap = new Map(prev);
                    newMap.set(transportId, status);
                    return newMap;
                });

                previousStatusesRef.current.set(transportId, status);
            }
        } catch (err) {
            console.error(`Error refreshing flight ${transportId}:`, err);
        }
    }, [transports, onStatusChange, user?.id, tripId]);

    const refresh = useCallback(async () => {
        if (trackableFlights.length === 0) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const flightDataRequests = trackableFlights.map(t => ({
                flightNumber: t.reference,
                date: t.departureDate,
            }));

            const results = await flightStatusService.getMultipleFlightStatuses(flightDataRequests);

            const newStatuses = new Map<string, FlightLiveStatus>();
            const allChanges: FlightStatusChange[] = [];

            results.forEach((status, index) => {
                const transport = trackableFlights[index];
                if (transport && status) {
                    newStatuses.set(transport.id, status);

                    // Detect changes
                    const previousStatus = previousStatusesRef.current.get(transport.id);
                    const changes = flightStatusService.detectChanges(previousStatus || null, status, transport.id);
                    allChanges.push(...changes);
                }
            });

            setStatuses(newStatuses);
            setLastUpdate(new Date());
            previousStatusesRef.current = newStatuses;

            // Notify about all changes
            if (allChanges.length > 0 && user?.id) {
                onStatusChange?.(allChanges);

                // Create notifications for significant changes
                for (const change of allChanges) {
                    const status = newStatuses.get(change.transportId);
                    if (status && (change.changeType === 'cancellation' || change.changeType === 'delay' || change.changeType === 'diversion')) {
                        createNotification({
                            userId: user.id,
                            type: 'flight_change',
                            title: change.changeType === 'cancellation'
                                ? `⚠️ Voo ${status.flightNumber} CANCELADO`
                                : change.changeType === 'diversion'
                                    ? `Voo ${status.flightNumber} desviado`
                                    : `Voo ${status.flightNumber} atrasado`,
                            message: change.details,
                            tripId: tripId,
                            metadata: { changeType: change.changeType, flightNumber: status.flightNumber },
                        }).catch(err => console.error('Error creating flight notification:', err));
                    }
                }
            }
        } catch (err: any) {
            console.error('Error refreshing flight statuses:', err);
            setError(err.message || 'Erro ao buscar status dos voos');
        } finally {
            setIsLoading(false);
        }
    }, [trackableFlights, onStatusChange, user?.id, tripId]);

    // Initial fetch
    useEffect(() => {
        if (trackableFlights.length > 0) {
            refresh();
        }
    }, [trackableFlights.length]); // Only re-run when number of trackable flights changes

    // Polling interval
    useEffect(() => {
        if (!enablePolling || trackableFlights.length === 0) {
            return;
        }

        const intervalId = setInterval(refresh, pollingInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [enablePolling, pollingInterval, refresh, trackableFlights.length]);

    return {
        statuses,
        isLoading,
        lastUpdate,
        error,
        refresh,
        refreshFlight,
    };
}

export default useFlightTracking;
