import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../../ui/Base';

// Types
export interface ItineraryStop {
    id: string;
    title: string;
    location: string;
    coordinates: [number, number]; // [lat, lng]
    transportMode: 'plane' | 'car' | 'train' | 'bus' | 'walk' | 'ferry';
    day: number;
}

interface AnimatedItineraryMapProps {
    stops: ItineraryStop[];
    animationSpeed?: number; // 1-10, default 5
    autoPlay?: boolean;
}

// Transport icons as SVG
const transportIcons: Record<string, string> = {
    plane: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
    train: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
    bus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>`,
    walk: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>`,
    ferry: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
};

// Create custom Leaflet icon for marker
const createTransportIcon = (mode: string, isActive: boolean = false) => {
    const color = isActive ? '#6366f1' : '#94a3b8';
    const bgColor = isActive ? '#eef2ff' : '#f1f5f9';
    const size = isActive ? 40 : 32;

    return L.divIcon({
        html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 3px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translate(-50%, -50%);
      ">
        ${transportIcons[mode] || transportIcons.car}
      </div>
    `,
        className: 'transport-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Create stop marker icon
const createStopIcon = (index: number, isVisited: boolean, isCurrent: boolean) => {
    const bgColor = isCurrent ? '#6366f1' : isVisited ? '#22c55e' : '#e2e8f0';
    const textColor = isCurrent || isVisited ? 'white' : '#64748b';

    return L.divIcon({
        html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${bgColor};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transform: translate(-50%, -50%);
      ">
        ${index + 1}
      </div>
    `,
        className: 'stop-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
};

// Component to animate map view
const MapAnimator: React.FC<{
    center: [number, number];
    zoom: number;
    animating: boolean;
}> = ({ center, zoom, animating }) => {
    const map = useMap();

    useEffect(() => {
        if (animating) {
            map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.5 });
        }
    }, [map, center, zoom, animating]);

    return null;
};

// Interpolate between two points
const interpolate = (
    start: [number, number],
    end: [number, number],
    progress: number
): [number, number] => {
    return [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress,
    ];
};

// Calculate bearing between two points
const calculateBearing = (start: [number, number], end: [number, number]): number => {
    const startLat = (start[0] * Math.PI) / 180;
    const startLng = (start[1] * Math.PI) / 180;
    const endLat = (end[0] * Math.PI) / 180;
    const endLng = (end[1] * Math.PI) / 180;

    const dLng = endLng - startLng;
    const x = Math.sin(dLng) * Math.cos(endLat);
    const y = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
};

