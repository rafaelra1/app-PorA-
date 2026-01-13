import React, { useState, useEffect, useMemo } from 'react';
import ItineraryMap3D, { ItineraryStop } from '../../maps/webgl/integrations/ItineraryMap3D';
import { ItineraryActivity, HotelReservation, Transport, City } from '../../../types';
import { Card } from '../../ui/Base';

import { useGoogleMapsApi } from '../../../hooks/useGoogleMapsApi';

interface TripMapExplorerProps {
    activities: ItineraryActivity[];
    hotels: HotelReservation[];
    transports: Transport[];
    cities: City[];
}

const TripMapExplorer: React.FC<TripMapExplorerProps> = ({
    activities,
    hotels,
    transports,
    cities
}) => {
    const { isLoaded } = useGoogleMapsApi();
    const [resolvedStops, setResolvedStops] = useState<ItineraryStop[]>([]);
    const [isResolving, setIsResolving] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        const resolveStops = async () => {
            setIsResolving(true);
            const stops: ItineraryStop[] = [];
            const geocoder = new google.maps.Geocoder();

            // 1. Map cities as base stops if no activities
            // 2. Map activities to stops
            const allItems = [
                ...activities.map(a => ({ ...a, origin: 'activity' as const, sortDate: a.date })),
                ...hotels.map(h => ({
                    ...h,
                    origin: 'hotel' as const,
                    title: h.name,
                    location: h.address,
                    type: 'accommodation' as const,
                    time: h.checkInTime || '15:00',
                    sortDate: h.checkIn
                })),
                ...transports.map(t => ({
                    ...t,
                    origin: 'transport' as const,
                    title: `${t.operator} ${t.reference}`,
                    location: t.departureLocation,
                    type: 'transport' as const,
                    time: t.departureTime,
                    sortDate: t.departureDate
                }))
            ];

            // Sort by date and time
            allItems.sort((a, b) => {
                const dateA = new Date(a.sortDate).getTime();
                const dateB = new Date(b.sortDate).getTime();
                if (dateA !== dateB) return dateA - dateB;
                return (a.time || '').localeCompare(b.time || '');
            });

            // Resolve coordinates for each unique location
            const locationCache = new Map<string, [number, number]>();

            for (const item of allItems) {
                const locationStr = item.location || '';
                if (!locationStr) continue;

                let coords = locationCache.get(locationStr);

                if (!coords) {
                    try {
                        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                            geocoder.geocode({ address: locationStr }, (results, status) => {
                                if (status === 'OK' && results) resolve(results);
                                else reject(status);
                            });
                        });
                        if (result[0]) {
                            coords = [result[0].geometry.location.lat(), result[0].geometry.location.lng()];
                            locationCache.set(locationStr, coords);
                        }
                    } catch (err) {
                        console.warn(`Could not geocode location: ${locationStr}`, err);
                        continue;
                    }
                }

                if (coords) {
                    stops.push({
                        id: (item as any).id,
                        title: item.title,
                        location: locationStr,
                        coordinates: coords,
                        transportMode: mapTypeToTransportMode(item.type),
                        day: (item as any).day || 0
                    });
                }
            }

            setResolvedStops(stops);
            setIsResolving(false);
        };

        if (isLoaded) {
            resolveStops();
        }
    }, [activities, hotels, transports, cities, isLoaded]);

    const mapTypeToTransportMode = (type: string): any => {
        switch (type) {
            case 'transport': return 'plane';
            case 'accommodation': return 'walk';
            case 'food':
            case 'meal': return 'walk';
            case 'sightseeing':
            case 'culture': return 'walk';
            default: return 'car';
        }
    };

    if (isResolving) {
        return (
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-text-muted font-bold">Mapeando seu roteiro em 3D...</p>
                <p className="text-xs text-text-muted mt-2 uppercase tracking-widest">Geocodificando destinos</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
            <ItineraryMap3D
                stops={resolvedStops}
                autoPlay={true}
                animationSpeed={5}
            />
        </div>
    );
};

export default TripMapExplorer;
