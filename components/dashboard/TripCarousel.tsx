import React, { useRef, useState } from 'react';
import { Trip } from '../../types';

interface TripCarouselProps {
    trips: Trip[];
    onViewTrip: (id: string) => void;
    onAddTrip: () => void;
}

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1496442226666-8d4a0e29f16e?q=80&w=2070&auto=format&fit=crop', // New York
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', // Switzerland
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1974&auto=format&fit=crop', // Tokyo
    'https://images.unsplash.com/photo-1533929736458-ca588d080e81?q=80&w=2070&auto=format&fit=crop', // London
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1966&auto=format&fit=crop', // Venice
    'https://images.unsplash.com/photo-1499591934245-40b55745b905?q=80&w=2072&auto=format&fit=crop', // Travel Generic
];

const TripCarousel: React.FC<TripCarouselProps> = ({ trips, onViewTrip, onAddTrip }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 320; // Updated for new card width + gap
            const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
            scrollRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    const getDuration = (start: string, end: string) => {
        try {
            if (!start || !end) return '';
            // Handle both YYYY-MM-DD and DD/MM/YYYY formats
            const parseDate = (d: string) => {
                if (d.includes('/')) {
                    const [day, month, year] = d.split('/').map(Number);
                    return new Date(year, month - 1, day);
                }
                const [year, month, day] = d.split('-').map(Number);
                return new Date(year, month - 1, day);
            };

            const startDate = parseDate(start);
            const endDate = parseDate(end);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return `${diffDays} dias`;
        } catch {
            return '';
        }
    };

    const getCountry = (destination: string) => {
        // Simple heuristic: Get last part after comma, or just the destination if no comma
        const parts = destination.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : destination;
    };

    const getCity = (destination: string) => {
        // Get first part before comma
        return destination.split(',')[0].trim();
    };

    return (
        <div className="relative group">
            {/* Navigation Buttons */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary-dark transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                aria-label="Scroll left"
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary-dark transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll right"
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </button>

            {/* Carousel Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto hide-scrollbar py-4 px-1"
                style={{ scrollSnapType: 'x mandatory' }}
            >
                {trips.map((trip, index) => {
                    const city = getCity(trip.destination);
                    const country = getCountry(trip.destination);
                    const duration = getDuration(trip.startDate, trip.endDate);
                    const bgImage = (trip.coverImage && !imageErrors.has(trip.id))
                        ? trip.coverImage
                        : PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];

                    return (
                        <div
                            key={trip.id}
                            onClick={() => onViewTrip(trip.id)}
                            className="relative min-w-[300px] h-[200px] rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all hover:-translate-y-1 shrink-0"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            {/* Background Image */}
                            <img
                                src={bgImage}
                                alt={trip.destination}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                onError={() => setImageErrors(prev => new Set(prev).add(trip.id))}
                            />

                            {/* Trip Status Badge */}
                            <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-[4px] shadow-sm z-10 ${trip.status === 'confirmed'
                                ? 'bg-[#2ECC71]'
                                : trip.status === 'completed'
                                    ? 'bg-gray-500'
                                    : 'bg-[#3498DB]'
                                }`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                                    {trip.status === 'confirmed' ? 'Confirmada' : trip.status === 'completed' ? 'Realizada' : 'Planejando'}
                                </span>
                            </div>

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                            {/* Content */}
                            <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-center text-center">

                                {/* Trip Title */}
                                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1 drop-shadow-lg line-clamp-2">
                                    {trip.title || city}
                                </h3>

                                {/* Subtext Details */}
                                <div className="flex flex-col gap-1.5 items-center justify-center mb-3 w-full">
                                    {/* Subtitle removed to avoid redundancy */}
                                    <div className="flex items-center gap-2 text-white/70 text-[11px] font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-[2px]">
                                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                        <span>{trip.startDate} • {duration}</span>
                                    </div>
                                </div>

                                {/* Participants removed or hidden if too crowded? User didn't say, but keeping for now */}
                                {trip.participants && trip.participants.length > 0 && (
                                    <div className="hidden sm:flex -space-x-2 pt-1">
                                        {trip.participants.slice(0, 4).map((p, i) => (
                                            <div key={p.id || i} className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-gray-200" title={p.name}>
                                                {p.avatar ? (
                                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary text-white text-[10px] font-bold">
                                                        {p.initials || p.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {trip.participants.length > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-bold">
                                                +{trip.participants.length - 4}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Add New Trip Card */}
                <div
                    onClick={onAddTrip}
                    className="min-w-[300px] h-[200px] flex flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-light/10 transition-all cursor-pointer shrink-0 group text-gray-400 hover:text-primary"
                    style={{ scrollSnapAlign: 'start' }}
                >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">add</span>
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wide">Nova Viagem</span>
                </div>
            </div>
        </div>
    );
};

export default TripCarousel;