const AnimatedItineraryMap: React.FC<AnimatedItineraryMapProps> = ({
    stops,
    animationSpeed = 5,
    autoPlay = false,
}) => {
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0); // 0-100
    const [currentSegment, setCurrentSegment] = useState(0);
    const [segmentProgress, setSegmentProgress] = useState(0); // 0-1 within a segment
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    // Calculate total segments
    const totalSegments = Math.max(stops.length - 1, 1);

    // Current position based on progress
    const currentPosition = useMemo(() => {
        if (stops.length < 2) return stops[0]?.coordinates || [0, 0];

        const segment = Math.min(currentSegment, stops.length - 2);
        const start = stops[segment].coordinates;
        const end = stops[segment + 1].coordinates;

        return interpolate(start, end, segmentProgress);
    }, [stops, currentSegment, segmentProgress]);

    // Current transport mode
    const currentTransportMode = useMemo(() => {
        if (stops.length === 0) return 'car';
        const segment = Math.min(currentSegment, stops.length - 2);
        return stops[segment + 1]?.transportMode || stops[segment]?.transportMode || 'car';
    }, [stops, currentSegment]);

    // Path that has been traveled
    const traveledPath = useMemo(() => {
        if (stops.length < 2) return [];

        const path: [number, number][] = [];
        for (let i = 0; i <= currentSegment && i < stops.length; i++) {
            path.push(stops[i].coordinates);
        }
        if (currentSegment < stops.length - 1) {
            path.push(currentPosition);
        }
        return path;
    }, [stops, currentSegment, currentPosition]);

    // Full path (grayed out)
    const fullPath = useMemo(() => {
        return stops.map(s => s.coordinates);
    }, [stops]);

    // Map bounds
    const bounds = useMemo(() => {
        if (stops.length === 0) return undefined;
        return L.latLngBounds(stops.map(s => s.coordinates));
    }, [stops]);

    // Animation loop
    const animate = useCallback((timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Speed calculation: 5 is base speed
        const speedMultiplier = animationSpeed / 5;
        const progressIncrement = (delta / 1000) * 0.02 * speedMultiplier;

        setSegmentProgress(prev => {
            const newProgress = prev + progressIncrement;
            if (newProgress >= 1) {
                // Move to next segment
                setCurrentSegment(seg => {
                    const nextSeg = seg + 1;
                    if (nextSeg >= totalSegments) {
                        // Animation complete
                        setIsPlaying(false);
                        setProgress(100);
                        return seg;
                    }
                    return nextSeg;
                });
                return 0;
            }
            // Update overall progress
            setProgress(((currentSegment + newProgress) / totalSegments) * 100);
            return newProgress;
        });

        animationRef.current = requestAnimationFrame(animate);
    }, [animationSpeed, currentSegment, totalSegments]);

    // Start/stop animation
    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = 0;
            animationRef.current = requestAnimationFrame(animate);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, animate]);

    // Reset animation
    const handleReset = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentSegment(0);
        setSegmentProgress(0);
    };

    // Toggle play/pause
    const handlePlayPause = () => {
        if (progress >= 100) {
            handleReset();
            setTimeout(() => setIsPlaying(true), 100);
        } else {
            setIsPlaying(!isPlaying);
        }
    };

    // Calculate map center based on current position
    const mapCenter = useMemo((): [number, number] => {
        if (isPlaying) {
            return currentPosition;
        }
        if (bounds) {
            const center = bounds.getCenter();
            return [center.lat, center.lng];
        }
        return [35.6762, 139.6503]; // Tokyo default
    }, [isPlaying, currentPosition, bounds]);

    // Default center if no stops
    const defaultCenter: [number, number] = stops[0]?.coordinates || [35.6762, 139.6503];

    if (stops.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100 rounded-xl">
                <div className="text-center text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2">route</span>
                    <p className="font-medium">Nenhuma parada definida</p>
                    <p className="text-sm">Adicione paradas ao seu itinerário para ver a animação</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-surface-level-1 rounded-xl overflow-hidden border border-surface-border">
            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={defaultCenter}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Map animator for follow mode */}
                    <MapAnimator center={mapCenter} zoom={isPlaying ? 10 : 6} animating={isPlaying} />

                    {/* Full path (gray) */}
                    <Polyline
                        positions={fullPath}
                        color="#cbd5e1"
                        weight={3}
                        dashArray="8 8"
                        opacity={0.6}
                    />

                    {/* Traveled path (primary color) */}
                    {traveledPath.length >= 2 && (
                        <Polyline
                            positions={traveledPath}
                            color="#6366f1"
                            weight={4}
                            opacity={1}
                        />
                    )}

                    {/* Stop markers */}
                    {stops.map((stop, index) => (
                        <Marker
                            key={stop.id}
                            position={stop.coordinates}
                            icon={createStopIcon(
                                index,
                                index < currentSegment || (index === currentSegment && segmentProgress > 0),
                                index === currentSegment || index === currentSegment + 1
                            )}
                        />
                    ))}

                    {/* Moving vehicle marker */}
                    {isPlaying && progress < 100 && (
                        <Marker
                            position={currentPosition}
                            icon={createTransportIcon(currentTransportMode, true)}
                        />
                    )}
                </MapContainer>

                {/* Current stop info overlay */}
                <div className="absolute top-4 left-4 right-4 z-[1000]">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 max-w-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined" dangerouslySetInnerHTML={{ __html: currentTransportMode === 'plane' ? 'flight' : currentTransportMode === 'train' ? 'train' : 'directions_car' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-text-main truncate">
                                    {stops[currentSegment]?.title || 'Ponto de partida'}
                                </p>
                                <p className="text-sm text-text-muted truncate">
                                    {progress < 100
                                        ? `→ ${stops[Math.min(currentSegment + 1, stops.length - 1)]?.title || 'Destino'}`
                                        : 'Roteiro completo!'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-4 bg-white border-t border-gray-100">
                {/* Progress bar */}
                <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-text-muted">
                        <span>Dia {stops[currentSegment]?.day || 1}</span>
                        <span>{Math.round(progress)}% completo</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="!p-3 !rounded-full"
                        title="Reiniciar"
                    >
                        <span className="material-symbols-outlined">replay</span>
                    </Button>

                    <Button
                        variant="dark"
                        onClick={handlePlayPause}
                        className="!px-8 !py-3 !rounded-full !bg-indigo-600 hover:!bg-indigo-700"
                    >
                        <span className="material-symbols-outlined">
                            {isPlaying ? 'pause' : progress >= 100 ? 'replay' : 'play_arrow'}
                        </span>
                        {isPlaying ? 'Pausar' : progress >= 100 ? 'Reiniciar' : 'Reproduzir'}
                    </Button>

                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-text-muted">Velocidade:</span>
                        <select
                            value={animationSpeed}
                            onChange={(e) => {
                                // This would need to be lifted to parent to work
                                console.log('Speed changed to:', e.target.value);
                            }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                        >
                            <option value={1}>0.5x</option>
                            <option value={3}>1x</option>
                            <option value={5}>2x</option>
                            <option value={7}>3x</option>
                            <option value={10}>5x</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimatedItineraryMap;
