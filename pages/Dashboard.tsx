import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Trip } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { useNotifications } from '../contexts/NotificationContext';
import { toISODate } from '../lib/dateUtils';

interface DashboardProps {
  onOpenAddModal: () => void;
  onViewTrip: (id: string) => void;
  onEditTrip?: (id: string) => void;
  onDeleteTrip?: (id: string) => void;
  trips: Trip[];
  onNavigate?: (tab: string) => void;
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1496442226666-8d4a0e29f16e?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1974&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533929736458-ca588d080e81?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1966&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499591934245-40b55745b905?q=80&w=2072&auto=format&fit=crop',
];

const Dashboard: React.FC<DashboardProps> = ({ onOpenAddModal, onViewTrip, onEditTrip, onDeleteTrip, trips, onNavigate }) => {
  const { user } = useAuth();
  const { syncFromTrips, syncActivitiesFromSupabase, syncTransportsFromSupabase, syncAccommodationsFromSupabase } = useCalendar();
  const { unreadCount } = useNotifications();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Sync all trip data with CalendarContext
  useEffect(() => {
    const syncAllData = async () => {
      syncFromTrips(trips);
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

  // Next upcoming confirmed trip
  const nextTrip = useMemo(() => {
    const todayStr = toISODate(new Date().toISOString().split('T')[0]);
    if (!todayStr) return null;

    const validTrips = trips.filter(t => {
      if (t.status !== 'confirmed') return false;
      const endISO = toISODate(t.endDate);
      return endISO && endISO >= todayStr;
    });

    validTrips.sort((a, b) => {
      const startA = toISODate(a.startDate) || '';
      const startB = toISODate(b.startDate) || '';
      return startA.localeCompare(startB);
    });

    return validTrips[0] || null;
  }, [trips]);

  // Countdown
  const countdown = useMemo(() => {
    if (!nextTrip) return { days: 0 };
    const startParts = nextTrip.startDate.split('/');
    const tripDate = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
    const diff = tripDate.getTime() - new Date().getTime();
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
    };
  }, [nextTrip]);

  // Upcoming trips (exclude the featured next trip)
  const upcomingTrips = useMemo(() => {
    return trips.filter(t => t.id !== nextTrip?.id);
  }, [trips, nextTrip]);

  const getCity = (destination: string) => destination.split(',')[0].trim();

  const getTripImage = (trip: Trip, index: number) => {
    if (trip.generatedCoverImage && !imageErrors.has(trip.id)) return trip.generatedCoverImage;
    if (trip.coverImage && !imageErrors.has(trip.id)) return trip.coverImage;
    return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
  };

  const nextTripImage = nextTrip
    ? (nextTrip.generatedCoverImage || nextTrip.coverImage || PLACEHOLDER_IMAGES[0])
    : '';

  // Quick action buttons config
  const quickActions = [
    { id: 'calendar', label: 'AGENDA', icon: 'calendar_month', color: 'bg-[#FFD93D]', tab: 'calendar' },
    { id: 'new-trip', label: 'NOVA VIAGEM', icon: 'add', color: 'bg-[#FF4081]', tab: null }, // Pink
    { id: 'library', label: 'BIBLIOTECA', icon: 'auto_stories', color: 'bg-[#4DD0E1]', tab: 'library' }, // Cyan
    { id: 'memories', label: 'MEMÓRIAS', icon: 'photo_camera', color: 'bg-[#FF9F43]', tab: 'memories' }, // Orange
    { id: 'explore', label: 'EXPLORAR', icon: 'explore', color: 'bg-[#E040FB]', tab: 'ai' }, // Purple
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.id === 'new-trip') {
      onOpenAddModal();
    } else if (action.tab) {
      onNavigate?.(action.tab);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Viajante';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="size-12 rounded-full bg-[#E8E4F0] flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-2xl text-[#6B5B95]">person</span>
            )}
          </div>
          <div>
            <p className="text-base text-[#1A1A1A]/60 font-medium">
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Bom dia,';
                if (hour < 18) return 'Boa tarde,';
                return 'Boa noite,';
              })()}
            </p>
            <p className="text-2xl font-bold text-[#1A1A1A] uppercase tracking-wide">{firstName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            onClick={() => onNavigate?.('notifications')}
            className="relative size-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Notificações"
          >
            <span className="material-symbols-outlined text-xl text-[#1A1A1A]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {/* Settings Gear */}
          <button
            onClick={() => onNavigate?.('settings')}
            className="size-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Configurações"
          >
            <span className="material-symbols-outlined text-xl text-[#1A1A1A]">settings</span>
          </button>
        </div>
      </div>

      {/* ========== MAIN HERO: Green Card + Destination Image ========== */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        {/* Left: Green Card with Trip Info + Quick Actions */}
        <div className="flex flex-col gap-4">
          {/* Next Trip Card */}
          <div
            className="bg-[#D4F541] rounded-2xl p-6 flex flex-col gap-6 cursor-pointer transform transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => nextTrip && onViewTrip(nextTrip.id)}
          >
            {nextTrip ? (
              <>
                <div>
                  <p className="text-base text-[#1A1A1A] font-medium mb-2">Próxima Viagem</p>
                  <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] uppercase leading-[0.9] tracking-tight">
                    {nextTrip.title || getCity(nextTrip.destination)}
                  </h2>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1A1A1A]">calendar_today</span>
                    <p className="text-lg text-[#1A1A1A] font-medium">{nextTrip.startDate} a {nextTrip.endDate}</p>
                  </div>
                  <p className="text-base font-bold text-[#FF4081]">
                    {countdown.days === 0 ? 'É HOJE!' : `Faltam ${String(countdown.days).padStart(2, '0')} dias`}
                  </p>
                </div>

                {/* Visual Separator */}
                <div className="h-px w-full bg-[#1A1A1A]/10"></div>

                {/* Participants Avatars */}
                {nextTrip.participants && nextTrip.participants.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {nextTrip.participants.map((p, i) => (
                        <div key={p.id || i} className="size-12 rounded-full border-[3px] border-[#D4F541] overflow-hidden bg-gray-300">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#6B5B95] text-white text-sm font-bold">
                              {p.initials || p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-[#1A1A1A]/70">vão com você</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <span className="material-symbols-outlined text-5xl text-[#1A1A1A]/20">flight_takeoff</span>
                <p className="text-lg font-bold text-[#1A1A1A]/40 text-center">Nenhuma viagem marcada.<br />Que tal planejar?</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenAddModal(); }}
                  className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full text-sm font-bold mt-2 hover:bg-black transition-colors shadow-lg"
                >
                  Criar Nova Viagem
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Grid (5 buttons) */}
          <div className="grid grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className={`${action.color} rounded-2xl p-2 aspect-square flex flex-col items-center justify-center gap-2 transition-transform duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
              >
                <span className="material-symbols-outlined text-3xl text-white drop-shadow-sm">{action.icon}</span>
                <span className="text-[9px] font-bold text-white uppercase leading-tight text-center tracking-wide drop-shadow-sm">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Large Destination Image */}
        <div
          className="relative rounded-3xl overflow-hidden min-h-[350px] lg:min-h-0 cursor-pointer group shadow-2xl"
          onClick={() => nextTrip && onViewTrip(nextTrip.id)}
        >
          {nextTrip && nextTripImage && !imageErrors.has(nextTrip.id) ? (
            <>
              <img
                src={nextTripImage}
                alt={nextTrip.destination}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageErrors(prev => new Set(prev).add(nextTrip!.id))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-gray-300">image</span>
            </div>
          )}

          {/* "ver detalhes" button */}
          {nextTrip && (
            <div className="absolute bottom-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={(e) => { e.stopPropagation(); onViewTrip(nextTrip.id); }}
                className="bg-white/90 backdrop-blur-md text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 hover:bg-white"
              >
                Ver Detalhes
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========== UPCOMING TRIPS - Responsive Grid ========== */}
      {upcomingTrips.length > 0 && (
        <section className="pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Label Card */}
            <div className="w-full aspect-[4/3] bg-black rounded-2xl flex items-center justify-center p-6 shadow-lg transform transition-transform duration-300 hover:scale-[1.02]">
              <p className="text-2xl font-bold text-white leading-tight lowercase text-center">
                próximas<br />viagens
              </p>
            </div>

            {/* Trip Cards */}
            {upcomingTrips.map((trip, index) => {
              const bgImage = getTripImage(trip, index);
              const city = getCity(trip.destination);

              // Calculate countdown
              const startParts = trip.startDate.split('/');
              const tripDate = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
              const diff = tripDate.getTime() - new Date().getTime();
              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
              const daysText = days > 0 ? `Faltam ${days} dias` : (days === 0 ? 'É hoje!' : 'Em andamento');

              return (
                <div
                  key={trip.id}
                  onClick={() => onViewTrip(trip.id)}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                >
                  {/* Background Image */}
                  <img
                    src={bgImage}
                    alt={trip.destination}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => setImageErrors(prev => new Set(prev).add(trip.id))}
                  />
                  {/* Dark overlay with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />

                  {/* Top Badge: Days remaining */}
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {daysText}
                    </p>
                  </div>

                  {/* Bottom Content: City & Dates */}
                  <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-black text-lg uppercase tracking-wide leading-none mb-1 drop-shadow-md">
                      {trip.title || city}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      <span className="material-symbols-outlined text-sm text-[#D4F541]">calendar_today</span>
                      <p className="text-xs font-medium text-gray-200">
                        {trip.startDate} - {trip.endDate}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state if no trips at all */}
      {trips.length === 0 && (
        <section className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="material-symbols-outlined text-6xl text-gray-300">luggage</span>
          <p className="text-gray-400 font-medium">Nenhuma viagem encontrada</p>
          <button
            onClick={onOpenAddModal}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full text-sm font-bold"
          >
            Criar Primeira Viagem
          </button>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
