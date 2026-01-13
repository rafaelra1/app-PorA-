import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  CalendarEvent,
  CalendarFilter,
  CalendarViewMode,
  Trip,
  ItineraryActivity,
  Transport,
  HotelReservation
} from '../types';
import { useAuth } from './AuthContext';
import { BRAZILIAN_HOLIDAYS } from '../constants';
import { supabase } from '../lib/supabase';
import { fromISODate } from '../lib/dateUtils';

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
  syncFromAccommodations: (accommodations: HotelReservation[], tripId: string) => void;
  syncHolidays: () => void;
  syncActivitiesFromSupabase: (tripId: string) => Promise<void>;
  syncAccommodationsFromSupabase: (tripId: string) => Promise<void>;
  syncTransportsFromSupabase: (tripId: string) => Promise<void>;

  // Deletion functions
  deleteEventsByActivityId: (activityId: string) => Promise<void>;
  deleteEventsByTransportId: (transportId: string) => Promise<void>;
  deleteEventsByAccommodationId: (accommodationId: string) => Promise<void>;

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

  const mapTransportType = useCallback((type: string): CalendarEvent['type'] => {
    const typeMap: Record<string, CalendarEvent['type']> = {
      flight: 'flight',
      train: 'train',
      bus: 'bus',
      ferry: 'ferry',
      transfer: 'transfer',
      car: 'transport', // 'car' not in CalendarEventType, mapping to generic transport
    };
    return typeMap[type] || 'transport';
  }, []);

  const loadEvents = useCallback(() => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(`porai_calendar_events_${user?.id || 'guest'}`);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Deduplicate events by ID
        const uniqueEvents = parsed.filter((event: CalendarEvent, index: number, self: CalendarEvent[]) =>
          index === self.findIndex((t) => t.id === event.id)
        );

        // Deduplicate Trip Events (Ghost cleanup)
        // Keep only the most recently updated event for each trip start/end if multiple exist
        const cleanedEvents: CalendarEvent[] = [];
        const seenTripEvents = new Set<string>();

        uniqueEvents.forEach((event: CalendarEvent) => {
          if (event.type === 'trip') {
            // Create a unique key for trip events based on tripId and title (Start vs End)
            const key = `${event.tripId}-${event.title}`;
            if (seenTripEvents.has(key)) return;
            seenTripEvents.add(key);
            cleanedEvents.push(event);
          } else {
            cleanedEvents.push(event);
          }
        });

        setEvents(cleanedEvents);
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

  const syncFromTrips = useCallback((trips: Trip[]) => {
    setEvents(prev => {
      // Remove ALL existing trip start/end events (Embarque/Retorno) for the trips being synced
      // We no longer create these events as per user preference
      const tripIds = new Set(trips.map(t => t.id));
      const filteredEvents = prev.filter(e =>
        !(e.type === 'trip' && tripIds.has(e.tripId))
      );

      // Simply save the filtered events without adding new trip start/end events
      if (filteredEvents.length !== prev.length) {
        saveEvents(filteredEvents);
        return filteredEvents;
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
          endDate: transport.arrivalDate,
          startTime: transport.departureTime,
          endTime: transport.arrivalTime,
          allDay: false,
          type: mapTransportType(transport.type),
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

  // Sync from accommodations
  const syncFromAccommodations = useCallback((accommodations: HotelReservation[], tripId: string) => {
    setEvents(prev => {
      let currentEvents = [...prev];
      const now = new Date().toISOString();
      let hasChanges = false;

      accommodations.forEach(acc => {
        // Check-in Event
        const checkInId = `acc_checkin_${acc.id}`;
        const existingCheckInIndex = currentEvents.findIndex(e => e.id === checkInId);

        const checkInEvent: CalendarEvent = {
          id: checkInId,
          title: `Check-in: ${acc.name}`,
          description: acc.address,
          startDate: acc.checkIn, // Assumes DD/MM/YYYY or YYYY-MM-DD
          startTime: acc.checkInTime || '14:00',
          endTime: calculateEndTime(acc.checkInTime || '14:00', 60),
          allDay: false,
          type: 'accommodation',
          tripId: tripId,
          accommodationId: acc.id,
          location: acc.address,
          completed: acc.status === 'confirmed',
          createdAt: existingCheckInIndex >= 0 ? currentEvents[existingCheckInIndex].createdAt : now,
          updatedAt: now,
        };

        if (existingCheckInIndex >= 0) {
          // Update existing
          const existing = currentEvents[existingCheckInIndex];
          if (
            existing.title !== checkInEvent.title ||
            existing.startTime !== checkInEvent.startTime ||
            existing.startDate !== checkInEvent.startDate ||
            existing.description !== checkInEvent.description ||
            existing.completed !== checkInEvent.completed
          ) {
            currentEvents[existingCheckInIndex] = checkInEvent;
            hasChanges = true;
          }
        } else {
          // Add new
          currentEvents.push(checkInEvent);
          hasChanges = true;
        }

        // Check-out Event
        const checkOutId = `acc_checkout_${acc.id}`;
        const existingCheckOutIndex = currentEvents.findIndex(e => e.id === checkOutId);

        const checkOutEvent: CalendarEvent = {
          id: checkOutId,
          title: `Check-out: ${acc.name}`,
          description: acc.address,
          startDate: acc.checkOut,
          startTime: acc.checkOutTime || '11:00',
          endTime: calculateEndTime(acc.checkOutTime || '11:00', 60),
          allDay: false,
          type: 'accommodation',
          tripId: tripId,
          accommodationId: acc.id,
          location: acc.address,
          completed: acc.status === 'confirmed',
          createdAt: existingCheckOutIndex >= 0 ? currentEvents[existingCheckOutIndex].createdAt : now,
          updatedAt: now,
        };

        if (existingCheckOutIndex >= 0) {
          // Update existing
          const existing = currentEvents[existingCheckOutIndex];
          if (
            existing.title !== checkOutEvent.title ||
            existing.startTime !== checkOutEvent.startTime ||
            existing.startDate !== checkOutEvent.startDate ||
            existing.description !== checkOutEvent.description
          ) {
            currentEvents[existingCheckOutIndex] = checkOutEvent;
            hasChanges = true;
          }
        } else {
          // Add new
          currentEvents.push(checkOutEvent);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        saveEvents(currentEvents);
        return currentEvents;
      }
      return prev;
    });
  }, [calculateEndTime, saveEvents]);

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

    // Skip sync for temporary/invalid trip IDs (not a valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!tripId || !uuidRegex.test(tripId)) {
      console.warn('syncActivitiesFromSupabase: Skipping invalid tripId:', tripId);
      return;
    }

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

  // Sync accommodations directly from Supabase
  const syncAccommodationsFromSupabase = useCallback(async (tripId: string) => {
    if (!user) return;

    // Skip sync for temporary/invalid trip IDs (not a valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!tripId || !uuidRegex.test(tripId)) {
      console.warn('syncAccommodationsFromSupabase: Skipping invalid tripId:', tripId);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', tripId)
        .order('check_in', { ascending: true });

      if (error) {
        console.error('Error fetching accommodations from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const accommodations: HotelReservation[] = data.map(row => ({
          id: row.id,
          name: row.name,
          address: row.address,
          image: row.image,
          rating: Number(row.rating),
          nights: row.nights,
          checkIn: fromISODate(row.check_in),
          checkInTime: row.check_in_time,
          checkOut: fromISODate(row.check_out),
          checkOutTime: row.check_out_time,
          confirmation: row.confirmation_code,
          status: row.status as 'confirmed' | 'pending' | 'cancelled',
          stars: Number(row.stars),
          type: row.type as 'hotel' | 'home',
          cityId: row.city_id
        }));

        syncFromAccommodations(accommodations, tripId);
      }
    } catch (err) {
      console.error('Error syncing accommodations from Supabase:', err);
    }
  }, [user, syncFromAccommodations]);

  // Sync transports directly from Supabase
  const syncTransportsFromSupabase = useCallback(async (tripId: string) => {
    if (!user) return;

    // Skip sync for temporary/invalid trip IDs (not a valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!tripId || !uuidRegex.test(tripId)) {
      console.warn('syncTransportsFromSupabase: Skipping invalid tripId:', tripId);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transports')
        .select('*')
        .eq('trip_id', tripId)
        .order('departure_date', { ascending: true });

      if (error) {
        console.error('Error fetching transports from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const transports: Transport[] = data.map(row => ({
          id: row.id,
          type: row.type,
          operator: row.operator,
          reference: row.reference,
          departureLocation: row.departure_location,
          departureCity: row.departure_city,
          departureDate: fromISODate(row.departure_date),
          departureTime: row.departure_time,
          arrivalLocation: row.arrival_location,
          arrivalCity: row.arrival_city,
          arrivalDate: fromISODate(row.arrival_date),
          arrivalTime: row.arrival_time,
          duration: row.duration,
          class: row.class,
          seat: row.seat,
          vehicle: row.vehicle,
          status: row.status,
          confirmation: row.reference,
          route: `${row.departure_city || row.departure_location} → ${row.arrival_city || row.arrival_location}`
        }));

        syncFromTransports(transports, tripId);
      }
    } catch (err) {
      console.error('Error syncing transports from Supabase:', err);
    }
  }, [user, syncFromTransports]);

  // Deletion logic
  const deleteEventsByActivityId = useCallback(async (activityId: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.activityId !== activityId);
      if (updated.length !== prev.length) {
        saveEvents(updated);
      }
      return updated;
    });
  }, [saveEvents]);

  const deleteEventsByTransportId = useCallback(async (transportId: string) => {
    setEvents(prev => {
      // Deleting by transportId or ID reference (since we generate IDs like transport_ID)
      const updated = prev.filter(e => e.transportId !== transportId && e.id !== `transport_${transportId}`);
      if (updated.length !== prev.length) {
        saveEvents(updated);
      }
      return updated;
    });
  }, [saveEvents]);

  const deleteEventsByAccommodationId = useCallback(async (accommodationId: string) => {
    setEvents(prev => {
      // Deleting checkin/checkout events
      const updated = prev.filter(e => e.accommodationId !== accommodationId && !e.id.includes(accommodationId));
      if (updated.length !== prev.length) {
        saveEvents(updated);
      }
      return updated;
    });
  }, [saveEvents]);

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
    syncFromAccommodations,
    syncHolidays,
    syncActivitiesFromSupabase,
    syncAccommodationsFromSupabase,
    syncTransportsFromSupabase,
    deleteEventsByActivityId,
    deleteEventsByTransportId,
    deleteEventsByAccommodationId,
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
    syncFromAccommodations,
    syncHolidays,
    syncActivitiesFromSupabase,
    syncAccommodationsFromSupabase,
    syncTransportsFromSupabase,
    deleteEventsByActivityId,
    deleteEventsByTransportId,
    deleteEventsByAccommodationId,
    isLoading,
  ]);

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
