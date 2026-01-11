import * as React from 'react';
import { PageContainer, PageHeader, Card } from '../components/ui/Base';
import { useRef, useState, useEffect, useMemo } from 'react';
import DayAgenda from '../components/dashboard/DayAgenda';
import CheckInWidget from '../components/dashboard/CheckInWidget';
import ImagineTripsWidget from '../components/dashboard/ImagineTripsWidget';
import { Trip, ItineraryActivity, Transport, HotelReservation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { useNotifications } from '../contexts/NotificationContext';
import { BRAZILIAN_HOLIDAYS } from '../constants';

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
  const { syncFromTrips, syncFromActivities, syncFromTransports, syncActivitiesFromSupabase, getEventsForDate } = useCalendar();
  const { unreadCount } = useNotifications();
  const nextTrip = trips.find(t => t.status === 'confirmed') || trips[0];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'planning' | 'completed'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allActivities, setAllActivities] = useState<ItineraryActivity[]>([]);
  const [allTransports, setAllTransports] = useState<Transport[]>([]);
  const [allHotels, setAllHotels] = useState<HotelReservation[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [hoveredHolidayDay, setHoveredHolidayDay] = useState<number | null>(null);

  // Load activities, transports, and hotels from Supabase/localStorage and sync with CalendarContext
  useEffect(() => {
    const loadData = async () => {
      const collectedActivities: ItineraryActivity[] = [];
      const collectedTransports: Transport[] = [];
      const collectedHotels: HotelReservation[] = [];

      for (const trip of trips) {
        try {
          // Load itinerary activities from Supabase (new source of truth)
          await syncActivitiesFromSupabase(trip.id);

          // Also fetch activities for local display
          const { supabase } = await import('../lib/supabase');
          const { data: activitiesData } = await supabase
            .from('itinerary_activities')
            .select('*')
            .eq('trip_id', trip.id);

          if (activitiesData && Array.isArray(activitiesData)) {
            const mappedActivities: ItineraryActivity[] = activitiesData.map(item => ({
              id: item.id,
              day: item.day,
              date: item.date,
              time: item.time ? item.time.slice(0, 5) : '00:00',
              title: item.title,
              location: item.location,
              locationDetail: item.location_detail,
              type: item.type as any,
              completed: item.completed,
              notes: item.notes,
              image: item.image,
              price: item.price ? String(item.price) : undefined,
              duration: item.duration || 60,
            }));
            collectedActivities.push(...mappedActivities);
          }

          // Load transports from localStorage (TransportContext may also use Supabase in future)
          if (typeof window !== 'undefined') {
            const storedTransports = window.localStorage.getItem(`porai_trip_${trip.id}_transports`);
            if (storedTransports) {
              const parsed = JSON.parse(storedTransports);
              if (Array.isArray(parsed)) {
                collectedTransports.push(...parsed);
                // Sync transports with calendar
                syncFromTransports(parsed, trip.id);
              }
            }

            // Load hotels
            const storedHotels = window.localStorage.getItem(`porai_trip_${trip.id}_hotels`);
            if (storedHotels) {
              const parsed = JSON.parse(storedHotels);
              if (Array.isArray(parsed)) {
                collectedHotels.push(...parsed);
              }
            }
          }
        } catch (e) {
          console.error(`Error loading data for trip ${trip.id}`, e);
        }
      }

      setAllActivities(collectedActivities);
      setAllTransports(collectedTransports);
      setAllHotels(collectedHotels);
    };

    // Sync trips with calendar
    syncFromTrips(trips);

    loadData();

    // Listen for storage events to update real-time
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [trips, syncFromTrips, syncActivitiesFromSupabase, syncFromTransports]);

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

  // Generate events for DayAgenda based on selected date - memoized
  const generateEventsForDate = useMemo(() => (date: Date) => {
    const events: {
      id: string;
      title: string;
      subtitle?: string;
      startTime: string;
      endTime: string;
      color: string;
      type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'transfer' | 'meal' | 'sightseeing' | 'accommodation' | 'activity';
      location?: string;
      status?: 'on_time' | 'delayed' | 'cancelled';
      route?: { from: string; to: string };
      image?: string;
    }[] = [];

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    // Format date for comparison
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Add Transports (flights, trains, etc.)
    allTransports.forEach(transport => {
      if (!transport.departureDate) return;

      if (transport.departureDate === formattedDate) {
        const typeMap: Record<string, 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'transfer'> = {
          flight: 'flight',
          train: 'train',
          bus: 'bus',
          car: 'car',
          transfer: 'transfer',
          ferry: 'ferry'
        };

        const typeLabels: Record<string, string> = {
          flight: 'Voo',
          train: 'Trem',
          bus: 'Ônibus',
          car: 'Carro',
          transfer: 'Transfer',
          ferry: 'Balsa'
        };

        const typeLabel = typeLabels[transport.type] || 'Transporte';

        // Calculate end time
        let endTime = transport.arrivalTime || transport.departureTime;
        if (!endTime) {
          const [h, m] = (transport.departureTime || '08:00').split(':').map(Number);
          const endH = (h + 2) % 24;
          endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }

        // Build route info
        const fromLocation = transport.departureCity || transport.departureLocation || '';
        const toLocation = transport.arrivalCity || transport.arrivalLocation || '';

        events.push({
          id: `transport-${transport.id}`,
          title: `${typeLabel}: ${transport.operator} ${transport.reference || ''}`.trim(),
          subtitle: transport.route || `${fromLocation} → ${toLocation}`,
          startTime: transport.departureTime?.slice(0, 5) || '08:00',
          endTime: endTime,
          color: 'bg-violet-50 text-violet-700 border-violet-100',
          type: typeMap[transport.type] || 'transfer',
          location: toLocation,
          status: 'on_time', // Default to on_time, could be dynamic
          route: fromLocation && toLocation ? { from: fromLocation, to: toLocation } : undefined,
          image: transport.type === 'flight' ? 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80' : undefined
        });
      }
    });

    // Add Itinerary Activities
    const daysActivities = allActivities.filter(a => {
      if (!a.date) return false;

      let activityDate: Date;
      if (a.date.includes('/')) {
        const [d, m, y] = a.date.split('/').map(Number);
        activityDate = new Date(y, m - 1, d);
      } else {
        const [y, m, d] = a.date.split('-').map(Number);
        activityDate = new Date(y, m - 1, d);
      }

      return isSameDay(activityDate, date);
    });

    daysActivities.forEach(act => {
      const [h, m] = act.time.split(':').map(Number);
      const endH = (h + 1) % 24;
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Map activity type
      let eventType: 'meal' | 'sightseeing' | 'accommodation' | 'activity' = 'activity';
      let color = 'bg-gray-50 text-gray-700 border-gray-100';

      if (act.type === 'food' || act.type === 'meal') {
        eventType = 'meal';
        color = 'bg-orange-50 text-orange-700 border-orange-100';
      } else if (act.type === 'sightseeing' || act.type === 'culture') {
        eventType = 'sightseeing';
        color = 'bg-amber-50 text-amber-700 border-amber-100';
      } else if (act.type === 'accommodation') {
        eventType = 'accommodation';
        color = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      }

      events.push({
        id: act.id,
        title: act.title,
        subtitle: act.location || (act.type === 'food' ? 'Restaurante' : 'Atividade'),
        startTime: act.time,
        endTime: endTime,
        color: color,
        type: eventType,
        location: act.location
      });
    });

    // Sort events by start time
    events.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return events;
  }, [allTransports, allActivities, allHotels]);

  const selectedDateEvents = selectedDate ? generateEventsForDate(selectedDate) : [];

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
        </section>

        {/* ========== ROW 2: WIDGETS (Left) + CALENDAR (Right) ========== */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Check-in Reminders (only shows if any pending) */}
            <CheckInWidget transports={allTransports} hotels={allHotels} />

            {/* Imaginar Viagens com IA */}
            <ImagineTripsWidget onCreateTrip={() => onOpenAddModal()} />

            {/* Minhas Viagens */}
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary-dark">luggage</span>
                  <h3 className="font-bold text-text-main">Minhas Viagens</h3>
                </div>
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
              <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {trips
                  .filter(t => statusFilter === 'all' || t.status === statusFilter)
                  .map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => onViewTrip(trip.id)}
                      className="min-w-[160px] rounded-xl overflow-hidden bg-background-light hover:shadow-lg transition-all cursor-pointer group shrink-0"
                    >
                      <div className="h-20 bg-cover bg-center relative bg-gradient-to-br from-primary-light to-secondary-light" style={{ backgroundImage: trip.coverImage && !imageErrors.has(trip.id) ? `url(${trip.coverImage})` : 'none' }}>
                        {trip.coverImage && !imageErrors.has(trip.id) && (
                          <img
                            src={trip.coverImage}
                            alt={trip.destination}
                            className="hidden"
                            onError={() => setImageErrors(prev => new Set(prev).add(trip.id))}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        {(!trip.coverImage || imageErrors.has(trip.id)) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-white/50">photo_camera</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h4 className="font-bold text-text-main text-xs truncate">{trip.title || trip.destination}</h4>
                        <p className="text-[10px] text-text-muted mt-0.5">{trip.startDate}</p>
                        <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${trip.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {trip.status === 'confirmed' ? 'Próxima' : 'Planejando'}
                        </span>
                      </div>
                    </div>
                  ))}
                <div
                  onClick={onOpenAddModal}
                  className="min-w-[100px] flex flex-col items-center justify-center gap-2 rounded-xl bg-background-light border-2 border-dashed border-gray-300 hover:border-primary-dark hover:bg-primary-light/50 transition-all cursor-pointer shrink-0 py-6"
                >
                  <span className="material-symbols-outlined text-2xl text-text-muted">add</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase">Nova</span>
                </div>
              </div>
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
                            <div>
                              <p className="font-bold">{holiday.name}</p>
                              <p className="opacity-75 capitalize">Feriado {holiday.type}</p>
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
