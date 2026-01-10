import React, { useState, useEffect } from 'react';
import { Trip } from '../../types';
import { Icon } from '../ui/Base';
import { calculateDaysRemaining, calculateDuration } from '../../lib/dateUtils';
import { getFlagsForDestinations } from '../../lib/countryUtils';
import CountdownBadge from '../ui/CountdownBadge';

// =============================================================================
// Types
// =============================================================================

interface TripDetailsHeaderProps {
    trip: Trip;
    onBack: () => void;
    onEdit: () => void;
    onShare: () => void;
}

// =============================================================================
// Status Badge Component
// =============================================================================

interface StatusBadgeProps {
    status: 'planning' | 'confirmed' | 'completed';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = {
        planning: {
            bg: 'bg-blue-500',
            icon: 'edit_calendar',
            label: 'Em Planejamento'
        },
        confirmed: {
            bg: 'bg-emerald-500',
            icon: 'check_circle',
            label: 'Confirmado'
        },
        completed: {
            bg: 'bg-gray-500',
            icon: 'task_alt',
            label: 'Concluída'
        }
    };

    const { bg, icon, label } = config[status] || config.planning;

    return (
        <div className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
            ${bg} text-white font-bold text-xs uppercase tracking-wide
            animate-in fade-in slide-in-from-left-2 duration-300
        `}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
            <span>{label}</span>
        </div>
    );
};

// =============================================================================
// Participant Avatar Component with Tooltip
// =============================================================================

interface ParticipantAvatarProps {
    participant: { name: string; avatar?: string; isOrganizer?: boolean };
    index: number;
}

const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({ participant, index }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <img
                src={participant.avatar || `https://ui-avatars.com/api/?name=${participant.name}&background=random`}
                alt={participant.name}
                className={`
                    size-8 rounded-full border-2 bg-gray-200
                    transition-all duration-200 cursor-pointer
                    hover:scale-110 hover:z-10
                    ${participant.isOrganizer ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white'}
                `}
                style={{ zIndex: 10 - index }}
            />

            {/* Tooltip */}
            {showTooltip && (
                <div className="
                    absolute -bottom-10 left-1/2 -translate-x-1/2
                    bg-gray-900/95 text-white text-xs px-2.5 py-1.5 rounded-lg
                    whitespace-nowrap z-50
                    animate-in fade-in zoom-in-95 duration-150
                    shadow-lg
                ">
                    <span>{participant.name}</span>
                    {participant.isOrganizer && (
                        <span className="ml-1 text-amber-400">★</span>
                    )}
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 
                                    border-4 border-transparent border-b-gray-900/95" />
                </div>
            )}
        </div>
    );
};

// =============================================================================
// Main Header Component
// =============================================================================

const TripDetailsHeader: React.FC<TripDetailsHeaderProps> = ({ trip, onBack, onEdit, onShare }) => {
    const [scrollY, setScrollY] = useState(0);
    const daysRemaining = calculateDaysRemaining(trip.startDate);
    const duration = calculateDuration(trip.startDate, trip.endDate);
    const flags = getFlagsForDestinations(trip.destination);

    // Parallax effect
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Limit parallax movement
    const parallaxOffset = Math.min(scrollY * 0.3, 30);

    return (
        <div className="relative w-full h-[250px] shadow-xl z-50 rounded-3xl overflow-hidden animate-fade-in group">
            {/* Background Image with Parallax */}
            <img
                src={trip.coverImage}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={trip.title}
                style={{
                    transform: `translateY(${parallaxOffset}px)`,
                    willChange: 'transform'
                }}
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
                    {/* Share Button */}
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
                        {/* Status Badge - Improved */}
                        <StatusBadge status={trip.status as 'planning' | 'confirmed' | 'completed'} />

                        {/* Countdown Badge - New Component */}
                        {daysRemaining >= -30 && (
                            <CountdownBadge
                                targetDate={trip.startDate}
                                variant={daysRemaining <= 7 ? 'urgent' : 'default'}
                            />
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2 drop-shadow-lg">
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

                        {/* Participants - Improved with Tooltips */}
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {trip.participants.slice(0, 4).map((p, i) => (
                                    <ParticipantAvatar
                                        key={i}
                                        participant={p}
                                        index={i}
                                    />
                                ))}
                                {trip.participants.length > 4 && (
                                    <div className="size-8 rounded-full border-2 border-white bg-gray-800/80 backdrop-blur-sm text-white flex items-center justify-center text-xs font-bold">
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
