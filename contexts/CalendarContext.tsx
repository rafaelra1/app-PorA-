import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CalendarEvent,
  CalendarFilter,
  CalendarViewMode,
  Trip,
  ItineraryActivity,
  Transport
} from '../types';
import { useAuth } from './AuthContext';

interface CalendarContextValue {
  // State
  events: CalendarEvent[];
  selectedDate: Date;
  viewMode: CalendarViewMode;
  filters: CalendarFilter;

  // Actions
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  moveEvent: (id: string, newDate: string, newStartTime?: string) => Promise<void>;
  toggleEventComplete: (id: string) => Promise<void>;

  // View controls
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setFilters: (filters: Partial<CalendarFilter>) => void;

  // Getters
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];

  // Sync functions
  syncFromTrips: (trips: Trip[]) => void;
  syncFromActivities: (activities: ItineraryActivity[], tripId: string) => void;
  syncFromTransports: (transports: Transport[], tripId: string) => void;

  // Loading
  isLoading: boolean;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filters, setFiltersState] = useState<CalendarFilter>({
    status: 'all',
    type: 'all',
    tripId: 'all',
    searchQuery: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load events from localStorage on mount
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = () => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(`porai_calendar_events_${user?.id || 'guest'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEvents(parsed);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEvents = (updatedEvents: CalendarEvent[]) => {
    try {
      localStorage.setItem(
        `porai_calendar_events_${user?.id || 'guest'}`,
        JSON.stringify(updatedEvents)
      );
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  };

  const addEvent = async (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CalendarEvent> => {
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    return newEvent;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>): Promise<void> => {
    const updatedEvents = events.map(event =>
      event.id === id
        ? { ...event, ...updates, updatedAt: new Date().toISOString() }
        : event
    );
    saveEvents(updatedEvents);
  };

  const deleteEvent = async (id: string): Promise<void> => {
    const updatedEvents = events.filter(event => event.id !== id);
    saveEvents(updatedEvents);
  };

  const moveEvent = async (
    id: string,
    newDate: string,
    newStartTime?: string
  ): Promise<void> => {
    const updates: Partial<CalendarEvent> = {
      startDate: newDate,
    };

    if (newStartTime) {
      updates.startTime = newStartTime;
    }

    await updateEvent(id, updates);
  };

  const toggleEventComplete = async (id: string): Promise<void> => {
    const event = events.find(e => e.id === id);
    if (event) {
      await updateEvent(id, { completed: !event.completed });
    }
  };

  const setFilters = (newFilters: Partial<CalendarFilter>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = formatDate(date);

    return events.filter(event => {
      // Check if event falls on this date
      const eventStartDate = parseDate(event.startDate);
      const eventEndDate = event.endDate ? parseDate(event.endDate) : eventStartDate;

      return date >= eventStartDate && date <= eventEndDate;
    }).filter(applyFilters);
  };

  const getEventsForDateRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStartDate = parseDate(event.startDate);
      const eventEndDate = event.endDate ? parseDate(event.endDate) : eventStartDate;

      // Event overlaps with the range
      return (
        (eventStartDate >= startDate && eventStartDate <= endDate) ||
        (eventEndDate >= startDate && eventEndDate <= endDate) ||
        (eventStartDate <= startDate && eventEndDate >= endDate)
      );
    }).filter(applyFilters);
  };

  const applyFilters = (event: CalendarEvent): boolean => {
    // Type filter
    if (filters.type && filters.type !== 'all' && event.type !== filters.type) {
      return false;
    }

    // Trip filter
    if (filters.tripId && filters.tripId !== 'all' && event.tripId !== filters.tripId) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description?.toLowerCase().includes(query);
      const matchesLocation = event.location?.toLowerCase().includes(query);

      if (!matchesTitle && !matchesDescription && !matchesLocation) {
        return false;
      }
    }

    return true;
  };

  // Sync from trips - create events for trip start/end
  const syncFromTrips = (trips: Trip[]) => {
    const tripEvents: CalendarEvent[] = [];
    const now = new Date().toISOString();

    trips.forEach(trip => {
      // Check if events already exist for this trip
      const existingTripEvents = events.filter(e => e.tripId === trip.id && e.type === 'trip');

      if (existingTripEvents.length === 0) {
        // Departure event
        tripEvents.push({
          id: `trip_start_${trip.id}`,
          title: `Embarque: ${trip.title || trip.destination}`,
          description: `Início da viagem para ${trip.destination}`,
          startDate: trip.startDate,
          startTime: '08:00',
          endTime: '10:00',
          allDay: false,
          type: 'trip',
          tripId: trip.id,
          color: '#3b82f6',
          location: trip.destination,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });

        // Return event
        tripEvents.push({
          id: `trip_end_${trip.id}`,
          title: `Retorno: ${trip.title || trip.destination}`,
          description: `Fim da viagem em ${trip.destination}`,
          startDate: trip.endDate,
          startTime: '18:00',
          endTime: '20:00',
          allDay: false,
          type: 'trip',
          tripId: trip.id,
          color: '#10b981',
          location: trip.destination,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    if (tripEvents.length > 0) {
      saveEvents([...events, ...tripEvents]);
    }
  };

  // Sync from itinerary activities
  const syncFromActivities = (activities: ItineraryActivity[], tripId: string) => {
    const activityEvents: CalendarEvent[] = [];
    const now = new Date().toISOString();

    activities.forEach(activity => {
      // Check if event already exists
      const existingEvent = events.find(e => e.activityId === activity.id);

      if (!existingEvent) {
        const endTime = calculateEndTime(activity.time, activity.duration || 60);

        activityEvents.push({
          id: `activity_${activity.id}`,
          title: activity.title,
          description: activity.notes,
          startDate: activity.date,
          startTime: activity.time,
          endTime: endTime,
          allDay: false,
          type: mapActivityType(activity.type),
          tripId: tripId,
          activityId: activity.id,
          location: activity.location,
          locationDetail: activity.locationDetail,
          completed: activity.completed,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    if (activityEvents.length > 0) {
      saveEvents([...events, ...activityEvents]);
    }
  };

  // Sync from transports
  const syncFromTransports = (transports: Transport[], tripId: string) => {
    const transportEvents: CalendarEvent[] = [];
    const now = new Date().toISOString();

    transports.forEach(transport => {
      // Check if event already exists
      const existingEvent = events.find(e => e.transportId === transport.id);

      if (!existingEvent) {
        transportEvents.push({
          id: `transport_${transport.id}`,
          title: `${getTransportLabel(transport.type)}: ${transport.operator} ${transport.reference}`,
          description: transport.route,
          startDate: transport.departureDate,
          startTime: transport.departureTime,
          endTime: transport.arrivalTime,
          allDay: false,
          type: transport.type,
          tripId: tripId,
          transportId: transport.id,
          location: transport.departureLocation,
          locationDetail: `${transport.departureCity || transport.departureLocation} → ${transport.arrivalCity || transport.arrivalLocation}`,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    if (transportEvents.length > 0) {
      saveEvents([...events, ...transportEvents]);
    }
  };

  // Helper functions
  const parseDate = (dateStr: string): Date => {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const mapActivityType = (activityType: string): CalendarEvent['type'] => {
    const typeMap: Record<string, CalendarEvent['type']> = {
      transport: 'activity',
      accommodation: 'accommodation',
      meal: 'meal',
      food: 'restaurant',
      sightseeing: 'sightseeing',
      culture: 'culture',
      nature: 'nature',
      shopping: 'shopping',
      nightlife: 'nightlife',
    };
    return typeMap[activityType] || 'activity';
  };

  const getTransportLabel = (type: string): string => {
    const labels: Record<string, string> = {
      flight: 'Voo',
      train: 'Trem',
      bus: 'Ônibus',
      car: 'Carro',
      transfer: 'Transfer',
      ferry: 'Balsa',
    };
    return labels[type] || 'Transporte';
  };

  const value: CalendarContextValue = {
    events,
    selectedDate,
    viewMode,
    filters,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    toggleEventComplete,
    setSelectedDate,
    setViewMode,
    setFilters,
    getEventsForDate,
    getEventsForDateRange,
    syncFromTrips,
    syncFromActivities,
    syncFromTransports,
    isLoading,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
