import React, { useMemo, useState, useEffect } from 'react';
import Modal from './Modal';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Attraction, City } from '../../../types';

interface AttractionMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    city: City;
    attractions: Attraction[];
}

const LIBRARIES: ("places")[] = ['places'];

const AttractionMapModal: React.FC<AttractionMapModalProps> = ({ isOpen, onClose, city, attractions }) => {
    // State for map instance
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [is3DMode, setIs3DMode] = useState(true);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES
    });

    const defaultCenter = useMemo(() => ({ lat: 0, lng: 0 }), []);

    // Configure map options for 3D experience
    const mapOptions = useMemo<google.maps.MapOptions>(() => ({
        mapTypeId: is3DMode ? 'hybrid' : 'roadmap',
        tilt: is3DMode ? 45 : 0,
        heading: 0,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
    }), [is3DMode]);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            setMap(null);
        }
    }, [isOpen]);

    // Toggle 3D Mode
    const toggle3DMode = () => {
        setIs3DMode(!is3DMode);
        if (map) {
            map.setTilt(is3DMode ? 0 : 45);
            map.setMapTypeId(is3DMode ? 'roadmap' : 'hybrid');
        }
    };

    // Rotate Map Animation
    const rotateMap = () => {
        if (!map) return;
        let currentHeading = map.getHeading() || 0;
        const interval = setInterval(() => {
            currentHeading += 1;
            map.setHeading(currentHeading);
        }, 50);

        // Stop after 360 degrees (approx 18 seconds)
        setTimeout(() => clearInterval(interval), 18000);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Mapa de ${city.name}`}>
            <div className="relative w-full h-[600px] rounded-xl overflow-hidden bg-gray-100">
                {isLoaded ? (
                    <>
                        <GoogleMap
                            zoom={16} // Closer zoom for 3D effect
                            center={defaultCenter}
                            mapContainerClassName="w-full h-full"
                            options={mapOptions}
                            onLoad={(mapInstance) => {
                                setMap(mapInstance);

                                // Geocode City to center map initially
                                const geocoder = new google.maps.Geocoder();
                                geocoder.geocode({ address: `${city.name}, ${city.country}` }, (results, status) => {
                                    if (status === 'OK' && results && results[0]) {
                                        mapInstance.setCenter(results[0].geometry.location);

                                        // If we have attractions, try to bound them
                                        if (attractions.length > 0) {
                                            const bounds = new google.maps.LatLngBounds();
                                            let processedCount = 0;

                                            // Limit to first 5 for performance/quota
                                            attractions.slice(0, 5).forEach(attr => {
                                                geocoder.geocode({ address: `${attr.name}, ${city.name}` }, (attrResults, attrStatus) => {
                                                    if (attrStatus === 'OK' && attrResults && attrResults[0]) {
                                                        const pos = attrResults[0].geometry.location;
                                                        bounds.extend(pos);

                                                        new google.maps.Marker({
                                                            position: pos,
                                                            map: mapInstance,
                                                            title: attr.name,
                                                            label: {
                                                                text: (processedCount + 1).toString(),
                                                                color: "white"
                                                            },
                                                            animation: google.maps.Animation.DROP
                                                        });
                                                    }
                                                    processedCount++;
                                                    // Only fit bounds if we found locations
                                                    if (processedCount === Math.min(attractions.length, 5)) {
                                                        mapInstance.fitBounds(bounds);

                                                        // After fitting bounds, restore tilt if in 3D mode
                                                        // fitBounds resets tilt to 0 usually
                                                        if (is3DMode) {
                                                            const listener = google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
                                                                mapInstance.setTilt(45);
                                                                mapInstance.setZoom(17); // Enforce high zoom for 3D buildings
                                                            });
                                                        }
                                                    }
                                                });
                                            });
                                        }
                                    }
                                });
                            }}
                        />

                        {/* Map Controls Overlay */}
                        <div className="absolute top-4 right-14 flex flex-col gap-2">
                            <button
                                onClick={toggle3DMode}
                                className={`px-4 py-2 rounded-full shadow-lg text-sm font-semibold transition-all ${is3DMode
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {is3DMode ? '📍 Mapa 2D' : '🌍 Visão 3D'}
                            </button>

                            {is3DMode && (
                                <button
                                    onClick={rotateMap}
                                    className="px-4 py-2 rounded-full shadow-lg bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 justify-center"
                                >
                                    <span className="material-symbols-outlined text-[18px]">360</span>
                                    Girar
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-gray-400 font-bold animate-pulse">Carregando Mapa...</div>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
                * Modo 3D requer zoom aproximado. Gire o mapa (Shift + Arrastar ou botão Girar) para explorar.
            </p>
        </Modal>
    );
};

export default AttractionMapModal;
