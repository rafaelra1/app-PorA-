import React, { useState, useEffect } from 'react';
import { Trip, Transport, TransportType } from '../../../types';
import { useTransport } from '../../../contexts/TransportContext'; // To be connected
import TransportCard from './TransportCard';
import { useLocalStorage } from '../../../hooks/useLocalStorage'; // Start with local storage for migration check

interface TransportViewProps {
    trip: Trip;
    onAddClick: () => void;
    onEditClick: (transport: Transport) => void;
    // We pass these handlers, but inside we will likely use Context
}

const TransportView: React.FC<TransportViewProps> = ({ trip, onAddClick, onEditClick }) => {
    const {
        transports,
        fetchTransports,
        deleteTransport,
        migrateFromLocalStorage
    } = useTransport();

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

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este transporte?')) {
            await deleteTransport(trip.id, id);
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
            const time = timeStr || '00:00';
            return new Date(`${date}T${time}`).getTime();
        };

        const diff = getDate(a.departureDate, a.departureTime) - getDate(b.departureDate, b.departureTime);
        console.log(diff);
        return sortOrder === 'date_asc' ? diff : -diff;
    });

    if (sortOrder === 'newest') {
        // If IDs are chronological or handled via created_at, reverse might work if fetch order is preserved
        displayedTransports.reverse();
    }


    return (
        <div className="space-y-6">
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
                {displayedTransports.length > 0 ? displayedTransports.map((transport) => (
                    <TransportCard
                        key={transport.id}
                        transport={transport}
                        onEdit={onEditClick}
                        onDelete={handleDelete}
                    />
                )) : (
                    <div className="bg-white rounded-2xl p-12 shadow-soft border border-gray-100/50 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">flight</span>
                        <p className="text-text-muted font-bold">Nenhum transporte adicionado ainda</p>
                        <p className="text-sm text-text-muted mt-1">Adicione seus voos, trens e deslocamentos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransportView;
