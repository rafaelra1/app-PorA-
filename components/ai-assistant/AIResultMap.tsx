import React, { useMemo, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { AIItineraryDay, AIItineraryActivity } from '../../types';

interface AIResultMapProps {
    days: AIItineraryDay[];
    selectedDay: number | null;
    onActivityClick?: (activity: AIItineraryActivity) => void;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
};

const dayColors = [
    '#6366f1', // indigo - Day 1
    '#ec4899', // pink - Day 2
    '#10b981', // emerald - Day 3
    '#f59e0b', // amber - Day 4
    '#8b5cf6', // violet - Day 5
    '#06b6d4', // cyan - Day 6
    '#ef4444', // red - Day 7
];

const AIResultMap: React.FC<AIResultMapProps> = ({ days, selectedDay, onActivityClick }) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    });

    const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);

    // Calculate center based on all activities
    const center = useMemo(() => {
        const allActivities = days.flatMap((d) => d.activities);
        const activitiesWithCoords = allActivities.filter((a) => a.coordinates);

        if (activitiesWithCoords.length === 0) {
            return { lat: -23.5505, lng: -46.6333 }; // Default to São Paulo
        }

        const avgLat = activitiesWithCoords.reduce((sum, a) => sum + (a.coordinates?.lat || 0), 0) / activitiesWithCoords.length;
        const avgLng = activitiesWithCoords.reduce((sum, a) => sum + (a.coordinates?.lng || 0), 0) / activitiesWithCoords.length;

        return { lat: avgLat, lng: avgLng };
    }, [days]);

    // Filter activities for selected day or show all
    const visibleDays = useMemo(() => {
        if (selectedDay === null) return days;
        return days.filter((d) => d.day === selectedDay);
    }, [days, selectedDay]);

    if (loadError) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">error</span>
                    <p>Erro ao carregar o mapa</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse">
                <div className="text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2 animate-spin">refresh</span>
                    <p>Carregando mapa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full relative">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={13}
                center={center}
                options={{
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
            >
                {visibleDays.map((day) => {
                    const dayColor = dayColors[(day.day - 1) % dayColors.length];
                    const activitiesWithCoords = day.activities.filter((a) => a.coordinates);

                    // Draw polyline for the day's route
                    const path = activitiesWithCoords.map((a) => ({
                        lat: a.coordinates!.lat,
                        lng: a.coordinates!.lng,
                    }));

                    return (
                        <React.Fragment key={day.day}>
                            {/* Route polyline */}
                            {path.length > 1 && (
                                <Polyline
                                    path={path}
                                    options={{
                                        strokeColor: dayColor,
                                        strokeOpacity: 0.8,
                                        strokeWeight: 3,
                                        geodesic: true,
                                    }}
                                />
                            )}

                            {/* Activity markers */}
                            {activitiesWithCoords.map((activity, index) => (
                                <Marker
                                    key={activity.id}
                                    position={{
                                        lat: activity.coordinates!.lat,
                                        lng: activity.coordinates!.lng,
                                    }}
                                    label={{
                                        text: `${index + 1}`,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                    }}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: dayColor,
                                        fillOpacity: 1,
                                        strokeColor: 'white',
                                        strokeWeight: 2,
                                        scale: hoveredActivity === activity.id ? 14 : 12,
                                    }}
                                    onClick={() => onActivityClick?.(activity)}
                                    onMouseOver={() => setHoveredActivity(activity.id)}
                                    onMouseOut={() => setHoveredActivity(null)}
                                    title={activity.title}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}
            </GoogleMap>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Legenda</p>
                <div className="space-y-1">
                    {visibleDays.map((day) => (
                        <div key={day.day} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: dayColors[(day.day - 1) % dayColors.length] }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">Dia {day.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIResultMap;
