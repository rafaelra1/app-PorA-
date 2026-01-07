import React, { useState, useMemo } from 'react';
import { Trip } from '../types';
import { Card, Badge, Button } from '../components/ui/Base';
import { getFlagsForDestinations } from '../lib/countryUtils';

// Status labels in Portuguese
const STATUS_LABELS: Record<string, string> = {
  'confirmed': 'Confirmada',
  'planning': 'Planejamento',
  'completed': 'Concluída',
};

interface TravelsProps {
  trips: Trip[];
  onOpenAddModal: () => void;
  onEditTrip: (trip: Trip) => void;
  onViewTrip: (id: string) => void;
  onDeleteTrip: (id: string) => void;
}

const Travels: React.FC<TravelsProps> = ({ trips, onOpenAddModal, onEditTrip, onViewTrip, onDeleteTrip }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);


  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Apply status filter
    if (filter === 'active') {
      result = result.filter(t => t.status === 'confirmed' || t.status === 'planning');
    } else if (filter === 'completed') {
      result = result.filter(t => t.status === 'completed');
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else {
        // Sort by date - parse DD/MM/YYYY to proper Date with timezone fix
        const parseDate = (dateStr: string): number => {
          if (!dateStr) return Infinity; // Empty dates go to the end
          // Handle DD/MM/YYYY format
          if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/');
            // Use T12:00:00 to avoid timezone issues
            return new Date(`${y}-${m}-${d}T12:00:00`).getTime();
          }
          // Handle YYYY-MM-DD format
          if (dateStr.includes('-')) {
            return new Date(`${dateStr}T12:00:00`).getTime();
          }
          return Infinity;
        };
        return parseDate(a.startDate) - parseDate(b.startDate);
      }
    });

    return result;
  }, [trips, filter, searchQuery, sortBy]);

  const stats = {
    total: trips.length,
    active: trips.filter(t => t.status === 'confirmed' || t.status === 'planning').length,
    completed: trips.filter(t => t.status === 'completed').length
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main">Minhas Viagens</h2>
          <p className="text-text-muted text-sm">
            {filteredTrips.length} {filteredTrips.length === 1 ? 'viagem' : 'viagens'}
            {searchQuery && ` encontrada${filteredTrips.length !== 1 ? 's' : ''}`}
            {filter !== 'all' && ` (${filter === 'active' ? 'ativas' : 'concluídas'})`}
          </p>
        </div>
        <Button variant="primary" onClick={onOpenAddModal} className="h-10 !px-4 !py-0 !text-xs">
          <span className="material-symbols-outlined text-sm">add</span>
          Nova Viagem
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-2xl shadow-soft border border-gray-100">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-text-main text-white shadow-md' : 'bg-gray-50 text-text-muted hover:bg-gray-100'
              }`}
          >
            Tudo ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'active' ? 'bg-text-main text-white shadow-md' : 'bg-gray-50 text-text-muted hover:bg-gray-100'
              }`}
          >
            Ativas ({stats.active})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'completed' ? 'bg-text-main text-white shadow-md' : 'bg-gray-50 text-text-muted hover:bg-gray-100'
              }`}
          >
            Concluídas ({stats.completed})
          </button>
        </div>

        {/* Search, Sort, and View Mode */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar viagem..."
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-100 text-xs font-medium focus:ring-2 focus:ring-primary focus:border-primary w-48"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-100 text-xs font-bold text-text-main focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="date">Data</option>
            <option value="name">Nome</option>
            <option value="status">Status</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`size-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'
                }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`size-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'
                }`}
            >
              <span className="material-symbols-outlined text-sm">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trips Display */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
            <span className="material-symbols-outlined text-4xl">
              {searchQuery ? 'search_off' : 'luggage'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">
            {searchQuery ? 'Nenhuma viagem encontrada' : 'Nenhuma viagem ainda'}
          </h3>
          <p className="text-text-muted mb-6">
            {searchQuery
              ? `Não encontramos viagens com "${searchQuery}"`
              : 'Comece a planejar sua próxima aventura!'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2 bg-text-main text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Limpar busca
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="px-6 py-2 bg-text-main text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Adicionar primeira viagem
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 relative cursor-pointer" onClick={() => deletingTripId !== trip.id && onViewTrip(trip.id)}>
              {/* Delete Confirmation Overlay */}
              {deletingTripId === trip.id && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in">
                  <span className="material-symbols-outlined text-4xl text-white mb-3">delete_forever</span>
                  <p className="text-white font-bold text-center mb-1">Excluir viagem?</p>
                  <p className="text-white/70 text-xs text-center mb-4">Esta ação não pode ser desfeita.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingTripId(null); }}
                      className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); setDeletingTripId(null); }}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
              <div className="relative h-48 overflow-hidden">
                <img src={trip.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={trip.title} />
                <div className="absolute top-4 left-4">
                  <Badge color={trip.status === 'confirmed' ? 'bg-green-100 text-green-700' : trip.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                    {STATUS_LABELS[trip.status] || trip.status}
                  </Badge>
                </div>
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditTrip(trip); }}
                    className="size-10 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-text-main hover:bg-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingTripId(trip.id); }}
                    className="size-10 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-text-main group-hover:text-primary-dark transition-colors">{trip.title}</h3>
                <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {trip.startDate} - {trip.endDate}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {trip.participants.map((p, i) => (
                      <img key={i} src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`} className="size-7 rounded-full border-2 border-white object-cover" alt={p.name} title={p.name} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {getFlagsForDestinations(trip.destination).length > 0 ? (
                      <div className="flex -space-x-2" title={trip.destination}>
                        {getFlagsForDestinations(trip.destination).map((flagUrl, index) => (
                          <img
                            key={index}
                            src={flagUrl}
                            alt=""
                            className="size-7 rounded-full border-2 border-white object-cover shadow-sm bg-white"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{trip.destination}</span>
                    )}
                    <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Placeholder for adding new trip */}
          {filter === 'all' && !searchQuery && (
            <div
              onClick={onOpenAddModal}
              className="group rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 p-8 flex flex-col items-center justify-center text-center gap-4 transition-all cursor-pointer min-h-[300px]"
            >
              <div className="size-16 rounded-full bg-gray-50 group-hover:bg-primary/20 flex items-center justify-center text-text-muted group-hover:text-text-main transition-colors">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <div>
                <p className="font-bold text-text-main">Adicionar Destino</p>
                <p className="text-xs text-text-muted mt-1">Sua próxima história começa aqui.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-3">
          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              className="group flex flex-row items-center gap-4 p-4 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
              onClick={() => deletingTripId !== trip.id && onViewTrip(trip.id)}
            >
              {/* Delete Confirmation Overlay for List View */}
              {deletingTripId === trip.id && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-4 animate-fade-in">
                  <span className="material-symbols-outlined text-2xl text-white">delete_forever</span>
                  <p className="text-white font-bold text-sm">Excluir viagem?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingTripId(null); }}
                      className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); setDeletingTripId(null); }}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
              <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={trip.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={trip.title} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-text-main group-hover:text-primary-dark transition-colors truncate">{trip.title}</h3>
                    <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {trip.destination}
                    </p>
                  </div>
                  <Badge color={trip.status === 'confirmed' ? 'bg-green-100 text-green-700' : trip.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                    {STATUS_LABELS[trip.status] || trip.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {trip.startDate} - {trip.endDate}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {trip.participants.slice(0, 3).map((p, i) => (
                        <img key={i} src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`} className="size-6 rounded-full border-2 border-white object-cover" alt={p.name} title={p.name} />
                      ))}
                      {trip.participants.length > 3 && (
                        <div className="size-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-muted">
                          +{trip.participants.length - 3}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onEditTrip(trip); }}
                      className="size-8 rounded-lg bg-gray-50 hover:bg-primary flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingTripId(trip.id); }}
                      className="size-8 rounded-lg bg-gray-50 hover:bg-red-500 flex items-center justify-center text-red-400 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Travels;
