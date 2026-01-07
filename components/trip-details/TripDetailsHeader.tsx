import React from 'react';
import { Trip } from '../../types';
import { Badge, Icon } from '../ui/Base';
import { calculateDaysRemaining, calculateDuration } from '../../lib/dateUtils';
import { getFlagsForDestinations } from '../../lib/countryUtils';

interface TripDetailsHeaderProps {
    trip: Trip;
    onBack: () => void;
    onEdit: () => void;
    onShare: () => void;
}

const TripDetailsHeader: React.FC<TripDetailsHeaderProps> = ({ trip, onBack, onEdit, onShare }) => {
    const daysRemaining = calculateDaysRemaining(trip.startDate);
    const duration = calculateDuration(trip.startDate, trip.endDate);
    const flags = getFlagsForDestinations(trip.destination);

    return (
        <div className="relative w-full h-[250px] shadow-xl z-50 rounded-3xl overflow-hidden animate-fade-in group">
            {/* Background Image */}
            <img
                src={trip.coverImage}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={trip.title}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none"></div>

            {/* Top Bar Actions */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all border border-white/20 active:scale-95"
                >
                    <Icon name="arrow_back" className="text-white" />
                </button>

                {/* Right Side Actions */}
                <div className="flex gap-3">
                    {/* Edit Button */}
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-xs md:text-sm"
                    >
                        <Icon name="edit" className="size-4" />
                        Editar Viagem
                    </button>
                    {/* Share Button (Optional, keeping consistent with design) */}
                    <button
                        onClick={onShare}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-xs md:text-sm"
                    >
                        <Icon name="share" className="size-4" />
                        Compartilhar
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                <div className="flex flex-col gap-6 max-w-5xl mx-auto">

                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <Badge color={trip.status === 'confirmed' ? 'bg-green-500 text-white' : trip.status === 'planning' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}>
                            {trip.status === 'confirmed' ? 'CONFIRMADO' : trip.status === 'planning' ? 'EM PLANEJAMENTO' : 'CONCLUÍDA'}
                        </Badge>

                        {daysRemaining > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/10">
                                <span className="material-symbols-outlined text-white text-sm">flight_takeoff</span>
                                <span className="text-xs font-bold text-white uppercase tracking-wide">
                                    {daysRemaining} {daysRemaining === 1 ? 'Dia Restante' : 'Dias Restantes'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Title and Destination */}
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2 shadow-sm">
                            {trip.title}
                        </h1>
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-white/90 text-sm md:text-base font-medium">

                        {/* Dates */}
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-white">calendar_today</span>
                            <span>{trip.startDate} - {trip.endDate}</span>
                        </div>

                        {/* Duration */}
                        {duration !== null && (
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-white">schedule</span>
                                <span>{duration} Dias</span>
                            </div>
                        )}

                        {/* Participants */}
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {trip.participants.slice(0, 4).map((p, i) => (
                                    <img
                                        key={i}
                                        src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`}
                                        alt={p.name}
                                        className="size-6 rounded-full border border-white bg-gray-200"
                                        title={p.name}
                                    />
                                ))}
                                {trip.participants.length > 4 && (
                                    <div className="size-6 rounded-full border border-white bg-gray-800 text-white flex items-center justify-center text-[10px]">
                                        +{trip.participants.length - 4}
                                    </div>
                                )}
                            </div>
                            <span>{trip.participants.length > 0 ? 'Com Amigos' : 'Viajante Solo'}</span>
                        </div>

                        {/* Country Flags */}
                        {flags.length > 0 && (
                            <div className="flex items-center gap-2 pl-4 border-l border-white/20">
                                <div className="flex -space-x-1.5">
                                    {flags.map((flag, idx) => (
                                        <img
                                            key={idx}
                                            src={flag}
                                            alt="Flag"
                                            className="size-5 rounded-full border border-white object-cover"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripDetailsHeader;
