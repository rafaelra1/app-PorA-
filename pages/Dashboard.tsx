import * as React from 'react';
import { PageContainer, PageHeader, Card } from '../components/ui/Base';
import { useRef, useState, useEffect, useMemo } from 'react';
import DayAgenda from '../components/dashboard/DayAgenda';
import CheckInWidget from '../components/dashboard/CheckInWidget';
import ImagineTripsWidget from '../components/dashboard/ImagineTripsWidget';
import TripCarousel from '../components/dashboard/TripCarousel';
import { Trip, ItineraryActivity, Transport, HotelReservation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { useNotifications } from '../contexts/NotificationContext';
import { BRAZILIAN_HOLIDAYS } from '../constants';
import { fromISODate } from '../lib/dateUtils';

interface DashboardProps {
  onOpenAddModal: () => void;
  onViewTrip: (id: string) => void;
  onEditTrip?: (id: string) => void;
  onDeleteTrip?: (id: string) => void;
  trips: Trip[];
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenAddModal, onViewTrip, onEditTrip, onDeleteTrip, trips, onNavigate }) => {
  const { user } = useAuth();
  const { syncFromTrips, syncActivitiesFromSupabase, syncTransportsFromSupabase, syncAccommodationsFromSupabase, getEventsForDate } = useCalendar();
  const { unreadCount } = useNotifications();
  const nextTrip = trips.find(t => t.status === 'confirmed') || trips[0];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'planning' | 'completed'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Removed local state - now using CalendarContext
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [hoveredHolidayDay, setHoveredHolidayDay] = useState<number | null>(null);

  // Sync all trip data with CalendarContext
  useEffect(() => {
    const syncAllData = async () => {
      // Sync trips with calendar (creates trip start/end events)
      syncFromTrips(trips);

      // Sync all data from Supabase to CalendarContext
      for (const trip of trips) {
        try {
          await syncActivitiesFromSupabase(trip.id);
          await syncTransportsFromSupabase(trip.id);
          await syncAccommodationsFromSupabase(trip.id);
        } catch (e) {
          console.error(`Error syncing data for trip ${trip.id}:`, e);
        }
      }
    };

    syncAllData();
  }, [trips, syncFromTrips, syncActivitiesFromSupabase, syncTransportsFromSupabase, syncAccommodationsFromSupabase]);

  // Stats calculations - memoized for performance
  const totalTrips = trips.length;

  const countriesVisited = useMemo(() =>
    new Set(trips.map(t => t.destination?.split(',')[1]?.trim() || t.destination)).size,
    [trips]
  );

  const citiesVisited = useMemo(() =>
    new Set(trips.map(t => t.destination?.split(',')[0]?.trim())).size,
    [trips]
  );

  const totalDays = useMemo(() =>
    trips.reduce((acc, t) => {
      if (!t.startDate || !t.endDate) return acc;
      const start = new Date(t.startDate.split('/').reverse().join('-'));
      const end = new Date(t.endDate.split('/').reverse().join('-'));
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return acc + (isNaN(days) ? 0 : days);
    }, 0),
    [trips]
  );

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 260;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  // Calendar helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const today = new Date();

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // Calculate countdown to next trip
  const getCountdown = () => {
    if (!nextTrip) return { days: 0, hours: 0 };
    const startParts = nextTrip.startDate.split('/');
    const tripDate = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
    const diff = tripDate.getTime() - new Date().getTime();
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
    };
  };

  const countdown = useMemo(() => getCountdown(), [nextTrip]);

  // Map CalendarEvent to DayAgenda event format
  const mapCalendarEventToDayEvent = (calEvent: any) => {
    // Derive holidayType from description for holidays added by syncHolidays
    let holidayType: 'nacional' | 'facultativo' | undefined;
    if (calEvent.type === 'holiday') {
      if (calEvent.description?.toLowerCase().includes('nacional')) {
        holidayType = 'nacional';
      } else {
        holidayType = 'facultativo';
      }
    }

    // Format time to HH:MM (remove seconds if present)
    const formatTime = (time: string | undefined, fallback: string): string => {
      if (!time) return fallback;
      // If time is HH:MM:SS, slice to HH:MM
      return time.length >= 5 ? time.slice(0, 5) : time;
    };

    return {
      id: calEvent.id,
      title: calEvent.title,
      subtitle: calEvent.description || calEvent.location,
      startTime: formatTime(calEvent.startTime, '00:00'),
      endTime: formatTime(calEvent.endTime, '23:59'),
      type: calEvent.type as any,
      location: calEvent.location,
      status: 'on_time' as const,
      route: calEvent.locationDetail?.includes('→') ? { from: calEvent.locationDetail.split('→')[0].trim(), to: calEvent.locationDetail.split('→')[1].trim() } : undefined,
      holidayType: holidayType,
    };
  };

  // Get events from CalendarContext and map to DayAgenda format
  // 1. Filter out 'trip' type events (phantom Embarque/Retorno cards)
  // 2. Deduplicate by a composite key (title + startDate + startTime for identical visual entries)
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];

    const rawEvents = getEventsForDate(selectedDate);

    // Filter: remove 'trip' type events (they render as grey/slate and are unwanted)
    const filteredEvents = rawEvents.filter(e => e.type !== 'trip');

    // Deduplicate: Use title + date + time as key to catch visually identical entries
    const seen = new Map<string, any>();
    filteredEvents.forEach(e => {
      // Create a composite key that identifies visually identical events
      const key = `${e.title}|${e.startDate}|${e.startTime}`;
      if (!seen.has(key)) {
        seen.set(key, e);
      }
    });

    return Array.from(seen.values())
      .map(mapCalendarEventToDayEvent)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, getEventsForDate]);

  return (
    <PageContainer>
      {/* ========== HEADER ========== */}
      <PageHeader
        title={`Bem-vindo(a) de volta, ${user?.name?.split(' ')[0] || 'Viajante'}! 👋`}
        description="Planeje sua próxima aventura."
        actions={
          <div className="flex items-center gap-6 md:gap-8">
            <div className="hidden md:block text-center">
              <span className="block text-2xl md:text-3xl font-bold text-text-main">{totalTrips}</span>
              <span className="text-xs text-text-muted">Viagens</span>
            </div>
            <div className="hidden md:block text-center">
              <span className="block text-2xl md:text-3xl font-bold text-text-main">{countriesVisited}</span>
              <span className="text-xs text-text-muted">Países</span>
            </div>
            <div className="hidden md:block text-center">
              <span className="block text-2xl md:text-3xl font-bold text-text-main">{citiesVisited}</span>
              <span className="text-xs text-text-muted">Cidades</span>
            </div>
            <div className="hidden md:block text-center">
              <span className="block text-2xl md:text-3xl font-bold text-success">{totalDays}</span>
              <span className="text-xs text-text-muted">Dias viajando</span>
            </div>
            {/* Notification Bell */}
            <button
              onClick={() => onNavigate?.('notifications')}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Notificações"
            >
              <span className="material-symbols-outlined text-2xl text-text-muted">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* Mobile Stats (visible only on mobile) */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <span className="block text-xl font-bold text-text-main">{totalTrips}</span>
          <span className="text-[10px] text-text-muted">Viagens</span>
        </div>
        <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <span className="block text-xl font-bold text-text-main">{countriesVisited}</span>
          <span className="text-[10px] text-text-muted">Países</span>
        </div>
        <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <span className="block text-xl font-bold text-text-main">{citiesVisited}</span>
          <span className="text-[10px] text-text-muted">Cidades</span>
        </div>
        <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <span className="block text-xl font-bold text-success">{totalDays}</span>
          <span className="text-[10px] text-text-muted">Dias</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* ========== ROW 1: HERO (Full Width) ========== */}
        <section>
          {/* Minhas Viagens */}
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <div className="flex justify-end mb-4">
              <div className="flex gap-1.5">
                {(['all', 'confirmed', 'planning'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${statusFilter === filter
                      ? 'bg-text-main text-white'
                      : 'bg-background-light text-text-muted hover:bg-primary-light hover:text-primary-dark'
                      }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'confirmed' ? 'Próximas' : 'Planejando'}
                  </button>
                ))}
              </div>
            </div>

            <TripCarousel
              trips={trips.filter(t => statusFilter === 'all' || t.status === statusFilter)}
              onViewTrip={onViewTrip}
              onAddTrip={onOpenAddModal}
            />
          </div>
        </section>

        {/* ========== ROW 2: WIDGETS (Left) + CALENDAR (Right) ========== */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Check-in Reminders (only shows if any pending) */}
            {/* CheckInWidget removed - data now comes from CalendarContext */}

            {/* Imaginar Viagens com IA */}
            <ImagineTripsWidget onCreateTrip={() => onOpenAddModal()} />

            {/* Next Trip Hero Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-soft group">
              {nextTrip ? (
                <div className="relative h-[320px]">
                  {nextTrip.coverImage && !imageErrors.has(nextTrip.id) ? (
                    <>
                      <img
                        src={nextTrip.coverImage}
                        alt={nextTrip.destination}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImageErrors(prev => new Set(prev).add(nextTrip.id))}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-9xl text-white/20">photo_camera</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
                    </>
                  )}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-xs font-bold uppercase tracking-wide w-fit">
                      <span className="size-2 rounded-full bg-white animate-pulse"></span>
                      Confirmado
                    </span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold mb-1">Próxima Viagem:</h2>
                      <h3 className="text-3xl md:text-4xl font-black tracking-tight">{nextTrip.title || nextTrip.destination}</h3>
                      <p className="text-white/70 text-sm mt-2 flex items-center gap-2">
                        {nextTrip.startDate}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                          <span className="block text-2xl font-bold">{countdown.days}</span>
                          <span className="text-[10px] uppercase font-semibold text-white/80">Dias</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                          <span className="block text-2xl font-bold">{countdown.hours.toString().padStart(2, '0')}</span>
                          <span className="text-[10px] uppercase font-semibold text-white/80">Horas</span>
                        </div>
                        <button
                          onClick={() => onViewTrip(nextTrip.id)}
                          className="ml-auto bg-secondary text-text-main hover:bg-secondary-dark px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center gap-2"
                        >
                          Ver Detalhes
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-secondary-light to-primary-light">
                  <span className="material-symbols-outlined text-6xl text-white">flight</span>
                  <p className="text-text-main font-semibold">Nenhuma viagem planejada</p>
                  <button onClick={onOpenAddModal} className="bg-primary-dark text-white px-5 py-2.5 rounded-full font-bold text-sm">
                    Criar Nova Viagem
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calendar + Day Agenda */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-main">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <div className="flex gap-1">
                  <button onClick={() => changeMonth('prev')} className="size-7 rounded-full hover:bg-background-light flex items-center justify-center text-text-muted">
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button onClick={() => changeMonth('next')} className="size-7 rounded-full hover:bg-background-light flex items-center justify-center text-text-muted">
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {dayLabels.map((d, i) => (
                  <span key={i} className="font-semibold text-text-muted py-1">{d}</span>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <span key={`empty-${i}`}></span>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

                  const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

                  const holiday = BRAZILIAN_HOLIDAYS.find(h => {
                    const [hYear, hMonth, hDay] = h.date.split('-').map(Number);
                    return hDay === day && hMonth === (currentMonth.getMonth() + 1) && hYear === currentMonth.getFullYear();
                  });

                  const activeTrip = trips.find(trip => {
                    if (!trip.startDate || !trip.endDate) return false;
                    const parseDate = (d: string) => {
                      if (d.includes('/')) {
                        const [day, month, year] = d.split('/').map(Number);
                        return new Date(year, month - 1, day);
                      }
                      const [year, month, day] = d.split('-').map(Number);
                      return new Date(year, month - 1, day);
                    };
                    const start = parseDate(trip.startDate);
                    const end = parseDate(trip.endDate);
                    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    return checkDate >= start && checkDate <= end;
                  });

                  // Determine background and border colors based on holiday
                  const holidayBg = holiday
                    ? holiday.type === 'nacional'
                      ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-200'
                      : 'bg-amber-50 ring-1 ring-inset ring-amber-200'
                    : '';

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(currentDate)}
                      onMouseEnter={() => holiday && setHoveredHolidayDay(day)}
                      onMouseLeave={() => setHoveredHolidayDay(null)}
                      className={`relative py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all
                        ${isToday
                          ? 'bg-primary-dark text-white shadow-md hover:brightness-110'
                          : selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
                            ? 'bg-secondary text-text-main font-bold ring-2 ring-primary-dark'
                            : activeTrip && !holiday
                              ? 'bg-green-100 text-green-700 font-bold hover:bg-green-200'
                              : holiday
                                ? `${holidayBg} hover:brightness-95`
                                : 'hover:bg-background-light text-text-main hover:font-bold'
                        }`}
                    >
                      <span className="block text-center">{day}</span>

                      {/* Holiday Popover */}
                      {holiday && hoveredHolidayDay === day && (
                        <div className={`absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-lg border whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 ${holiday.type === 'nacional'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="material-symbols-outlined text-xs">celebration</span>
                            <div className="flex flex-col">
                              <p className="font-bold leading-tight">{holiday.name}</p>
                              <p className="opacity-75 capitalize leading-tight">Feriado {holiday.type}</p>
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 rotate-45 border-l border-t ${holiday.type === 'nacional'
                            ? 'bg-emerald-100 border-emerald-200'
                            : 'bg-amber-100 border-amber-200'
                            }`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day Agenda */}
            {selectedDate && (
              <DayAgenda
                date={selectedDate}
                onClose={() => setSelectedDate(null)}
                events={selectedDateEvents}
              />
            )}
          </div>
        </section>


      </div>
    </PageContainer>
  );
};

export default Dashboard;
