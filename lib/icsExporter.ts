import { CalendarEvent } from '../types';

/**
 * Formats a date to iCalendar format (YYYYMMDD or YYYYMMDDTHHmmss)
 */
const formatICalDate = (dateStr: string, timeStr?: string, isAllDay: boolean = false): string => {
  // Parse DD/MM/YYYY or YYYY-MM-DD
  let date: Date;

  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }

  if (isAllDay) {
    // All-day events use just the date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // Events with time
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hour}${minute}${second}`;
};

/**
 * Escapes special characters for iCalendar format
 */
const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generates a UID for the event
 */
const generateUID = (event: CalendarEvent): string => {
  return `${event.id}@porai-app.com`;
};

/**
 * Converts a single CalendarEvent to iCalendar VEVENT format
 */
const eventToICS = (event: CalendarEvent): string => {
  const lines: string[] = [];

  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${generateUID(event)}`);
  lines.push(`DTSTAMP:${formatICalDate(new Date().toISOString().split('T')[0], new Date().toTimeString().slice(0, 5), false)}`);

  // Start date/time
  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(event.startDate, undefined, true)}`);

    // End date for all-day events (must be next day in iCal format)
    const endDate = event.endDate || event.startDate;
    const parsedEndDate = endDate.includes('/')
      ? new Date(endDate.split('/').reverse().join('-'))
      : new Date(endDate);
    parsedEndDate.setDate(parsedEndDate.getDate() + 1);
    const formattedEndDate = `${parsedEndDate.getFullYear()}${String(parsedEndDate.getMonth() + 1).padStart(2, '0')}${String(parsedEndDate.getDate()).padStart(2, '0')}`;
    lines.push(`DTEND;VALUE=DATE:${formattedEndDate}`);
  } else {
    lines.push(`DTSTART:${formatICalDate(event.startDate, event.startTime, false)}`);
    lines.push(`DTEND:${formatICalDate(event.endDate || event.startDate, event.endTime || event.startTime, false)}`);
  }

  // Title
  lines.push(`SUMMARY:${escapeICalText(event.title)}`);

  // Description
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  // Location
  if (event.location) {
    const locationStr = event.locationDetail
      ? `${event.location} - ${event.locationDetail}`
      : event.location;
    lines.push(`LOCATION:${escapeICalText(locationStr)}`);
  }

  // Status
  lines.push(`STATUS:${event.completed ? 'COMPLETED' : 'CONFIRMED'}`);

  // Categories (event type)
  lines.push(`CATEGORIES:${event.type}`);

  // Alarm/Reminder
  if (event.reminder && event.reminder > 0) {
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Lembrete: ${escapeICalText(event.title)}`);
    lines.push(`TRIGGER:-PT${event.reminder}M`);
    lines.push('END:VALARM');
  }

  lines.push('END:VEVENT');

  return lines.join('\r\n');
};

/**
 * Exports events to iCalendar (.ics) format
 */
export const exportToICS = (events: CalendarEvent[], filename: string = 'porai-calendar.ics'): void => {
  const lines: string[] = [];

  // Header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//PorAí App//Calendar Export//PT');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:PorAí - Minhas Viagens');
  lines.push('X-WR-TIMEZONE:America/Sao_Paulo');
  lines.push('X-WR-CALDESC:Calendário exportado do app PorAí');

  // Events
  events.forEach(event => {
    lines.push(eventToICS(event));
  });

  // Footer
  lines.push('END:VCALENDAR');

  // Create blob and download
  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports a single event to iCalendar format
 */
export const exportSingleEventToICS = (event: CalendarEvent): void => {
  const filename = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  exportToICS([event], filename);
};

/**
 * Generates Google Calendar URL for adding an event
 */
export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
  const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';

  const params = new URLSearchParams();
  params.append('text', event.title);

  if (event.description) {
    params.append('details', event.description);
  }

  if (event.location) {
    const locationStr = event.locationDetail
      ? `${event.location}, ${event.locationDetail}`
      : event.location;
    params.append('location', locationStr);
  }

  // Format dates for Google Calendar
  if (event.allDay) {
    const startDate = formatICalDate(event.startDate, undefined, true);
    const endDate = event.endDate
      ? formatICalDate(event.endDate, undefined, true)
      : startDate;
    params.append('dates', `${startDate}/${endDate}`);
  } else {
    const startDateTime = formatICalDate(event.startDate, event.startTime, false);
    const endDateTime = formatICalDate(
      event.endDate || event.startDate,
      event.endTime || event.startTime,
      false
    );
    params.append('dates', `${startDateTime}/${endDateTime}`);
  }

  return `${baseUrl}&${params.toString()}`;
};

/**
 * Opens Google Calendar to add an event
 */
export const addToGoogleCalendar = (event: CalendarEvent): void => {
  const url = getGoogleCalendarUrl(event);
  window.open(url, '_blank', 'noopener,noreferrer');
};
