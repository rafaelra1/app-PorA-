import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Trip, CalendarEvent } from '../types';
import { Card, PageContainer, PageHeader, FilterBar, FilterButton, Button } from '../components/ui/Base';
import { BRAZILIAN_HOLIDAYS } from '../constants';
import { useCalendar } from '../contexts/CalendarContext';
import { useCalendarNotifications, useNotificationPermission } from '../hooks/useCalendarNotifications';
import AddEventModal from '../components/AddEventModal';
import WeekView from '../components/calendar/WeekView';
import FilterPanel from '../components/calendar/FilterPanel';
import ExportModal from '../components/calendar/ExportModal';
import EventDetailsModal from '../components/calendar/EventDetailsModal';
import HolidayBadge from '../components/calendar/HolidayBadge';

interface CalendarViewProps {
  trips: Trip[];
  onViewTrip: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ trips, onViewTrip }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    getEventsForDate,
    syncFromTrips,
    syncFromActivities,
    syncFromTransports,
    syncActivitiesFromSupabase,
    syncAccommodationsFromSupabase,
    syncTransportsFromSupabase,
    events
  } = useCalendar();

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<string>('');
  const [selectedTimeForEvent, setSelectedTimeForEvent] = useState<string>('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  // Enable calendar notifications
  useCalendarNotifications(events);
  useNotificationPermission();

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Sync trips to calendar events on mount and when trips change
  useEffect(() => {
    // First sync basic trip events (start/end)
    syncFromTrips(trips);

    // Then load activities from Supabase and transports from local storage
    const loadItineraryData = async () => {
      for (const trip of trips) {
        try {
          // Load itinerary activities from Supabase (new source of truth)
          await syncActivitiesFromSupabase(trip.id);

          // Load accommodations from Supabase
          await syncAccommodationsFromSupabase(trip.id);

          // Load transports from Supabase (new source of truth)
          await syncTransportsFromSupabase(trip.id);
        } catch (e) {
          console.error(`Error syncing data for trip ${trip.id} to calendar`, e);
        }
      }
    };

    loadItineraryData();
  }, [trips, syncActivitiesFromSupabase, syncAccommodationsFromSupabase, syncTransportsFromSupabase]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDateForEvent(formatDateToDDMMYYYY(date));
    setSelectedTimeForEvent('');
    setIsAddEventModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date, time?: string) => {
    setSelectedDateForEvent(formatDateToDDMMYYYY(date));
    setSelectedTimeForEvent(time || '');
    setIsAddEventModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Open event details modal
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Filter trips based on status filter
  const filteredTrips = trips.filter(trip =>
    filters.status === 'all' || trip.status === filters.status
  );

  return (
    <PageContainer>
      {/* Header with Actions */}
      <PageHeader
        title="Agenda PorAí"
        description="Organize suas jornadas no tempo de Brasília."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setSelectedDateForEvent('');
              setSelectedTimeForEvent('');
              setIsAddEventModalOpen(true);
            }}
            className="h-10 px-5 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-sm mr-1">add</span>
            Novo Evento
          </Button>
        }
      />

      {/* Controls Bar */}
      <FilterBar
        rightContent={
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'year' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Ano
            </button>
          </div>
        }
      >
        <Button
          variant="outline"
          onClick={() => setIsFilterPanelOpen(true)}
          className="h-9 px-3 text-xs border-gray-200"
        >
          <span className="material-symbols-outlined text-sm mr-1">filter_list</span>
          Filtros
          {((filters.type && filters.type !== 'all') ||
            (filters.status && filters.status !== 'all') ||
            (filters.tripId && filters.tripId !== 'all') ||
            filters.searchQuery) && (
              <span className="size-2 rounded-full bg-primary animate-pulse ml-2" />
            )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setIsExportModalOpen(true)}
          className="h-9 px-3 text-xs border-gray-200"
        >
          <span className="material-symbols-outlined text-sm mr-1">file_download</span>
          Exportar
        </Button>
      </FilterBar>

      {/* Navigation */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-soft border border-gray-100">
          <button
            onClick={viewMode === 'week' ? prevWeek : prevMonth}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="font-bold text-text-main min-w-[120px] text-center">
            {viewMode === 'week'
              ? `Semana de ${formatDateToDDMMYYYY(currentDate)}`
              : `${months[month]} ${year}`
            }
          </span>
          <button
            onClick={viewMode === 'week' ? nextWeek : nextMonth}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <Button
          variant="outline"
          onClick={goToToday}
          className="h-10 px-4 text-xs font-bold"
        >
          <span className="material-symbols-outlined text-sm mr-1">today</span>
          Hoje
        </Button>
      </div>

      {/* Calendar Content */}
      {viewMode === 'week' ? (
        <WeekView
          currentDate={currentDate}
          onDateClick={handleTimeSlotClick}
          onEventClick={handleEventClick}
        />
      ) : viewMode === 'month' ? (
        <Card className="p-6 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {daysOfWeek.map(d => (
              <div key={d} className="bg-white p-4 text-center text-[10px] font-extrabold text-text-muted uppercase tracking-widest border-b border-gray-50">
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              const dayEvents = day ? getEventsForDate(day) : [];

              // Check for holiday
              const holiday = day ? BRAZILIAN_HOLIDAYS.find(h => {
                const [hY, hM, hD] = h.date.split('-').map(Number);
                return hD === day.getDate() && hM === (day.getMonth() + 1) && hY === day.getFullYear();
              }) : null;

              return (
                <div
                  key={idx}
                  onClick={() => day && handleDayClick(day)}
                  className={`min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50/50 cursor-pointer ${!day
                    ? 'bg-gray-50/30'
                    : holiday
                      ? holiday.type === 'nacional'
                        ? 'bg-emerald-50/70'
                        : 'bg-amber-50/70'
                      : 'bg-white'
                    }`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold p-1 rounded-md w-fit ${day.getDate() === new Date().getDate() &&
                          day.getMonth() === new Date().getMonth() &&
                          day.getFullYear() === new Date().getFullYear()
                          ? 'bg-text-main text-white' : 'text-text-muted'
                          }`}>
                          {day.getDate()}
                        </span>
                      </div>

                      {/* Holiday Badge */}
                      {holiday && (
                        <HolidayBadge holiday={holiday} size="md" showName />
                      )}

                      <div className="flex flex-col gap-1 mt-1">
                        {/* Show trips */}
                        {filteredTrips.map(trip => {
                          if (day && isDateInRange(day, trip.startDate, trip.endDate)) {
                            const isStart = parseDate(trip.startDate).getDate() === day.getDate() && parseDate(trip.startDate).getMonth() === day.getMonth();
                            return (
                              <div
                                key={trip.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewTrip(trip.id);
                                }}
                                className={`px-2 py-1 rounded-[6px] text-[10px] font-bold cursor-pointer transition-all truncate hover:brightness-95 active:scale-95 ${trip.status === 'confirmed' ? 'bg-green-100 text-green-700' : trip.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {isStart && <span className="material-symbols-outlined text-[10px] mr-1 align-middle">flight_takeoff</span>}
                                {trip.title}
                              </div>
                            );
                          }
                          return null;
                        })}

                        {/* Show calendar events (max 3) */}
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className="px-2 py-1 rounded-[6px] text-[10px] font-bold cursor-pointer transition-all truncate hover:brightness-95 bg-primary-light text-primary-dark"
                          >
                            {event.startTime && `${event.startTime} `}
                            {event.title}
                          </div>
                        ))}

                        {/* Show +N more if there are more events */}
                        {dayEvents.length > 3 && (
                          <div className="px-2 py-1 text-[10px] font-bold text-text-muted">
                            +{dayEvents.length - 3} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        // Year view placeholder
        <Card className="p-6">
          <div className="text-center text-text-muted py-12">
            <span className="material-symbols-outlined text-6xl mb-4 block">calendar_month</span>
            <p className="font-bold">Visualização de ano em desenvolvimento</p>
          </div>
        </Card>
      )}

      {/* Statistics and Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-primary hover:shadow-lg transition-all cursor-pointer" onClick={() => setFilters({ status: 'all' })}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary-dark">
                <span className="material-symbols-outlined">luggage</span>
              </div>
              <h4 className="font-bold text-text-main">Total de Viagens</h4>
            </div>
            <span className="text-2xl font-extrabold text-primary-dark">{trips.length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {filters.status !== 'all' && <span className="text-primary font-bold">Clique para ver todas • </span>}
            Gerencie todas as suas aventuras em um só lugar.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-green-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setFilters({ status: 'confirmed' })}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined">done_all</span>
              </div>
              <h4 className="font-bold text-text-main">Confirmadas</h4>
            </div>
            <span className="text-2xl font-extrabold text-green-600">{trips.filter(t => t.status === 'confirmed').length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {filters.status === 'confirmed' && <span className="text-green-600 font-bold">Filtro ativo • </span>}
            Viagens com reservas validadas.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-blue-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setFilters({ status: 'planning' })}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">edit_calendar</span>
              </div>
              <h4 className="font-bold text-text-main">Planejando</h4>
            </div>
            <span className="text-2xl font-extrabold text-blue-600">{trips.filter(t => t.status === 'planning').length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {filters.status === 'planning' && <span className="text-blue-600 font-bold">Filtro ativo • </span>}
            Viagens em fase de planejamento.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-indigo-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setFilters({ status: 'completed' })}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h4 className="font-bold text-text-main">Concluídas</h4>
            </div>
            <span className="text-2xl font-extrabold text-indigo-600">{trips.filter(t => t.status === 'completed').length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {filters.status === 'completed' && <span className="text-indigo-600 font-bold">Filtro ativo • </span>}
            Memórias de viagens realizadas.
          </p>
        </Card>
      </div>



      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        initialDate={selectedDateForEvent}
        initialTime={selectedTimeForEvent}
        trips={trips}
      />

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        trips={trips}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        events={events}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isEventDetailsOpen}
        onClose={() => {
          setIsEventDetailsOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        trip={selectedEvent?.tripId ? trips.find(t => t.id === selectedEvent.tripId) : undefined}
        onViewTrip={onViewTrip}
        onEdit={() => {
          setIsEventDetailsOpen(false);
          // TODO: Open edit modal with selected event
        }}
      />
    </PageContainer>
  );
};

export default CalendarView;
