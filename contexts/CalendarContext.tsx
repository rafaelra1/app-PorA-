import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  CalendarEvent,
  CalendarFilter,
  CalendarViewMode,
  Trip,
  ItineraryActivity,
  Transport
} from '../types';
import { useAuth } from './AuthContext';
import { BRAZILIAN_HOLIDAYS } from '../constants';
import { supabase } from '../lib/supabase';

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
  syncHolidays: () => void;
  syncActivitiesFromSupabase: (tripId: string) => Promise<void>;

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

  // Helper functions
  const parseDate = useCallback((dateStr: string): Date => {
    if (!dateStr) return new Date();

    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }

    // Handle YYYY-MM-DD (treat as local time)
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    return new Date(dateStr);
  }, []);

  const formatDate = useCallback((date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const calculateEndTime = useCallback((startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }, []);

  const mapActivityType = useCallback((activityType: string): CalendarEvent['type'] => {
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
  }, []);

  const getTransportLabel = useCallback((type: string): string => {
    const labels: Record<string, string> = {
      flight: 'Voo',
      train: 'Trem',
      bus: 'Ônibus',
      car: 'Carro',
      transfer: 'Transfer',
      ferry: 'Balsa',
    };
    return labels[type] || 'Transporte';
  }, []);

  const loadEvents = useCallback(() => {
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
  }, [user?.id]);

  // Load events from localStorage on mount
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, loadEvents]);

  const saveEvents = useCallback((updatedEvents: CalendarEvent[]) => {
    try {
      localStorage.setItem(
        `porai_calendar_events_${user?.id || 'guest'}`,
        JSON.stringify(updatedEvents)
      );
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  }, [user?.id]);

  const addEvent = useCallback(async (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CalendarEvent> => {
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    setEvents(prev => {
      const updated = [...prev, newEvent];
      saveEvents(updated);
      return updated;
    });
    return newEvent;
  }, [saveEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>): Promise<void> => {
    setEvents(prev => {
      const updated = prev.map(event =>
        event.id === id
          ? { ...event, ...updates, updatedAt: new Date().toISOString() }
          : event
      );
      saveEvents(updated);
      return updated;
    });
  }, [saveEvents]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    setEvents(prev => {
      const updated = prev.filter(event => event.id !== id);
      saveEvents(updated);
      return updated;
    });
  }, [saveEvents]);

  const moveEvent = useCallback(async (
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
  }, [updateEvent]);

  const toggleEventComplete = useCallback(async (id: string): Promise<void> => {
    setEvents(prev => {
      const event = prev.find(e => e.id === id);
      if (event) {
        const updated = prev.map(e => e.id === id ? { ...e, completed: !e.completed, updatedAt: new Date().toISOString() } : e);
        saveEvents(updated);
        return updated;
      }
      return prev;
    });
  }, [saveEvents]);

  const setFilters = useCallback((newFilters: Partial<CalendarFilter>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = useCallback((event: CalendarEvent): boolean => {
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
  }, [filters]);

  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const dateStr = formatDate(date);

    return events.filter(event => {
      // Check if event falls on this date
      const eventStartDate = parseDate(event.startDate);
      const eventEndDate = event.endDate ? parseDate(event.endDate) : eventStartDate;

      return date >= eventStartDate && date <= eventEndDate;
    }).filter(applyFilters);
  }, [events, formatDate, parseDate, applyFilters]);

  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date): CalendarEvent[] => {
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
  }, [events, parseDate, applyFilters]);

  // Sync from trips - create events for trip start/end
  const syncFromTrips = useCallback((trips: Trip[]) => {
    setEvents(prev => {
      const tripEvents: CalendarEvent[] = [];
      const now = new Date().toISOString();

      trips.forEach(trip => {
        // Check if events already exist for this trip
        const existingTripEvents = prev.filter(e => e.tripId === trip.id && e.type === 'trip');

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
        const updated = [...prev, ...tripEvents];
        saveEvents(updated);
        return updated;
      }
      return prev;
    });
  }, [saveEvents]);

  // Sync from itinerary activities
  const syncFromActivities = useCallback((activities: ItineraryActivity[], tripId: string) => {
    setEvents(prev => {
      // We need to handle both new events and updates to existing ones
      // First, filter out any existing events for this activity that might be outdated
      let currentEvents = [...prev];
      const now = new Date().toISOString();
      let hasChanges = false;

      activities.forEach(activity => {
        const endTime = calculateEndTime(activity.time, activity.duration || 60);
        const existingEventIndex = currentEvents.findIndex(e => e.activityId === activity.id);

        const eventData: CalendarEvent = {
          id: existingEventIndex >= 0 ? currentEvents[existingEventIndex].id : `activity_${activity.id}`,
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
          createdAt: existingEventIndex >= 0 ? currentEvents[existingEventIndex].createdAt : now,
          updatedAt: now,
        };

        if (existingEventIndex >= 0) {
          // Update existing event
          const existing = currentEvents[existingEventIndex];
          // Check if anything actually changed to avoid unnecessary saves
          if (
            existing.title !== eventData.title ||
            existing.startTime !== eventData.startTime ||
            existing.startDate !== eventData.startDate ||
            existing.description !== eventData.description ||
            existing.completed !== eventData.completed
          ) {
            currentEvents[existingEventIndex] = eventData;
            hasChanges = true;
          }
        } else {
          // Add new event
          currentEvents.push(eventData);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        saveEvents(currentEvents);
        return currentEvents;
      }
      return prev;
    });
  }, [calculateEndTime, mapActivityType, saveEvents]);

  // Sync from transports
  const syncFromTransports = useCallback((transports: Transport[], tripId: string) => {
    setEvents(prev => {
      let currentEvents = [...prev];
      const now = new Date().toISOString();
      let hasChanges = false;

      transports.forEach(transport => {
        const existingEventIndex = currentEvents.findIndex(e => e.transportId === transport.id);

        const eventData: CalendarEvent = {
          id: existingEventIndex >= 0 ? currentEvents[existingEventIndex].id : `transport_${transport.id}`,
          title: `${getTransportLabel(transport.type)}: ${transport.operator} ${transport.reference}`,
          description: transport.route,
          startDate: transport.departureDate,
          startTime: transport.departureTime,
          endTime: transport.arrivalTime,
          allDay: false,
          type: 'activity', // Map transport types to generic activity or specific if available in CalendarEventType
          tripId: tripId,
          transportId: transport.id,
          location: transport.departureLocation,
          locationDetail: `${transport.departureCity || transport.departureLocation} → ${transport.arrivalCity || transport.arrivalLocation}`,
          completed: false, // Transports don't usually have a 'completed' state in the same way, but keeping consistency
          createdAt: existingEventIndex >= 0 ? currentEvents[existingEventIndex].createdAt : now,
          updatedAt: now,
        };

        if (existingEventIndex >= 0) {
          // Update existing
          const existing = currentEvents[existingEventIndex];
          if (
            existing.title !== eventData.title ||
            existing.startTime !== eventData.startTime ||
            existing.startDate !== eventData.startDate ||
            existing.description !== eventData.description
          ) {
            currentEvents[existingEventIndex] = eventData;
            hasChanges = true;
          }
        } else {
          // Add new
          currentEvents.push(eventData);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        saveEvents(currentEvents);
        return currentEvents;
      }
      return prev;
    });
  }, [getTransportLabel, saveEvents]);

  // Sync holidays from BRAZILIAN_HOLIDAYS constant
  const syncHolidays = useCallback(() => {
    setEvents(prev => {
      const now = new Date().toISOString();
      const holidayEvents: CalendarEvent[] = [];
      let hasNewHolidays = false;

      BRAZILIAN_HOLIDAYS.forEach(holiday => {
        const holidayId = `holiday_${holiday.date}`;
        const existingHoliday = prev.find(e => e.id === holidayId);

        if (!existingHoliday) {
          hasNewHolidays = true;
          holidayEvents.push({
            id: holidayId,
            title: holiday.name,
            description: `Feriado ${holiday.type === 'nacional' ? 'Nacional' : 'Facultativo'}`,
            startDate: holiday.date,
            allDay: true,
            type: 'holiday',
            color: holiday.type === 'nacional' ? '#10b981' : '#f59e0b',
            completed: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      });

      if (hasNewHolidays) {
        const updated = [...prev, ...holidayEvents];
        saveEvents(updated);
        return updated;
      }
      return prev;
    });
  }, [saveEvents]);

  // Sync holidays on mount
  useEffect(() => {
    syncHolidays();
  }, [syncHolidays]);

  // Sync itinerary activities directly from Supabase
  const syncActivitiesFromSupabase = useCallback(async (tripId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('itinerary_activities')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching activities from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        // Transform and sync to calendar
        const activities: ItineraryActivity[] = data.map(item => ({
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

        syncFromActivities(activities, tripId);
      }
    } catch (err) {
      console.error('Error syncing activities from Supabase:', err);
    }
  }, [user, syncFromActivities]);

  const value = useMemo(() => ({
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
    syncHolidays,
    syncActivitiesFromSupabase,
    isLoading,
  }), [
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
    syncHolidays,
    syncActivitiesFromSupabase,
    isLoading,
  ]);

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
