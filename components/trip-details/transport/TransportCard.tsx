import * as React from 'react';
import { memo } from 'react';
import { Transport } from '../../../types';
import FlightCard from './FlightCard';

interface TransportCardProps {
    transport: Transport;
    onEdit: (transport: Transport) => void;
    onDelete: (id: string) => void;
}

const transportTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
    flight: { icon: 'flight', label: 'Voo', color: 'bg-blue-500' },
    train: { icon: 'train', label: 'Trem', color: 'bg-green-500' },
    car: { icon: 'directions_car', label: 'Carro', color: 'bg-amber-500' },
    transfer: { icon: 'local_taxi', label: 'Transfer', color: 'bg-purple-500' },
    bus: { icon: 'directions_bus', label: 'Ônibus', color: 'bg-orange-500' },
    ferry: { icon: 'directions_boat', label: 'Balsa', color: 'bg-cyan-500' },
};

const transportStatusConfig: Record<string, { label: string; color: string }> = {
    confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
    scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700' },
    booked: { label: 'Reservado', color: 'bg-purple-100 text-purple-700' },
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'Cancelado', color: 'bg-rose-100 text-rose-700' },
};

const TransportCardComponent: React.FC<TransportCardProps> = ({ transport, onEdit, onDelete }) => {
    // If it's a flight, use the specialized FlightCard
    if (transport.type === 'flight') {
        return <FlightCard transport={transport} onEdit={onEdit} onDelete={onDelete} />;
    }

    const typeConfig = transportTypeConfig[transport.type] || { icon: 'help', label: 'Outro', color: 'bg-gray-500' };
    const statusConfig = transportStatusConfig[transport.status] || { label: 'Desconhecido', color: 'bg-gray-100 text-gray-500' };

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100/50 overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-text-main">{transport.reference}</span>
                    {transport.route && <span className="text-text-muted text-sm">{transport.route}</span>}
                    {transport.duration && (
                        <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">{transport.duration}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transport);
                        }}
                        className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-text-muted transition-colors"
                        title="Editar transporte"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transport.id);
                        }}
                        className="size-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-text-muted hover:text-rose-500 transition-colors"
                        title="Remover transporte"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex flex-col md:flex-row gap-6">
                {/* Left: Icon + Operator */}
                <div className="flex flex-col items-center shrink-0 w-24">
                    <div className={`size-12 ${typeConfig.color} rounded-xl flex items-center justify-center text-white mb-2`}>
                        <span className="material-symbols-outlined text-2xl">{typeConfig.icon}</span>
                    </div>
                    <p className="text-xs font-bold text-text-main text-center">{transport.operator}</p>
                    <span className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                </div>

                {/* Center: Times */}
                <div className="flex-1 flex items-center gap-6">
                    {/* Departure */}
                    <div className="flex-1">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                            {transport.type === 'car' ? 'Retirada' : 'Partida'}
                        </p>
                        <p className="text-2xl font-black text-text-main">{transport.departureTime?.slice(0, 5)}</p>
                        <p className="text-sm text-text-muted">{transport.departureDate}</p>
                        <p className="text-xs text-text-main font-bold mt-1">{transport.departureLocation}</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-gray-300 text-3xl">arrow_forward</span>
                    </div>

                    {/* Arrival */}
                    <div className="flex-1">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                            {transport.type === 'car' ? 'Devolução' : 'Chegada'}
                        </p>
                        <p className="text-2xl font-black text-text-main">{transport.arrivalTime?.slice(0, 5)}</p>
                        <p className="text-sm text-text-muted">{transport.arrivalDate}</p>
                        <p className="text-xs text-text-main font-bold mt-1">{transport.arrivalLocation}</p>
                    </div>
                </div>

                {/* Right: Details */}
                <div className="shrink-0 w-full md:w-48 text-left md:text-right space-y-2 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0">
                    {transport.class && (
                        <div>
                            <p className="text-xs text-text-muted">Classe</p>
                            <p className="text-sm font-bold text-text-main truncate" title={transport.class}>{transport.class}</p>
                        </div>
                    )}
                    {transport.seat && (
                        <div>
                            <p className="text-xs text-text-muted">Assento</p>
                            <p className="text-sm font-bold text-text-main truncate">{transport.seat}</p>
                        </div>
                    )}
                    {transport.vehicle && (
                        <div>
                            <p className="text-xs text-text-muted">Veículo</p>
                            <p className="text-sm font-bold text-text-main truncate" title={transport.vehicle}>{transport.vehicle}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-text-muted">Código</p>
                        <p className="text-sm font-bold text-text-main break-all">{transport.confirmation || transport.reference}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TransportCard = memo(TransportCardComponent);

export default TransportCard;
