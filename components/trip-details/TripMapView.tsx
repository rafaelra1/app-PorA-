import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { City } from '../../../types';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface TripMapViewProps {
    cities: City[];
    onCityClick?: (city: City) => void;
    className?: string;
}

interface CityCoordinates {
    cityId: string;
    name: string;
    lat: number;
    lng: number;
}

// Helper component to fit bounds
const FitBounds: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
    const map = useMap();

    useEffect(() => {
        if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates.map(c => L.latLng(c[0], c[1])));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [coordinates, map]);

    return null;
};

// Cache for geocoded coordinates
const coordsCache = new Map<string, { lat: number; lng: number }>();

const TripMapView: React.FC<TripMapViewProps> = ({
    cities,
    onCityClick,
    className = ''
}) => {
    const [cityCoords, setCityCoords] = useState<CityCoordinates[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Geocode cities
    useEffect(() => {
        let isMounted = true;

        const geocodeCities = async () => {
            if (cities.length === 0) {
                setIsLoading(false);
                return;
            }

            const results: CityCoordinates[] = [];

            for (const city of cities) {
                // Check cache first
                const cachedCoords = coordsCache.get(city.name.toLowerCase());
                if (cachedCoords) {
                    results.push({
                        cityId: city.id,
                        name: city.name,
                        ...cachedCoords
                    });
                    continue;
                }

                try {
                    const response = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.name)}&count=1&language=pt&format=json`
                    );
                    const data = await response.json();

                    if (data.results && data.results.length > 0) {
                        const { latitude, longitude } = data.results[0];
                        const coords = { lat: latitude, lng: longitude };
                        coordsCache.set(city.name.toLowerCase(), coords);
                        results.push({
                            cityId: city.id,
                            name: city.name,
                            ...coords
                        });
                    }
                } catch (error) {
                    console.error(`Failed to geocode ${city.name}:`, error);
                }
            }

            if (isMounted) {
                setCityCoords(results);
                setIsLoading(false);
            }
        };

        geocodeCities();
        return () => { isMounted = false; };
    }, [cities]);

    // Create polyline path
    const pathCoordinates = useMemo(() => {
        return cityCoords.map(c => [c.lat, c.lng] as [number, number]);
    }, [cityCoords]);

    // Calculate center
    const center = useMemo(() => {
        if (cityCoords.length === 0) return [0, 0] as [number, number];
        const avgLat = cityCoords.reduce((sum, c) => sum + c.lat, 0) / cityCoords.length;
        const avgLng = cityCoords.reduce((sum, c) => sum + c.lng, 0) / cityCoords.length;
        return [avgLat, avgLng] as [number, number];
    }, [cityCoords]);

    // Format date for popup
    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    if (isLoading && cities.length > 0) {
        return (
            <div className={`bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50 ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-text-muted">Carregando mapa da viagem...</span>
                </div>
            </div>
        );
    }

    if (cityCoords.length === 0) {
        return null;
    }

    return (
        <div className={`bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100/50 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">map</span>
                    <h4 className="font-bold text-text-main">Mapa da Viagem</h4>
                </div>
                <span className="text-xs text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                    {cities.length} {cities.length === 1 ? 'cidade' : 'cidades'}
                </span>
            </div>

            {/* Map */}
            <div className="h-80 relative">
                <MapContainer
                    center={center}
                    zoom={4}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Route Line */}
                    {pathCoordinates.length > 1 && (
                        <Polyline
                            positions={pathCoordinates}
                            pathOptions={{
                                color: '#00D287',
                                weight: 3,
                                dashArray: '10, 10',
                                opacity: 0.8
                            }}
                        />
                    )}

                    {/* City Markers */}
                    {cityCoords.map((coords, index) => {
                        const city = cities.find(c => c.id === coords.cityId);
                        if (!city) return null;

                        return (
                            <Marker
                                key={coords.cityId}
                                position={[coords.lat, coords.lng]}
                                eventHandlers={{
                                    click: () => onCityClick?.(city)
                                }}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="size-5 bg-primary text-text-main rounded-full flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="font-bold text-sm">{city.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            {formatDate(city.arrivalDate)} - {formatDate(city.departureDate)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {city.nights} {city.nights === 1 ? 'noite' : 'noites'}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    <FitBounds coordinates={pathCoordinates} />
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="p-3 bg-gray-50 flex items-center justify-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-primary border-dashed" style={{ borderTop: '2px dashed #00D287' }} />
                    <span>Rota</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-4 bg-blue-500 rounded-full" />
                    <span>Destinos</span>
                </div>
            </div>
        </div>
    );
};

export default TripMapView;
