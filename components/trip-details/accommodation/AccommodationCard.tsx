import * as React from 'react';
import { memo } from 'react';
import { HotelReservation } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface AccommodationCardProps {
    hotel: HotelReservation;
    onEdit?: (hotel: HotelReservation) => void;
    onDelete?: (id: string) => void;
    onViewMap?: (hotel: HotelReservation) => void;
}

// =============================================================================
// Status Config
// =============================================================================

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: 'schedule' },
    cancelled: { label: 'Cancelado', color: 'bg-rose-100 text-rose-700', icon: 'cancel' },
};

// =============================================================================
// AccommodationCard Component
// =============================================================================

const AccommodationCardComponent: React.FC<AccommodationCardProps> = ({
    hotel,
    onEdit,
    onDelete,
    onViewMap
}) => {
    const status = statusConfig[hotel.status] || statusConfig.pending;

    // Calculate nights
    const calculateNights = (): number => {
        try {
            const parseDate = (dateStr: string): Date => {
                if (dateStr.includes('/')) {
                    const [day, month, year] = dateStr.split('/').map(Number);
                    return new Date(year, month - 1, day);
                }
                return new Date(dateStr);
            };

            const checkIn = parseDate(hotel.checkIn);
            const checkOut = parseDate(hotel.checkOut);
            const diff = checkOut.getTime() - checkIn.getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        } catch {
            return 0;
        }
    };

    const nights = calculateNights();

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100/50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="relative w-full md:w-48 h-40 md:h-auto shrink-0">
                    <img
                        src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Nights Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-bold">
                        {nights} {nights === 1 ? 'noite' : 'noites'}
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${status.color}`}>
                        <span className="material-symbols-outlined text-xs">{status.icon}</span>
                        {status.label}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-text-main mb-1">{hotel.name}</h3>
                            {hotel.address && (
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    {hotel.address}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onViewMap && (
                                <button
                                    onClick={() => onViewMap(hotel)}
                                    className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-text-muted transition-colors"
                                    title="Ver no mapa"
                                >
                                    <span className="material-symbols-outlined text-lg">map</span>
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(hotel)}
                                    className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-text-muted transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(hotel.id)}
                                    className="size-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-text-muted hover:text-rose-500 transition-colors"
                                    title="Remover"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Check-in / Check-out Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Check-in */}
                        <div className="bg-emerald-50 rounded-xl p-3">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Check-in</p>
                            <p className="text-lg font-black text-emerald-700">{hotel.checkInTime || '14:00'}</p>
                            <p className="text-xs text-emerald-600">{hotel.checkIn}</p>
                        </div>

                        {/* Check-out */}
                        <div className="bg-rose-50 rounded-xl p-3">
                            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1">Check-out</p>
                            <p className="text-lg font-black text-rose-700">{hotel.checkOutTime || '12:00'}</p>
                            <p className="text-xs text-rose-600">{hotel.checkOut}</p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap items-center gap-3">
                        {hotel.confirmation && (
                            <div className="flex items-center gap-1 text-xs text-text-muted bg-gray-100 px-2.5 py-1 rounded-lg">
                                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                                {hotel.confirmation}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccommodationCard = memo(AccommodationCardComponent);

export default AccommodationCard;
