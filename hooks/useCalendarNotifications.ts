import { useEffect } from 'react';
import { CalendarEvent } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook for managing calendar event notifications
 */
export const useCalendarNotifications = (events: CalendarEvent[]) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Check for upcoming events every minute
    const checkInterval = setInterval(() => {
      checkUpcomingEvents();
    }, 60000); // Every 1 minute

    // Initial check
    checkUpcomingEvents();

    return () => clearInterval(checkInterval);
  }, [events]);

  const checkUpcomingEvents = () => {
    const now = new Date();
    const currentTime = now.getTime();

    events.forEach(event => {
      // Skip completed events
      if (event.completed) return;

      // Skip events without reminder
      if (!event.reminder || event.reminder === 0) return;

      // Parse event date and time
      const eventDateTime = parseEventDateTime(event);
      if (!eventDateTime) return;

      // Calculate reminder time
      const reminderTime = eventDateTime.getTime() - (event.reminder * 60 * 1000);

      // Check if we should send notification
      // Window: between reminder time and 1 minute after
      if (currentTime >= reminderTime && currentTime <= reminderTime + 60000) {
        // Check if notification was already sent (using localStorage)
        const notificationKey = `calendar_notification_${event.id}_${reminderTime}`;

        if (typeof window !== 'undefined') {
          const alreadySent = window.localStorage.getItem(notificationKey);

          if (!alreadySent) {
            sendEventNotification(event, eventDateTime);
            window.localStorage.setItem(notificationKey, 'sent');
          }
        }
      }
    });
  };

  const parseEventDateTime = (event: CalendarEvent): Date | null => {
    try {
      // Parse date
      let date: Date;

      if (event.startDate.includes('/')) {
        const [day, month, year] = event.startDate.split('/').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(event.startDate);
      }

      // Add time if not all-day event
      if (!event.allDay && event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      }

      return date;
    } catch {
      return null;
    }
  };

  const sendEventNotification = (event: CalendarEvent, eventDateTime: Date) => {
    const timeUntilEvent = eventDateTime.getTime() - Date.now();
    const minutesUntil = Math.round(timeUntilEvent / 60000);

    let timeText = '';
    if (minutesUntil < 60) {
      timeText = `em ${minutesUntil} minuto${minutesUntil !== 1 ? 's' : ''}`;
    } else if (minutesUntil < 1440) {
      const hours = Math.floor(minutesUntil / 60);
      timeText = `em ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutesUntil / 1440);
      timeText = `em ${days} dia${days !== 1 ? 's' : ''}`;
    }

    // Create in-app notification
    addNotification({
      type: 'itinerary_reminder',
      title: `🔔 Lembrete: ${event.title}`,
      message: `Seu evento "${event.title}" acontece ${timeText}${event.location ? ` em ${event.location}` : ''}.`,
      tripId: event.tripId,
    });

    // Browser notification (if permission granted)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🔔 Lembrete: ${event.title}`, {
          body: `Acontece ${timeText}${event.location ? ` em ${event.location}` : ''}`,
          icon: '/icon-192x192.png',
          tag: event.id,
          requireInteraction: false,
        });
      } else if (Notification.permission !== 'denied') {
        // Request permission
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`🔔 Lembrete: ${event.title}`, {
              body: `Acontece ${timeText}${event.location ? ` em ${event.location}` : ''}`,
              icon: '/icon-192x192.png',
              tag: event.id,
              requireInteraction: false,
            });
          }
        });
      }
    }
  };

  return {
    checkUpcomingEvents,
  };
};

/**
 * Hook to request notification permission
 */
export const useNotificationPermission = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Request permission after a short delay (better UX)
        setTimeout(() => {
          Notification.requestPermission();
        }, 5000);
      }
    }
  }, []);
};
