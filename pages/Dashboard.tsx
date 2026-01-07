import React, { useRef, useState, useEffect } from 'react';
import DayAgenda from '../components/dashboard/DayAgenda';
import { Trip, ItineraryActivity, Transport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BRAZILIAN_HOLIDAYS } from '../constants';

interface DashboardProps {
  onOpenAddModal: () => void;
  onViewTrip: (id: string) => void;
  onEditTrip?: (id: string) => void;
  onDeleteTrip?: (id: string) => void;
  trips: Trip[];
  onNavigate?: (tab: string) => void;
}

// Brazilian Holidays 2025-2026
// Holidays are imported from constants.tsx

// Sample tasks data
const SAMPLE_TASKS = [
  { id: '1', date: 'out', day: '12', title: 'Check-in Voo', location: 'Online', status: 'pending' },
  { id: '2', date: 'out', day: '14', title: 'Traslado Hotel', location: 'Confirmar horário', status: 'pending' },
  { id: '3', date: 'out', day: '15', title: 'Reserva Jantar Kyoto', location: 'Pontocho', status: 'done' },
];

const Dashboard: React.FC<DashboardProps> = ({ onOpenAddModal, onViewTrip, onEditTrip, onDeleteTrip, trips, onNavigate }) => {
  const { user } = useAuth();
  const nextTrip = trips.find(t => t.status === 'confirmed') || trips[0];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'planning' | 'completed'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [allActivities, setAllActivities] = useState<ItineraryActivity[]>([]);
  const [allTransports, setAllTransports] = useState<Transport[]>([]);

  // Load activities and transports from localStorage
  useEffect(() => {
    const loadData = () => {
      const collectedActivities: ItineraryActivity[] = [];
      const collectedTransports: Transport[] = [];

      trips.forEach(trip => {
        if (typeof window !== 'undefined') {
          try {
            // Load itinerary activities
            const storedActivities = window.localStorage.getItem(`porai_trip_${trip.id}_itinerary_activities`);
            if (storedActivities) {
              const parsed = JSON.parse(storedActivities);
              if (Array.isArray(parsed)) {
                collectedActivities.push(...parsed);
              }
            }

            // Load transports
            const storedTransports = window.localStorage.getItem(`porai_trip_${trip.id}_transports`);
            if (storedTransports) {
              const parsed = JSON.parse(storedTransports);
              if (Array.isArray(parsed)) {
                collectedTransports.push(...parsed);
              }
            }
          } catch (e) {
            console.error(`Error loading data for trip ${trip.id}`, e);
          }
        }
      });

      setAllActivities(collectedActivities);
      setAllTransports(collectedTransports);
    };

    loadData();

    // Listen for storage events to update real-time
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [trips]);

  // Stats calculations
  const totalTrips = trips.length;
  const countriesVisited = new Set(trips.map(t => t.destination?.split(',')[1]?.trim() || t.destination)).size;
  const citiesVisited = new Set(trips.map(t => t.destination?.split(',')[0]?.trim())).size;
  const totalDays = trips.reduce((acc, t) => {
    if (!t.startDate || !t.endDate) return acc;
    const start = new Date(t.startDate.split('/').reverse().join('-'));
    const end = new Date(t.endDate.split('/').reverse().join('-'));
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return acc + (isNaN(days) ? 0 : days);
  }, 0);

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

  const countdown = getCountdown();

  // Generate events for DayAgenda based on selected date
  const generateEventsForDate = (date: Date) => {
    const events: { id: string; title: string; subtitle?: string; startTime: string; endTime: string; color: string }[] = [];

    const parseDate = (d: string) => {
      if (d.includes('/')) {
        const [day, month, year] = d.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(d);
    };

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    trips.forEach(trip => {
      if (!trip.startDate || !trip.endDate) return;

      const startDate = parseDate(trip.startDate);
      const endDate = parseDate(trip.endDate);

      // Departure - Soft Blue
      if (isSameDay(startDate, date)) {
        events.push({
          id: `dep-${trip.id}`,
          title: `Embarque: ${trip.title || trip.destination}`,
          subtitle: trip.destination,
          startTime: '08:00',
          endTime: '10:00',
          color: 'bg-blue-50 text-blue-700 border-blue-100'
        });
      }

      // Return - Soft Green
      if (isSameDay(endDate, date)) {
        events.push({
          id: `ret-${trip.id}`,
          title: `Retorno: ${trip.title || trip.destination}`,
          subtitle: trip.destination,
          startTime: '18:00',
          endTime: '20:00',
          color: 'bg-green-50 text-green-700 border-green-100'
        });
      }
    });

    // Add Transports (flights, trains, etc.)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Filter transports for this date
    allTransports.forEach(transport => {
      if (!transport.departureDate) return;

      // Compare dates - handle both DD/MM/YYYY and other formats
      const transportDate = transport.departureDate;
      if (transportDate === formattedDate) {
        // Get transport type icon label
        const typeLabels: Record<string, string> = {
          flight: 'Voo',
          train: 'Trem',
          bus: 'Ônibus',
          car: 'Carro',
          transfer: 'Transfer',
          ferry: 'Balsa'
        };

        const typeLabel = typeLabels[transport.type] || 'Transporte';

        // Calculate end time based on arrival if available
        let endTime = transport.arrivalTime || transport.departureTime;
        if (!endTime) {
          // Default 2h duration if no arrival time
          const [h, m] = (transport.departureTime || '08:00').split(':').map(Number);
          const endH = (h + 2) % 24;
          endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }

        events.push({
          id: `transport-${transport.id}`,
          title: `${typeLabel}: ${transport.operator} ${transport.reference || ''}`.trim(),
          subtitle: transport.route || `${transport.departureCity || transport.departureLocation} → ${transport.arrivalCity || transport.arrivalLocation}`,
          startTime: transport.departureTime || '08:00',
          endTime: endTime,
          color: 'bg-violet-50 text-violet-700 border-violet-100'
        });
      }
    });

    // Add Itinerary Activities
    const daysActivities = allActivities.filter(a => a.date === formattedDate);

    daysActivities.forEach(act => {
      // Calculate end time (approve 1.5h duration if not specified)
      const [h, m] = act.time.split(':').map(Number);
      const endH = (h + 1) % 24;
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Determine color based on type - Soft Pastel Palette similar to City Guide
      let color = 'bg-gray-50 text-gray-700 border-gray-100'; // Default

      if (act.type === 'food' || act.type === 'meal') {
        color = 'bg-orange-50 text-orange-700 border-orange-100';
      } else if (act.type === 'sightseeing' || act.type === 'culture' || act.type === 'attraction') {
        color = 'bg-amber-50 text-amber-700 border-amber-100'; // Match Gastronomy Guide yellow/amber aesthetic
      } else if (act.type === 'transport') {
        color = 'bg-blue-50 text-blue-700 border-blue-100';
      } else if (act.type === 'accommodation') {
        color = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      }

      events.push({
        id: act.id,
        title: act.title,
        subtitle: act.location || (act.type === 'food' ? 'Restaurante' : 'Atividade'),
        startTime: act.time,
        endTime: endTime,
        color: color
      });
    });

    // Sort events by start time
    events.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return events;
  };

  const selectedDateEvents = selectedDate ? generateEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-background-light -m-6 p-6">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">

        {/* ========== HEADER ========== */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
              Bem-vindo(a) de volta, {user?.name?.split(' ')[0] || 'Viajante'}! 👋
            </h1>
            <p className="text-text-muted text-sm mt-0.5">Planeje sua próxima aventura.</p>
          </div>
          <div className="flex items-center gap-6 md:gap-8">
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-bold text-text-main">{totalTrips}</span>
              <span className="text-xs text-text-muted">Viagens</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-bold text-text-main">{countriesVisited}</span>
              <span className="text-xs text-text-muted">Países</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-bold text-text-main">{citiesVisited}</span>
              <span className="text-xs text-text-muted">Cidades</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-bold text-success">{totalDays}</span>
              <span className="text-xs text-text-muted">Dias viajando</span>
            </div>
          </div>
        </header>

        {/* ========== ROW 1: HERO (Full Width) ========== */}
        <section>
          {/* Next Trip Hero Card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-soft group">
            {nextTrip ? (
              <div className="relative h-[320px]">
                <img
                  src={nextTrip.coverImage}
                  alt={nextTrip.destination}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-xs font-bold uppercase tracking-wide w-fit">
                    <span className="size-2 rounded-full bg-white animate-pulse"></span>
                    Confirmado
                  </span>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold mb-1">Próxima Viagem:</h2>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight">{nextTrip.destination}</h3>
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
            {/* Próximos Feriados */}
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-primary-dark">celebration</span>
                <h3 className="font-bold text-text-main">Próximos Feriados</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {BRAZILIAN_HOLIDAYS
                  .filter(h => new Date(h.date) >= new Date())
                  .slice(0, 5)
                  .map((holiday, index) => {
                    const dateParts = holiday.date.split('-');
                    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                    const monthName = months[parseInt(dateParts[1]) - 1];
                    const day = dateParts[2];

                    return (
                      <div key={index} className="flex items-center gap-3 bg-background-light rounded-xl p-3 min-w-[180px] shrink-0">
                        <div className="flex flex-col items-center text-center min-w-[36px]">
                          <span className="text-[10px] font-bold text-text-muted uppercase">{monthName}</span>
                          <span className="text-lg font-bold text-text-main">{day}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-main text-sm truncate">{holiday.name}</p>
                          <p className="text-xs text-text-muted capitalize">{holiday.type}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-primary-dark">bolt</span>
                <h3 className="font-bold text-text-main">Ações Rápidas</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={onOpenAddModal}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-light hover:bg-secondary-light hover:shadow-md transition-all group"
                >
                  <span className="material-symbols-outlined text-2xl text-text-muted group-hover:text-blue-500 group-hover:scale-110 transition-all">add_location</span>
                  <span className="text-xs font-bold text-text-main">Nova Reserva</span>
                </button>
                <button
                  onClick={() => onNavigate?.('documents')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-light hover:bg-green-50 hover:shadow-md transition-all group"
                >
                  <span className="material-symbols-outlined text-2xl text-text-muted group-hover:text-green-500 group-hover:scale-110 transition-all">folder_open</span>
                  <span className="text-xs font-bold text-text-main">Documentos</span>
                </button>
                <button
                  onClick={() => onNavigate?.('ai')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-light hover:bg-primary-light hover:shadow-md transition-all group"
                >
                  <span className="material-symbols-outlined text-2xl text-text-muted group-hover:text-primary-dark group-hover:scale-110 transition-all">smart_toy</span>
                  <span className="text-xs font-bold text-text-main">Guia de IA</span>
                </button>
                <button
                  onClick={() => onNavigate?.('settings')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-light hover:bg-amber-50 hover:shadow-md transition-all group"
                >
                  <span className="material-symbols-outlined text-2xl text-text-muted group-hover:text-yellow-600 group-hover:scale-110 transition-all">settings</span>
                  <span className="text-xs font-bold text-text-main">Configurações</span>
                </button>
              </div>
            </div>

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
                      <div className="h-20 bg-cover bg-center relative" style={{ backgroundImage: `url(${trip.coverImage})` }}>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
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

                  return (
                    <span
                      key={day}
                      onClick={() => setSelectedDate(currentDate)}
                      title={`${activeTrip ? activeTrip.destination : ''} ${holiday ? '• ' + holiday.name : ''}`}
                      className={`py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all relative
                        ${isToday
                          ? 'bg-primary-dark text-white shadow-md hover:brightness-110'
                          : selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
                            ? 'bg-secondary text-text-main font-bold ring-2 ring-primary-dark'
                            : activeTrip
                              ? 'bg-green-100 text-green-700 font-bold hover:bg-green-200'
                              : 'hover:bg-background-light text-text-main hover:font-bold'
                        }`}
                    >
                      {day}
                      {holiday && !isToday && (
                        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full ${holiday.type === 'nacional' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      )}
                    </span>
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
    </div>
  );
};

export default Dashboard;
