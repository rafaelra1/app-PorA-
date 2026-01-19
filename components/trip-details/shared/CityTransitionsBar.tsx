import * as React from 'react';
import { City, Transport } from '../../../types';

interface CityTransition {
    from: City;
    to: City;
    hasTransport: boolean;
    transportStatus?: 'confirmed' | 'pending' | 'scheduled' | 'booked';
}

interface CityTransitionsBarProps {
    cities: City[];
    transports: Transport[];
    selectedTransition?: { from: string; to: string };
    onTransitionSelect?: (transition: { from: string; to: string } | undefined) => void;
}

/**
 * Horizontal scrollable bar showing city transitions with transport booking status
 * Shows connections between consecutive cities in the itinerary
 */
const CityTransitionsBar: React.FC<CityTransitionsBarProps> = ({
    cities,
    transports,
    selectedTransition,
    onTransitionSelect,
}) => {
    if (!cities || cities.length < 2) return null;

    // Generate transitions between consecutive cities
    const transitions: CityTransition[] = React.useMemo(() => {
        const result: CityTransition[] = [];

        // Sort cities by arrival date
        const sortedCities = [...cities].sort((a, b) =>
            new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
        );

        for (let i = 0; i < sortedCities.length - 1; i++) {
            const fromCity = sortedCities[i];
            const toCity = sortedCities[i + 1];

            // Check if there's a transport between these cities
            const matchingTransport = transports.find(t => {
                const depMatch = t.departureCity?.toLowerCase().includes(fromCity.name.toLowerCase()) ||
                    t.departureLocation?.toLowerCase().includes(fromCity.name.toLowerCase());
                const arrMatch = t.arrivalCity?.toLowerCase().includes(toCity.name.toLowerCase()) ||
                    t.arrivalLocation?.toLowerCase().includes(toCity.name.toLowerCase());
                return depMatch && arrMatch;
            });

            result.push({
                from: fromCity,
                to: toCity,
                hasTransport: !!matchingTransport,
                transportStatus: matchingTransport?.status as CityTransition['transportStatus'],
            });
        }

        return result;
    }, [cities, transports]);

    const isTransitionSelected = (t: CityTransition): boolean => {
        return selectedTransition?.from === t.from.id && selectedTransition?.to === t.to.id;
    };

    const getStatusIcon = (transition: CityTransition) => {
        if (!transition.hasTransport) {
            return (
                <span className="flex items-center justify-center size-5 rounded-full bg-rose-100 text-rose-500">
                    <span className="material-symbols-outlined text-xs">close</span>
                </span>
            );
        }

        if (transition.transportStatus === 'confirmed' || transition.transportStatus === 'booked') {
            return (
                <span className="flex items-center justify-center size-5 rounded-full bg-green-100 text-green-600">
                    <span className="material-symbols-outlined text-xs fill">check_circle</span>
                </span>
            );
        }

        if (transition.transportStatus === 'pending' || transition.transportStatus === 'scheduled') {
            return (
                <span className="flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-600">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                </span>
            );
        }

        return (
            <span className="flex items-center justify-center size-5 rounded-full bg-gray-100 text-gray-400">
                <span className="material-symbols-outlined text-xs">directions</span>
            </span>
        );
    };

    return (
        <div className="bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-teal-50/80 rounded-2xl p-3 border border-blue-100/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500 text-sm">route</span>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Transições entre Cidades</span>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {/* All transitions option */}
                <button
                    onClick={() => onTransitionSelect?.(undefined)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${!selectedTransition
                            ? 'bg-white text-blue-700 shadow-md ring-2 ring-blue-200'
                            : 'bg-white/60 text-text-muted hover:bg-white hover:shadow-sm border border-white/80'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">list_alt</span>
                    Todas
                </button>

                {transitions.map((transition, index) => {
                    const isSelected = isTransitionSelected(transition);

                    return (
                        <button
                            key={`${transition.from.id}-${transition.to.id}`}
                            onClick={() => onTransitionSelect?.({ from: transition.from.id, to: transition.to.id })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${isSelected
                                    ? 'bg-white text-blue-700 shadow-md ring-2 ring-blue-200'
                                    : 'bg-white/60 text-text-muted hover:bg-white hover:shadow-sm border border-white/80'
                                }`}
                        >
                            {/* From City */}
                            <span className="text-text-main">{transition.from.name}</span>

                            {/* Arrow */}
                            <span className="material-symbols-outlined text-sm text-gray-400">arrow_forward</span>

                            {/* To City */}
                            <span className="text-text-main">{transition.to.name}</span>

                            {/* Status Icon */}
                            {getStatusIcon(transition)}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-blue-100/50">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="size-4 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 text-[10px] fill">check_circle</span>
                    </span>
                    <span>Reservado</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="size-4 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 text-[10px]">schedule</span>
                    </span>
                    <span>Pendente</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="size-4 rounded-full bg-rose-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-rose-500 text-[10px]">close</span>
                    </span>
                    <span>Sem transporte</span>
                </div>
            </div>
        </div>
    );
};

export default CityTransitionsBar;
