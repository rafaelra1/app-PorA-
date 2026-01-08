import React, { useState } from 'react';
import { CalendarEventType, Trip } from '../../types';
import { useCalendar } from '../../contexts/CalendarContext';

interface FilterPanelProps {
  trips: Trip[];
  isOpen: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ trips, isOpen, onClose }) => {
  const { filters, setFilters, events } = useCalendar();
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');

  const eventTypes: { value: CalendarEventType | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'Todos', icon: 'filter_list' },
    { value: 'trip', label: 'Viagens', icon: 'luggage' },
    { value: 'flight', label: 'Voos', icon: 'flight' },
    { value: 'train', label: 'Trens', icon: 'train' },
    { value: 'bus', label: 'Ônibus', icon: 'directions_bus' },
    { value: 'accommodation', label: 'Hospedagem', icon: 'hotel' },
    { value: 'meal', label: 'Refeições', icon: 'restaurant' },
    { value: 'sightseeing', label: 'Passeios', icon: 'tour' },
    { value: 'culture', label: 'Cultura', icon: 'museum' },
    { value: 'nature', label: 'Natureza', icon: 'nature' },
    { value: 'shopping', label: 'Compras', icon: 'shopping_bag' },
    { value: 'task', label: 'Tarefas', icon: 'task' },
  ];

  const handleApplyFilters = () => {
    setFilters({ searchQuery: searchQuery.trim() });
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      tripId: 'all',
      searchQuery: '',
    });
    setSearchQuery('');
  };

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.type !== 'all',
    filters.tripId !== 'all',
    filters.searchQuery,
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark">
              <span className="material-symbols-outlined">filter_list</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">Filtros Avançados</h2>
              <p className="text-sm text-text-muted">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} ativo${activeFiltersCount > 1 ? 's' : ''}`
                  : 'Refine sua busca'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-background-light flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Buscar Eventos
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, descrição ou local..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main placeholder-text-muted"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-text-muted mt-2">
                {events.filter(e =>
                  e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  e.location?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length} evento(s) encontrado(s)
              </p>
            )}
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-3">
              Tipo de Evento
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilters({ type: type.value })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    filters.type === type.value
                      ? 'border-primary bg-primary-light text-primary-dark'
                      : 'border-gray-200 hover:border-gray-300 text-text-muted hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {type.icon}
                  </span>
                  <span className="text-xs font-bold">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trip Filter */}
          {trips.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-text-main mb-3">
                Viagem
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({ tripId: 'all' })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    filters.tripId === 'all'
                      ? 'border-primary bg-primary-light text-primary-dark'
                      : 'border-gray-200 hover:border-gray-300 text-text-muted hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">select_all</span>
                  <span className="text-sm font-bold">Todas as Viagens</span>
                </button>

                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => setFilters({ tripId: trip.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      filters.tripId === trip.id
                        ? 'border-primary bg-primary-light text-primary-dark'
                        : 'border-gray-200 hover:border-gray-300 text-text-muted hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${trip.coverImage})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {trip.title || trip.destination}
                      </p>
                      <p className="text-xs text-text-muted">
                        {trip.startDate} - {trip.endDate}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-3">
              Status da Viagem
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'Todas', color: 'gray' },
                { value: 'confirmed', label: 'Confirmadas', color: 'green' },
                { value: 'planning', label: 'Planejando', color: 'blue' },
                { value: 'completed', label: 'Concluídas', color: 'indigo' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilters({ status: status.value as any })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    filters.status === status.value
                      ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-700`
                      : 'border-gray-200 hover:border-gray-300 text-text-muted hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-bold">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-background-light rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-dark">info</span>
              <div>
                <p className="text-sm font-bold text-text-main mb-1">
                  Resumo dos Filtros
                </p>
                <div className="space-y-1 text-xs text-text-muted">
                  <p>• Tipo: {eventTypes.find(t => t.value === filters.type)?.label || 'Todos'}</p>
                  <p>• Status: {filters.status === 'all' ? 'Todas' : filters.status === 'confirmed' ? 'Confirmadas' : filters.status === 'planning' ? 'Planejando' : 'Concluídas'}</p>
                  {filters.tripId && filters.tripId !== 'all' && (
                    <p>• Viagem: {trips.find(t => t.id === filters.tripId)?.title || 'Selecionada'}</p>
                  )}
                  {searchQuery && <p>• Busca: "{searchQuery}"</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-text-main font-bold hover:bg-background-light transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">clear_all</span>
            Limpar Filtros
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">check</span>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
