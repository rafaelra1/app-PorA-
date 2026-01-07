import React, { useEffect, useRef } from 'react';
import { DestinationMetadata } from '../../../types';

interface DestinationMapV2Props {
    destinations: string[];
    metadata?: DestinationMetadata[];
    coordinates?: Array<{ lat: number; lng: number; name: string }>;
}

const DestinationMapV2: React.FC<DestinationMapV2Props> = ({ destinations, metadata, coordinates }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        // Check if Leaflet is available
        if (typeof window !== 'undefined' && (window as any).L && mapRef.current && !mapInstanceRef.current) {
            const L = (window as any).L;

            // Default center (first coordinate or fallback)
            const defaultCenter = coordinates?.[0] || { lat: 35.6762, lng: 139.6503 }; // Tokyo fallback

            // Initialize map
            const map = L.map(mapRef.current).setView([defaultCenter.lat, defaultCenter.lng], 6);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Add markers for each coordinate
            if (coordinates && coordinates.length > 0) {
                const bounds: [number, number][] = [];

                coordinates.forEach((coord, idx) => {
                    const marker = L.marker([coord.lat, coord.lng]).addTo(map);
                    marker.bindPopup(`<b>${coord.name || destinations[idx] || `Destino ${idx + 1}`}</b>`);
                    bounds.push([coord.lat, coord.lng]);
                });

                // Draw line between destinations if multiple
                if (coordinates.length > 1) {
                    L.polyline(bounds, { color: '#6B68FF', weight: 3, opacity: 0.7, dashArray: '10, 10' }).addTo(map);
                }

                // Fit map to show all markers
                if (bounds.length > 0) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }

            mapInstanceRef.current = map;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [destinations, coordinates]);

    // Fallback if Leaflet is not loaded
    const hasLeaflet = typeof window !== 'undefined' && (window as any).L;

    if (!hasLeaflet) {
        return (
            <div className="bg-white rounded-2xl border border-[#EDEFF3] overflow-hidden">
                <div className="p-4 border-b border-[#EDEFF3]">
                    <h3 className="font-bold text-[#1F1F1F] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#6B68FF]">map</span>
                        Destinos da Viagem
                    </h3>
                </div>
                <div className="p-6">
                    {/* Static destination list as fallback */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        {destinations.map((dest, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-[#6B68FF]/10 text-[#6B68FF] rounded-xl font-medium">
                                <span className="w-6 h-6 rounded-full bg-[#6B68FF] text-white flex items-center justify-center text-sm font-bold">
                                    {idx + 1}
                                </span>
                                {dest}
                            </div>
                        ))}
                    </div>

                    {destinations.length > 1 && (
                        <div className="flex items-center gap-2 text-sm text-[#9F9FB1]">
                            <span className="material-symbols-outlined text-lg">route</span>
                            Rota: {destinations.join(' → ')}
                        </div>
                    )}

                    <div className="mt-4 p-4 bg-[#EDEFF3] rounded-xl text-center">
                        <span className="material-symbols-outlined text-4xl text-[#9F9FB1] mb-2 block">travel_explore</span>
                        <p className="text-sm text-[#9F9FB1]">
                            Para ver o mapa interativo, adicione Leaflet ao projeto.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-[#EDEFF3] overflow-hidden">
            <div className="p-4 border-b border-[#EDEFF3]">
                <h3 className="font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B68FF]">map</span>
                    Mapa da Viagem
                </h3>
                <p className="text-sm text-[#9F9FB1] mt-1">
                    {destinations.join(' → ')}
                </p>
            </div>
            <div ref={mapRef} className="h-64 w-full" />
        </div>
    );
};

export default DestinationMapV2;
