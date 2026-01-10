import React, { useMemo, useState, useEffect } from 'react';
import Modal from './Modal';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { Attraction, City } from '../../../types';
import { useMap3DCamera } from '../../../hooks/useMap3DCamera';

interface AttractionMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    city: City;
    attractions: Attraction[];
}

const LIBRARIES: ("places")[] = ['places'];
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID") : "";

const AttractionMapModal: React.FC<AttractionMapModalProps> = ({ isOpen, onClose, city, attractions }) => {
    // State for map instance
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [is3DMode, setIs3DMode] = useState(true);

    // Custom Hook for 3D Camera control
    const { flyTo } = useMap3DCamera(map);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
        mapIds: MAP_ID ? [MAP_ID] : undefined
    });

    const defaultCenter = useMemo(() => ({ lat: 0, lng: 0 }), []);

    // Configure map options for 3D experience
    const mapOptions = useMemo<google.maps.MapOptions>(() => ({
        mapId: MAP_ID, // Enable Vector Maps
        mapTypeId: 'roadmap', // Vector allows 3D buildings on roadmap
        tilt: 0, // Start flat, animate to 3D
        heading: 0,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
        gestureHandling: 'greedy'
    }), []);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            setMap(null);
            setIs3DMode(true);
        }
    }, [isOpen]);

    // Initial Fly-in Sequence
    useEffect(() => {
        if (isOpen && map && city) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: `${city.name}, ${city.country}` }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;

                    // 1. Start high above
                    map.setCenter(location);
                    map.setZoom(12);
                    map.setTilt(0);

                    // 2. Fly in cinematically after a brief delay
                    setTimeout(() => {
                        flyTo({
                            center: location.toJSON(),
                            zoom: 17.5, // Close enough for 3D buildings
                            tilt: 67.5, // Maximum tilt for drama
                            heading: 45, // Angled view
                            duration: 3500
                        });
                    }, 500);

                    // Add markers
                    if (attractions.length > 0) {
                        attractions.slice(0, 5).forEach((attr, idx) => {
                            geocoder.geocode({ address: `${attr.name}, ${city.name}` }, (res, stat) => {
                                if (stat === 'OK' && res && res[0]) {
                                    new google.maps.marker.AdvancedMarkerElement({
                                        map,
                                        position: res[0].geometry.location,
                                        title: attr.name,
                                        content: buildMarkerContent(idx + 1)
                                    });
                                }
                            });
                        });
                    }
                }
            });
        }
    }, [isOpen, map, city, flyTo, attractions]);

    // Helper to build modern marker
    const buildMarkerContent = (num: number) => {
        const div = document.createElement('div');
        div.className = "bg-primary-dark text-white font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg animate-bounce";
        div.textContent = num.toString();
        return div;
    };

    // Toggle 3D Mode
    const toggle3DMode = () => {
        const newMode = !is3DMode;
        setIs3DMode(newMode);

        if (map) {
            flyTo({
                center: map.getCenter()?.toJSON() || { lat: 0, lng: 0 },
                zoom: newMode ? 17.5 : 14,
                tilt: newMode ? 67.5 : 0,
                heading: newMode ? 45 : 0,
                duration: 1500
            });
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Explorando ${city.name} em 3D`}>
            <div className="relative w-full h-[600px] rounded-xl overflow-hidden bg-gray-100 group">
                {isLoaded ? (
                    <>
                        <GoogleMap
                            center={defaultCenter}
                            zoom={12}
                            mapContainerClassName="w-full h-full"
                            options={mapOptions}
                            onLoad={setMap}
                        />

                        {/* Cinematic Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10 transition-transform duration-500 translate-y-20 group-hover:translate-y-0">
                            <button
                                onClick={toggle3DMode}
                                className="bg-white/90 backdrop-blur-md text-gray-800 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
                            >
                                <span className="material-symbols-outlined">{is3DMode ? 'public' : 'view_in_ar'}</span>
                                {is3DMode ? 'Visão Plana' : 'Imersão 3D'}
                            </button>
                        </div>

                        {/* Status Indicator */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                            ✨ Modo Vetorial Ativo
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-gray-400 font-bold animate-pulse">Carregando Universo 3D...</div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AttractionMapModal;
