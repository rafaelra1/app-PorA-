import * as React from 'react';
import { useState, useEffect } from 'react';
import { Trip, Transport, TransportType, City } from '../../../types';
import { useTransport } from '../../../contexts/TransportContext'; // To be connected
import TransportCard from './TransportCard';
import { useLocalStorage } from '../../../hooks/useLocalStorage'; // Start with local storage for migration check
import { Skeleton } from '../../ui/Base';

interface TransportViewProps {
    trip: Trip;
    cities?: City[]; // Made optional to avoid immediate break, but intended to be passed
    onAddClick?: () => void;
    onEditClick?: (transport: Transport) => void;
    onDeleteClick?: (id: string) => void;
    isLoading?: boolean;
}

const TransportView: React.FC<TransportViewProps> = ({
    trip,
    cities = [],
    onAddClick,
    onEditClick,
    onDeleteClick,
    isLoading
}) => {
    // ... hooks ...
    const {
        transports,
        fetchTransports,
        deleteTransport,
        migrateFromLocalStorage,
        isLoading: contextLoading
    } = useTransport();

    const isActualLoading = isLoading !== undefined ? isLoading : contextLoading;

    // Filters & Sorting
    const [transportFilter, setTransportFilter] = useState<TransportType | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'date_asc' | 'oldest'>('date_asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Local Storage Migration Check
    const [localTransports, setLocalTransports] = useLocalStorage<Transport[]>(`porai_trip_${trip.id}_transports`, []);

    useEffect(() => {
        if (trip.id) {
            fetchTransports(trip.id);

            // Check for migration
            if (localTransports.length > 0) {
                console.log('Migrating transports...');
                migrateFromLocalStorage(trip.id, localTransports).then(() => {
                    setLocalTransports([]); // Clear local
                });
            }
        }
    }, [trip.id]);

    const handleDelete = (id: string) => {
        if (onDeleteClick) {
            onDeleteClick(id);
        } else if (window.confirm('Tem certeza que deseja excluir este transporte?')) {
            deleteTransport(trip.id, id);
        }
    };

    // Filter Logic
    let displayedTransports = transportFilter === 'all'
        ? transports
        : transports.filter(t => t.type === transportFilter);

    // Sort Logic
    displayedTransports = [...displayedTransports].sort((a, b) => {
        if (sortOrder === 'newest') return 0; // Natural order (usually newest if appended) or we can implement created_at

        const getDate = (dateStr: string, timeStr: string) => {
            if (!dateStr) return 0;
            // Normalize date standard YYYY-MM-DD
            let date = dateStr;
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/');
                date = `${y}-${m}-${d}`;
            }
            const time = timeStr?.slice(0, 5) || '00:00';
            return new Date(`${date}T${time}`).getTime();
        };

        const diff = getDate(a.departureDate, a.departureTime) - getDate(b.departureDate, b.departureTime);

        return sortOrder === 'date_asc' ? diff : -diff;
    });

    if (sortOrder === 'newest') {
        // If IDs are chronological or handled via created_at, reverse might work if fetch order is preserved
        displayedTransports.reverse();
    }

    // Logic for alerts
    const hasMissingDates = !trip.startDate || !trip.endDate;
    const hasMissingTransports = cities.length > 1 && transports.length === 0;

    return (
        <div className="space-y-6">
            {/* Alerts Section */}
            {(hasMissingDates || hasMissingTransports) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-amber-100 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-amber-600 text-xl">warning</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-amber-800 text-sm mb-1">Atenção ao Planejamento</h4>
                        <div className="text-sm text-amber-700 space-y-1">
                            {hasMissingDates && (
                                <p>• As datas da viagem ainda não foram definidas. Defina o período para organizar melhor seus deslocamentos.</p>
                            )}
                            {hasMissingTransports && (
                                <p>• Você adicionou cidades ao roteiro mas ainda não definiu como ir de uma para outra. Adicione os transportes entre elas.</p>
                            )}
                        </div>
                    </div>
                    {!hasMissingDates && (
                        <button
                            onClick={onAddClick}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                            Resolver
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-4">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                        {[
                            { value: 'all', label: 'Todos' },
                            { value: 'flight', label: 'Voos', icon: 'flight' },
                            { value: 'train', label: 'Trens', icon: 'train' },
                            { value: 'car', label: 'Carros', icon: 'directions_car' },
                            { value: 'transfer', label: 'Transfers', icon: 'local_taxi' },
                            { value: 'bus', label: 'Ônibus', icon: 'directions_bus' },
                            { value: 'ferry', label: 'Balsa', icon: 'directions_boat' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setTransportFilter(filter.value as TransportType | 'all')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${transportFilter === filter.value
                                    ? 'bg-text-main text-white shadow-sm'
                                    : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                                    }`}
                            >
                                {filter.icon && <span className="material-symbols-outlined text-sm">{filter.icon}</span>}
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
                        {/* Sort */}
                        <button
                            onClick={() => setSortOrder(prev => {
                                if (prev === 'newest') return 'date_asc';
                                if (prev === 'date_asc') return 'oldest';
                                return 'newest';
                            })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-text-muted transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-base">swap_vert</span>
                            {sortOrder === 'newest' ? 'Recentes' : sortOrder === 'date_asc' ? 'Cronológico' : 'Antigos'}
                        </button>

                        {/* View Mode */}
                        <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-lg">view_list</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-lg">grid_view</span>
                            </button>
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                        <button
                            onClick={onAddClick}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-text-main rounded-xl font-bold text-xs hover:bg-primary-dark transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>

            {/* Transport Cards */}
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                {isActualLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl shadow-soft border border-gray-100/50 p-5 flex items-center gap-4">
                            <Skeleton variant="rectangular" width={64} height={64} className="rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton width="60%" height={18} />
                                <Skeleton width="40%" height={14} />
                            </div>
                        </div>
                    ))
                ) : displayedTransports.length > 0 ? displayedTransports.map((transport) => (
                    <TransportCard
                        key={transport.id}
                        transport={transport}
                        onEdit={onEditClick}
                        onDelete={handleDelete}
                    />
                )) : (
                    <div className="relative bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-3xl p-16 border border-blue-100/50 text-center overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="size-24 mx-auto mb-6 bg-white rounded-3xl shadow-lg flex items-center justify-center ring-4 ring-blue-100/50">
                                <span className="material-symbols-outlined text-5xl text-blue-500">flight</span>
                            </div>
                            <h3 className="text-2xl font-bold text-text-main mb-3">Nenhum transporte cadastrado</h3>
                            <p className="text-base text-text-muted mb-8 max-w-lg mx-auto leading-relaxed">
                                Adicione voos, trens, transfers e outros meios de transporte. Mantenha todos os seus deslocamentos organizados em um só lugar.
                            </p>
                            <button
                                onClick={onAddClick}
                                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-bold text-base hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">add</span>
                                Adicionar Primeiro Transporte
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransportView;
