import * as React from 'react';
import { Trip, HotelReservation } from '../../../types';
import { Skeleton } from '../../ui/Base';

interface AccommodationViewProps {
    trip: Trip;
    hotels: HotelReservation[];
    onAddAccommodation: () => void;
    onEditAccommodation: (hotel: HotelReservation) => void;
    onDeleteAccommodation: (id: string) => void;
    filter: 'all' | 'hotel' | 'home';
    onFilterChange: (filter: 'all' | 'hotel' | 'home') => void;
    viewMode: 'list' | 'grid';
    onViewModeChange: (mode: 'list' | 'grid') => void;
    sortOrder: 'newest' | 'oldest';
    onSortOrderChange: (order: 'newest' | 'oldest') => void;
    isLoading?: boolean;
}

const AccommodationView: React.FC<AccommodationViewProps> = ({
    trip,
    hotels,
    onAddAccommodation,
    onEditAccommodation,
    onDeleteAccommodation,
    filter,
    onFilterChange,
    viewMode,
    onViewModeChange,
    sortOrder,
    onSortOrderChange,
    isLoading,
}) => {
    // Filter and sort hotels
    let displayedHotels =
        filter === 'all'
            ? hotels
            : hotels.filter(
                (h) => h.type === filter || (!h.type && filter === 'hotel')
            );

    if (sortOrder === 'newest') {
        displayedHotels = [...displayedHotels].reverse();
    }

    const hasMissingDates = !trip.startDate || !trip.endDate;

    return (
        <div className="space-y-6">
            {/* Alert for Missing Dates */}
            {hasMissingDates && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-amber-100 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-amber-600 text-xl">event_busy</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-amber-800 text-sm mb-0.5">Datas não definidas</h4>
                        <p className="text-sm text-amber-700">
                            Defina a data de início e fim da viagem para gerenciar melhor suas hospedagens e check-in/out.
                        </p>
                    </div>
                    <button
                        onClick={() => { /* Should trigger edit trip modal, but for now just hint */ }}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                    >
                        Definir Datas
                    </button>
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                    {[
                        { value: 'all', label: 'Todos' },
                        { value: 'hotel', label: 'Hotéis', icon: 'hotel' },
                        { value: 'home', label: 'Casas/Apts', icon: 'home' },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => onFilterChange(item.value as 'all' | 'hotel' | 'home')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === item.value
                                ? 'bg-text-main text-white shadow-sm'
                                : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                                }`}
                        >
                            {item.icon && (
                                <span className="material-symbols-outlined text-sm">
                                    {item.icon}
                                </span>
                            )}
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
                    {/* Sort */}
                    <button
                        onClick={() =>
                            onSortOrderChange(sortOrder === 'newest' ? 'oldest' : 'newest')
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-text-muted transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-base">swap_vert</span>
                        {sortOrder === 'newest' ? 'Recentes' : 'Antigos'}
                    </button>

                    {/* View Mode */}
                    <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-1 rounded-lg transition-all ${viewMode === 'list'
                                ? 'bg-gray-100 text-primary'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">view_list</span>
                        </button>
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-1 rounded-lg transition-all ${viewMode === 'grid'
                                ? 'bg-gray-100 text-primary'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">grid_view</span>
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    <button
                        onClick={onAddAccommodation}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-text-main rounded-xl font-bold text-xs hover:bg-primary-dark transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </button>
                </div>
            </div>

            {/* Hotel Cards */}
            <div
                className={
                    viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-5'
                }
            >
                {isLoading ? (
                    [1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl shadow-soft border border-gray-100/50 p-5 flex items-center gap-4"
                        >
                            <Skeleton
                                variant="rectangular"
                                width={100}
                                height={100}
                                className="rounded-2xl"
                            />
                            <div className="flex-1 space-y-3">
                                <Skeleton width="70%" height={20} />
                                <Skeleton width="40%" height={14} />
                                <div className="pt-2 border-t border-gray-100 flex justify-between">
                                    <Skeleton width="30%" height={12} />
                                    <Skeleton width="30%" height={12} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : displayedHotels.length > 0 ? (
                    displayedHotels.map((hotel) => (
                        <div
                            key={hotel.id}
                            className="bg-white rounded-2xl shadow-soft border border-gray-100/50 overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Hotel Icon */}
                            <div className="relative w-full md:w-40 h-32 md:h-auto shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                <div className="size-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-indigo-500">
                                        {hotel.type === 'home' ? 'home' : 'hotel'}
                                    </span>
                                </div>
                                <div className="absolute top-3 left-3 px-2.5 py-1 bg-text-main/80 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                                    {hotel.nights} {hotel.nights === 1 ? 'Noite' : 'Noites'}
                                </div>
                            </div>

                            {/* Hotel Details */}
                            <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                <div className="mb-4">
                                    {/* Header with Title and Status */}
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="font-bold text-lg text-text-main leading-tight line-clamp-2">
                                            {hotel.name}
                                        </h3>
                                        <span
                                            className={`shrink-0 px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${hotel.status === 'confirmed'
                                                ? 'bg-green-100/80 text-green-700'
                                                : hotel.status === 'pending'
                                                    ? 'bg-amber-100/80 text-amber-700'
                                                    : 'bg-rose-100/80 text-rose-700'
                                                }`}
                                        >
                                            {hotel.status === 'confirmed'
                                                ? 'Confirmado'
                                                : hotel.status === 'pending'
                                                    ? 'Pendente'
                                                    : 'Cancelado'}
                                        </span>
                                    </div>

                                    {/* Stars and Rating */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        {hotel.stars ? (
                                            <div className="flex text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">
                                                {Array.from({ length: hotel.stars }).map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className="material-symbols-outlined text-[14px] fill"
                                                    >
                                                        star
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}

                                        {hotel.rating ? (
                                            <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                <span className="text-xs font-bold">{hotel.rating}</span>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    kid_star
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Address Line */}
                                    <div className="flex items-start gap-1.5 text-text-muted text-sm group cursor-pointer hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                                            location_on
                                        </span>
                                        <span className="line-clamp-2 leading-snug">
                                            {hotel.address}
                                        </span>
                                    </div>
                                </div>

                                {/* Check-in / Check-out Grid */}
                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100/50 mb-4">
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
                                            Entrada
                                        </p>
                                        <p className="font-bold text-sm text-text-main">
                                            {hotel.checkIn}
                                        </p>
                                        <p className="text-xs text-text-muted">{hotel.checkInTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
                                            Saída
                                        </p>
                                        <p className="font-bold text-sm text-text-main">
                                            {hotel.checkOut}
                                        </p>
                                        <p className="text-xs text-text-muted">{hotel.checkOutTime}</p>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                                            Reserva
                                        </p>
                                        <p
                                            className="font-mono text-xs text-text-main truncate"
                                            title={hotel.confirmation}
                                        >
                                            {hotel.confirmation}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() =>
                                                window.open(
                                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                        hotel.name
                                                    )}`,
                                                    '_blank'
                                                )
                                            }
                                            className="flex items-center justify-center size-9 rounded-xl border border-gray-200/80 text-gray-400 hover:bg-gray-50 hover:text-primary transition-colors"
                                            title="Direções"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                directions
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => onEditAccommodation(hotel)}
                                            className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wide transition-all shadow-sm active:scale-95 ${hotel.status === 'pending'
                                                ? 'bg-primary text-text-main hover:bg-primary-dark'
                                                : 'bg-white border border-gray-200 text-text-main hover:bg-gray-50'
                                                }`}
                                        >
                                            {hotel.status === 'pending' ? 'Completar' : 'Detalhes'}
                                        </button>
                                        <button
                                            onClick={() => onDeleteAccommodation(hotel.id)}
                                            className="flex items-center justify-center size-9 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 text-gray-400 hover:text-rose-500 transition-colors"
                                            title="Remover hospedagem"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                delete
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-16 border border-indigo-100/50 text-center overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-200/20 to-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="size-24 mx-auto mb-6 bg-white rounded-3xl shadow-lg flex items-center justify-center ring-4 ring-indigo-100/50">
                                <span className="material-symbols-outlined text-5xl text-indigo-500">
                                    hotel
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-text-main mb-3">
                                Nenhuma hospedagem cadastrada
                            </h3>
                            <p className="text-base text-text-muted mb-8 max-w-lg mx-auto leading-relaxed">
                                Adicione hotéis, Airbnbs ou outras acomodações. Organize suas
                                reservas, datas de check-in/out e mantenha tudo no mesmo lugar.
                            </p>
                            <button
                                onClick={onAddAccommodation}
                                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-base hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">
                                    add
                                </span>
                                Adicionar Primeira Hospedagem
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccommodationView;
