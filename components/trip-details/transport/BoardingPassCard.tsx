import * as React from 'react';
import { Transport } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface BoardingPassCardProps {
    transport: Transport;
    onEdit?: (transport: Transport) => void;
    onDelete?: (id: string) => void;
}

// =============================================================================
// Config
// =============================================================================

const typeConfig: Record<string, { icon: string; label: string; gradient: string }> = {
    flight: { icon: 'flight', label: 'Voo', gradient: 'from-blue-500 to-indigo-600' },
    train: { icon: 'train', label: 'Trem', gradient: 'from-emerald-500 to-teal-600' },
    bus: { icon: 'directions_bus', label: 'Ônibus', gradient: 'from-orange-500 to-amber-600' },
    car: { icon: 'directions_car', label: 'Carro', gradient: 'from-purple-500 to-violet-600' },
    ferry: { icon: 'directions_boat', label: 'Balsa', gradient: 'from-cyan-500 to-blue-600' },
    transfer: { icon: 'local_taxi', label: 'Transfer', gradient: 'from-yellow-500 to-orange-600' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    confirmed: { label: 'Confirmado', color: 'bg-emerald-500 text-white' },
    scheduled: { label: 'Agendado', color: 'bg-blue-500 text-white' },
    booked: { label: 'Reservado', color: 'bg-purple-500 text-white' },
    pending: { label: 'Pendente', color: 'bg-amber-500 text-white' },
    cancelled: { label: 'Cancelado', color: 'bg-rose-500 text-white' },
};

// =============================================================================
// BoardingPassCard Component (AirAxis Style)
// =============================================================================

const BoardingPassCard: React.FC<BoardingPassCardProps> = ({
    transport,
    onEdit,
    onDelete
}) => {
    const type = typeConfig[transport.type] || typeConfig.flight;
    const status = statusConfig[transport.status] || statusConfig.pending;

    return (
        <div className="relative bg-white rounded-2xl shadow-soft overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Notches for boarding pass effect */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 size-6 bg-gray-100 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-6 bg-gray-100 rounded-full" />

            {/* Header with Gradient */}
            <div className={`bg-gradient-to-r ${type.gradient} p-4 text-white`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">{type.icon}</span>
                        </div>
                        <div>
                            <p className="text-xs opacity-80 uppercase tracking-wider">{type.label}</p>
                            <p className="font-bold text-lg">{transport.reference || transport.operator}</p>
                        </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Dashed Divider */}
            <div className="relative px-6">
                <div className="border-t-2 border-dashed border-gray-200" />
            </div>

            {/* Main Content */}
            <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                    {/* Departure */}
                    <div className="flex-1 text-center">
                        <p className="text-3xl font-black text-text-main">
                            {transport.departureTime?.slice(0, 5) || '--:--'}
                        </p>
                        <p className="text-sm font-bold text-text-main mt-1">
                            {transport.departureLocation?.split('(')[0]?.trim() || 'Origem'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{transport.departureDate}</p>
                    </div>

                    {/* Flight Path Visual */}
                    <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 w-full">
                            <div className="size-2 rounded-full bg-indigo-500" />
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-500 via-gray-300 to-indigo-500 relative">
                                <span className={`
                                    absolute left-1/2 -translate-x-1/2 -top-3.5
                                    material-symbols-outlined text-indigo-500
                                `}>
                                    {type.icon}
                                </span>
                            </div>
                            <div className="size-2 rounded-full bg-indigo-500" />
                        </div>
                        {transport.duration && (
                            <p className="text-[10px] text-text-muted">{transport.duration}</p>
                        )}
                    </div>

                    {/* Arrival */}
                    <div className="flex-1 text-center">
                        <p className="text-3xl font-black text-text-main">
                            {transport.arrivalTime?.slice(0, 5) || '--:--'}
                        </p>
                        <p className="text-sm font-bold text-text-main mt-1">
                            {transport.arrivalLocation?.split('(')[0]?.trim() || 'Destino'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{transport.arrivalDate}</p>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                    {transport.operator && (
                        <div className="flex items-center gap-1.5 text-xs text-text-muted bg-gray-100 px-2.5 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-sm">business</span>
                            {transport.operator}
                        </div>
                    )}
                    {transport.class && (
                        <div className="flex items-center gap-1.5 text-xs text-text-muted bg-gray-100 px-2.5 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-sm">airline_seat_recline_extra</span>
                            {transport.class}
                        </div>
                    )}
                    {transport.seat && (
                        <div className="flex items-center gap-1.5 text-xs text-text-muted bg-gray-100 px-2.5 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-sm">event_seat</span>
                            {transport.seat}
                        </div>
                    )}
                    {transport.confirmation && (
                        <div className="flex items-center gap-1.5 text-xs text-text-main bg-indigo-50 px-2.5 py-1.5 rounded-lg font-mono">
                            <span className="material-symbols-outlined text-sm text-indigo-500">confirmation_number</span>
                            {transport.confirmation}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(transport)}
                                className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-text-muted transition-colors"
                                title="Editar"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(transport.id)}
                                className="size-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-text-muted hover:text-rose-500 transition-colors"
                                title="Remover"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code Mockup */}
            <div className="absolute bottom-4 right-4 opacity-10">
                <div className="grid grid-cols-5 gap-0.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                        <div
                            key={i}
                            className={`size-1.5 ${Math.random() > 0.5 ? 'bg-gray-900' : 'bg-transparent'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BoardingPassCard;
