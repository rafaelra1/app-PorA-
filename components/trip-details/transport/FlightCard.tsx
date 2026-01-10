import * as React from 'react';
import { memo } from 'react';
import { Transport, FlightLiveStatus } from '../../../types';
import FlightStatusBadge from '../../ui/FlightStatusBadge';

interface FlightCardProps {
    transport: Transport;
    onEdit: (transport: Transport) => void;
    onDelete: (id: string) => void;
    liveStatus?: FlightLiveStatus;
    onRefreshStatus?: () => void;
}

const FlightCardComponent: React.FC<FlightCardProps> = ({ transport, onEdit, onDelete, liveStatus, onRefreshStatus }) => {
    // Helper to format dates (e.g., "12 November")
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            // Handle DD/MM/YYYY or YYYY-MM-DD
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                const [d, m, y] = dateString.split('/');
                if (d && m && y) {
                    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
                }
                return dateString;
            }
            return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        } catch (e) {
            return dateString;
        }
    };

    // Helper to get airport code from location string (e.g. "São Paulo (GRU)" -> "GRU")
    const getCode = (location: string) => {
        const match = location?.match(/\(([A-Z]{3})\)/);
        return match ? match[1] : location?.substring(0, 3).toUpperCase();
    };

    // Status visual config - use live status if available
    const hasLiveStatus = liveStatus && liveStatus.status !== 'unknown';
    const isConfirmed = transport.status === 'confirmed';
    const statusColor = isConfirmed ? 'text-green-500' : transport.status === 'cancelled' ? 'text-rose-500' : 'text-amber-500';
    const statusLabel = isConfirmed ? 'No horário' : transport.status === 'cancelled' ? 'Cancelado' : 'Agendado';

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
            {/* Hover Actions */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onRefreshStatus && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRefreshStatus();
                        }}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Atualizar status do voo"
                    >
                        <span className="material-symbols-outlined text-base">refresh</span>
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(transport);
                    }}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-primary hover:bg-blue-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(transport.id);
                    }}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">delete</span>
                </button>
            </div>

            {/* Header: Airline & Status */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-red-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-800 text-xl">airlines</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{transport.operator}</h3>
                        <p className="text-gray-400 text-xs font-medium">{transport.reference}</p>
                    </div>
                </div>
                <div className="text-right mt-1">
                    {hasLiveStatus ? (
                        <FlightStatusBadge
                            status={liveStatus.status}
                            delay={liveStatus.departureDelay}
                            size="sm"
                        />
                    ) : (
                        <div className={`flex items-center justify-end gap-1.5 text-xs font-bold ${statusColor}`}>
                            <div className={`size-1.5 rounded-full ${isConfirmed ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                            {statusLabel}
                        </div>
                    )}
                </div>
            </div>

            {/* Route & Times */}
            <div className="flex items-center justify-between mb-8 px-2">
                {/* Departure */}
                <div className="text-left">
                    <p className="text-2xl font-black text-gray-900 mb-1">{getCode(transport.departureLocation)}</p>
                    <p className="text-xs font-bold text-gray-400">{transport.departureTime?.slice(0, 5)}</p>
                </div>

                {/* Plane Visual */}
                <div className="flex-1 px-4 flex flex-col items-center">
                    <div className="w-full flex items-center gap-2">
                        <div className="h-[2px] w-full bg-gray-100 flex-1 relative">
                            {/* Dotted line overlay */}
                            <div className="absolute inset-0 border-b-2 border-dotted border-gray-300 w-full h-full"></div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 text-lg rotate-90">flight</span>
                        <div className="h-[2px] w-full bg-gray-100 flex-1 relative">
                            <div className="absolute inset-0 border-b-2 border-dotted border-gray-300 w-full h-full"></div>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">{transport.duration || 'Direto'}</p>
                </div>

                {/* Arrival */}
                <div className="text-right">
                    <p className="text-2xl font-black text-gray-900 mb-1">{getCode(transport.arrivalLocation)}</p>
                    <p className="text-xs font-bold text-gray-400">{transport.arrivalTime?.slice(0, 5)}</p>
                </div>
            </div>

            {/* Footer Details */}
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-lg">calendar_today</span>
                    <span className="text-xs font-bold text-gray-500">{formatDate(transport.departureDate)}</span>
                </div>

                {transport.duration && (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400 text-lg">schedule</span>
                        <span className="text-xs font-bold text-gray-500">{transport.duration}</span>
                    </div>
                )}

                {transport.seat && (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400 text-lg">airline_seat_recline_normal</span>
                        <span className="text-xs font-bold text-gray-500">{transport.seat}</span>
                    </div>
                )}

                {!transport.seat && transport.confirmation && (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400 text-lg">confirmation_number</span>
                        <span className="text-xs font-bold text-gray-500">{transport.confirmation}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const FlightCard = memo(FlightCardComponent);

export default FlightCard;
