// components/trip-details/transport/FlightStatusCard.tsx
// Detailed flight status card with departure/arrival info, gates, and delays

import * as React from 'react';
import { FlightLiveStatus } from '../../../types';
import { flightStatusService } from '../../../services/flightStatusService';
import FlightStatusBadge from '../../ui/FlightStatusBadge';
import Icon from '../../ui/Icon';

interface FlightStatusCardProps {
    status: FlightLiveStatus;
    isLoading?: boolean;
    onRefresh?: () => void;
    className?: string;
}

// Format ISO datetime to HH:mm
function formatTime(isoDate: string | undefined): string {
    if (!isoDate) return '--:--';
    const date = new Date(isoDate);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Format delay display with +/- indicator
function formatDelayIndicator(scheduled: string, actual: string | undefined, delay: number | undefined): React.ReactNode {
    if (!actual || !delay || delay === 0) return null;

    const scheduledTime = formatTime(scheduled);
    const actualTime = formatTime(actual);

    return (
        <span className="text-yellow-400 text-sm">
            {scheduledTime} → {actualTime} (+{delay} min)
        </span>
    );
}

export const FlightStatusCard: React.FC<FlightStatusCardProps> = ({
    status,
    isLoading = false,
    onRefresh,
    className = '',
}) => {
    const lastUpdatedTime = new Date(status.lastUpdated).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">✈️ {status.flightNumber}</span>
                    <span className="text-gray-400">
                        {status.departureAirport} → {status.arrivalAirport}
                    </span>
                </div>
                <FlightStatusBadge status={status.status} delay={status.departureDelay} />
            </div>

            {/* Main Content - Two Columns */}
            <div className="grid grid-cols-2 gap-6">
                {/* Departure Column */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                        Partida ({status.departureAirport})
                    </div>

                    {status.departureTerminal && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Icon name="building" size="sm" className="text-gray-500" />
                            <span>Terminal {status.departureTerminal}</span>
                            {status.departureGate && (
                                <span>, Portão {status.departureGate}</span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Icon name="clock" size="sm" className="text-gray-500" />
                        <span className="text-white font-medium">{formatTime(status.scheduledDeparture)}</span>
                        {status.departureDelay && status.departureDelay > 0 && (
                            <span className="text-yellow-400 text-sm">
                                → {formatTime(status.estimatedDeparture || status.actualDeparture)} (+{status.departureDelay} min)
                            </span>
                        )}
                    </div>

                    {status.actualDeparture && (
                        <div className="text-sm text-emerald-400">
                            ✓ Decolou às {formatTime(status.actualDeparture)}
                        </div>
                    )}
                </div>

                {/* Arrival Column */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                        Chegada ({status.arrivalAirport})
                    </div>

                    {status.arrivalTerminal && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Icon name="building" size="sm" className="text-gray-500" />
                            <span>Terminal {status.arrivalTerminal}</span>
                            {status.arrivalGate && (
                                <span>, Portão {status.arrivalGate}</span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Icon name="clock" size="sm" className="text-gray-500" />
                        <span className="text-white font-medium">{formatTime(status.scheduledArrival)}</span>
                        {status.arrivalDelay && status.arrivalDelay > 0 && (
                            <span className="text-yellow-400 text-sm">
                                → {formatTime(status.estimatedArrival || status.actualArrival)} (+{status.arrivalDelay} min)
                            </span>
                        )}
                    </div>

                    {status.actualArrival && (
                        <div className="text-sm text-emerald-400">
                            ✓ Pousou às {formatTime(status.actualArrival)}
                        </div>
                    )}

                    {status.arrivalBaggage && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Icon name="briefcase" size="sm" className="text-gray-500" />
                            <span>Esteira {status.arrivalBaggage}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                        >
                            <Icon
                                name="refresh-cw"
                                size="sm"
                                className={isLoading ? 'animate-spin' : ''}
                            />
                            <span>Atualizar</span>
                        </button>
                    )}
                    <span>Atualizado: {lastUpdatedTime}</span>
                </div>

                {status.aircraftType && (
                    <div className="text-sm text-gray-500">
                        {status.aircraftType}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightStatusCard;
