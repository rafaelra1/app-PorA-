import React, { useState, useMemo } from 'react';
import { City } from '../../../types';
import { Card } from '../../ui/Base';

interface CitiesViewProps {
    cities: City[];
    onCityClick: (city: City) => void;
    onAddCity: () => void;
    onEditCity?: (city: City) => void;
    onDeleteCity?: (city: City) => void;
    onReorder?: (cities: City[]) => void;
}

const CitiesView: React.FC<CitiesViewProps> = ({ cities, onCityClick, onAddCity, onEditCity, onDeleteCity, onReorder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'date' | 'name' | 'nights'>('date');
    const [filter, setFilter] = useState<'all' | 'past' | 'future'>('all');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Filter and Sort cities
    const filteredCities = useMemo(() => {
        let result = [...cities];

        // Apply Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(city =>
                city.name.toLowerCase().includes(query) ||
                city.country.toLowerCase().includes(query)
            );
        }

        // Apply Filter (Past/Future) - Simplistic logic based on departureDate
        const today = new Date().toISOString().split('T')[0];
        if (filter === 'past') {
            result = result.filter(city => city.departureDate < today);
        } else if (filter === 'future') {
            result = result.filter(city => city.departureDate >= today);
        }

        // Apply Sort
        result.sort((a, b) => {
            if (sortOrder === 'name') return a.name.localeCompare(b.name);
            if (sortOrder === 'nights') return b.nights - a.nights;
            // Default: Date
            return a.arrivalDate.localeCompare(b.arrivalDate);
        });

        return result;
    }, [cities, searchQuery, filter, sortOrder]);

    const totalNights = cities.reduce((sum, city) => sum + city.nights, 0);

    // Reorder function
    const moveCity = (cityId: string, direction: 'up' | 'down') => {
        if (!onReorder) return;
        const index = cities.findIndex(c => c.id === cityId);
        if (index === -1) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= cities.length) return;

        const reordered = [...cities];
        [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
        onReorder(reordered);
    };

    // Only allow reorder when viewing by date without filters
    const canReorder = onReorder && !searchQuery && filter === 'all' && sortOrder === 'date';

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header and Stats */}
            <div className="space-y-6">
                {/* Title removed per user request */}

                {/* Stat Cards removed per user request */}

                {/* Unified Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                        {[
                            { value: 'all', label: 'Todas' },
                            { value: 'future', label: 'Futuras' },
                            { value: 'past', label: 'Visitadas' },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === f.value
                                    ? 'bg-text-main text-white shadow-sm'
                                    : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1 flex-wrap">
                        {/* Search */}
                        <div className="relative w-full md:w-48 order-first md:order-none mb-2 md:mb-0">
                            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar cidade..."
                                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
                            />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as any)}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-text-muted focus:ring-2 focus:ring-indigo-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <option value="date">Data</option>
                                <option value="name">Nome</option>
                                <option value="nights">Noites</option>
                            </select>
                            <span className="material-symbols-outlined text-sm absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">sort</span>
                        </div>

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

                        <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

                        <button
                            onClick={onAddCity}
                            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-text-main rounded-xl font-bold text-xs hover:bg-primary-dark transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>

            {/* Cities List/Grid */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCities.map((city, index) => (
                        <div key={city.id} className="bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100 group flex flex-col h-full hover:translate-y-[-4px] transition-all duration-300">
                            {/* City Image */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <img
                                    src={city.image}
                                    alt={city.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                {/* Action Buttons */}
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    {/* Reorder Buttons */}
                                    {canReorder && (
                                        <div className="flex gap-0.5 bg-black/20 backdrop-blur-md rounded-full px-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveCity(city.id, 'up'); }}
                                                disabled={index === 0}
                                                className="size-6 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 rounded-full transition-colors"
                                                title="Mover para cima"
                                            >
                                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveCity(city.id, 'down'); }}
                                                disabled={index === filteredCities.length - 1}
                                                className="size-6 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 rounded-full transition-colors"
                                                title="Mover para baixo"
                                            >
                                                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* More Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === city.id ? null : city.id);
                                            }}
                                            className="size-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">more_vert</span>
                                        </button>

                                        {openMenuId === city.id && (
                                            <div
                                                className="absolute top-10 right-0 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {onEditCity && (
                                                    <button
                                                        onClick={() => { onEditCity(city); setOpenMenuId(null); }}
                                                        className="w-full px-4 py-2 text-left text-sm font-medium text-text-main hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-base text-blue-500">edit</span>
                                                        Editar
                                                    </button>
                                                )}
                                                {onDeleteCity && (
                                                    <button
                                                        onClick={() => { onDeleteCity(city); setOpenMenuId(null); }}
                                                        className="w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                        Excluir
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-4 left-4 text-white">
                                    {index === 0 && (
                                        <span className="inline-block px-2 py-0.5 bg-[#00D287] text-white text-[10px] font-bold rounded mb-1">INÍCIO</span>
                                    )}
                                    <h3 className="text-2xl font-black">{city.name}</h3>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-sm text-text-muted mb-4 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">calendar_today</span>
                                        <span className="font-medium text-xs">
                                            {new Date(city.arrivalDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(city.departureDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">bed</span>
                                        <span className="font-medium text-xs">{city.nights} Noites</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-text-muted font-bold text-xs">
                                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                            Atrações
                                        </span>
                                        <span className="font-bold text-text-main">{city.attractionsCount || 0} Planejadas</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-text-muted font-bold text-xs">
                                            <span className="size-1.5 rounded-full bg-blue-500"></span>
                                            Restaurantes
                                        </span>
                                        <span className="font-bold text-text-main">{city.restaurantsCount || 0} Salvos</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onCityClick(city)}
                                    className="w-full mt-auto py-3 bg-gray-50 hover:bg-gray-100 text-text-main font-bold rounded-xl text-sm transition-colors border border-gray-100 shadow-sm"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Add City Card Placeholder */}
                    <button
                        onClick={onAddCity}
                        className="rounded-2xl border-2 border-dashed border-gray-200 min-h-[400px] flex flex-col items-center justify-center text-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                            <span className="material-symbols-outlined text-3xl">add</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">Adicionar Nova Cidade</p>
                            <p className="text-xs text-text-muted max-w-[200px] mx-auto mt-1">Planeje sua próxima parada, pesquise hotéis e mais.</p>
                        </div>
                    </button>
                </div>
            ) : (
                /* List View */
                <div className="flex flex-col gap-3">
                    {filteredCities.map((city, index) => (
                        <div key={city.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="relative size-20 md:size-24 rounded-xl overflow-hidden shrink-0">
                                <img src={city.image} alt={city.name} className="w-full h-full object-cover" />
                                {index === 0 && (
                                    <div className="absolute top-0 left-0 right-0 bg-[#00D287] text-white text-[8px] font-bold text-center py-0.5">INÍCIO</div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-lg font-black text-text-main">{city.name}</h3>
                                <p className="text-sm text-text-muted">{city.country}</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-gray-50 px-2 py-1 rounded-lg">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        {new Date(city.arrivalDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(city.departureDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-gray-50 px-2 py-1 rounded-lg">
                                        <span className="material-symbols-outlined text-sm">bed</span>
                                        {city.nights} Noites
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-8 px-4 border-l border-r border-gray-100 hidden md:flex">
                                <div className="text-center">
                                    <p className="text-xs text-text-muted uppercase font-bold">Atrações</p>
                                    <p className="text-lg font-bold text-text-main">{city.attractionsCount || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-text-muted uppercase font-bold">Restaurantes</p>
                                    <p className="text-lg font-bold text-text-main">{city.restaurantsCount || 0}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => onCityClick(city)}
                                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-text-main font-bold rounded-xl text-sm transition-colors border border-gray-100 whitespace-nowrap"
                            >
                                Ver Detalhes
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={onAddCity}
                        className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col md:flex-row items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all group py-8"
                    >
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">add</span>
                        </div>
                        <span className="font-bold text-text-muted group-hover:text-primary transition-colors">Adicionar Nova Cidade</span>
                    </button>
                </div>
            )}


        </div>
    );
};

export default CitiesView;
