import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import { useCalendar } from '../../contexts/CalendarContext';

interface WeekViewProps {
  currentDate: Date;
  onDateClick?: (date: Date, time?: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, onDateClick, onEventClick }) => {
  const { getEventsForDate } = useCalendar();
  const [startHour] = useState(6);
  const [endHour] = useState(23);

  // Get the start of the week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.getFullYear(), date.getMonth(), diff);
  };

  const weekStart = getWeekStart(currentDate);
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Generate days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  // Generate hours
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } => {
    const startMinutes = event.startTime ? timeToMinutes(event.startTime) : startHour * 60;
    const endMinutes = event.endTime ? timeToMinutes(event.endTime) : startMinutes + 60;

    const startOffset = startHour * 60;
    const hourHeight = 60; // pixels per hour

    const top = ((startMinutes - startOffset) / 60) * hourHeight;
    const height = ((endMinutes - startMinutes) / 60) * hourHeight;

    return { top, height: Math.max(height, 40) };
  };

  const getEventColor = (type: CalendarEvent['type']): string => {
    const colors: Record<string, string> = {
      trip: 'bg-blue-100 border-blue-300 text-blue-700',
      flight: 'bg-violet-100 border-violet-300 text-violet-700',
      train: 'bg-purple-100 border-purple-300 text-purple-700',
      bus: 'bg-indigo-100 border-indigo-300 text-indigo-700',
      transfer: 'bg-gray-100 border-gray-300 text-gray-700',
      ferry: 'bg-teal-100 border-teal-300 text-teal-700',
      accommodation: 'bg-emerald-100 border-emerald-300 text-emerald-700',
      meal: 'bg-orange-100 border-orange-300 text-orange-700',
      restaurant: 'bg-amber-100 border-amber-300 text-amber-700',
      sightseeing: 'bg-yellow-100 border-yellow-300 text-yellow-700',
      culture: 'bg-pink-100 border-pink-300 text-pink-700',
      nature: 'bg-green-100 border-green-300 text-green-700',
      shopping: 'bg-cyan-100 border-cyan-300 text-cyan-700',
      task: 'bg-gray-100 border-gray-300 text-gray-700',
      activity: 'bg-blue-100 border-blue-300 text-blue-700',
      other: 'bg-gray-100 border-gray-300 text-gray-700',
    };
    return colors[type] || colors.other;
  };

  const getEventIcon = (type: CalendarEvent['type']): string => {
    const icons: Record<string, string> = {
      trip: 'luggage',
      flight: 'flight',
      train: 'train',
      bus: 'directions_bus',
      transfer: 'local_taxi',
      ferry: 'directions_boat',
      accommodation: 'hotel',
      meal: 'restaurant',
      restaurant: 'restaurant_menu',
      sightseeing: 'photo_camera',
      culture: 'museum',
      nature: 'forest',
      shopping: 'shopping_bag',
      task: 'check_circle',
      activity: 'local_activity',
      other: 'event',
    };
    return icons[type] || 'event';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    onDateClick?.(day, time);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft overflow-hidden">
      {/* Header - Days of Week */}
      <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="p-4 border-r border-gray-200">
          {/* Empty cell for time column */}
        </div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${isToday(day) ? 'bg-primary-light' : ''
              }`}
          >
            <div className="text-xs font-bold text-text-muted uppercase">
              {daysOfWeek[index]}
            </div>
            <div
              className={`text-lg font-bold mt-1 ${isToday(day) ? 'text-primary-dark' : 'text-text-main'
                }`}
            >
              {formatDate(day)}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 relative">
          {/* Time Column */}
          <div className="border-r border-gray-200">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-gray-100 px-2 py-1 text-right"
              >
                <span className="text-xs font-semibold text-text-muted">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="relative border-r border-gray-200 last:border-r-0">
              {/* Hour slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  onClick={() => handleTimeSlotClick(day, hour)}
                  className="h-[60px] border-b border-gray-100 hover:bg-primary-light/30 cursor-pointer transition-colors"
                />
              ))}

              {/* Events */}
              <div className="absolute inset-0 pointer-events-none">
                {getEventsForDate(day).map((event) => {
                  if (event.allDay) return null; // Skip all-day events in time grid

                  const { top, height } = getEventPosition(event);
                  const colorClass = getEventColor(event.type);

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 cursor-pointer hover:shadow-md transition-all pointer-events-auto ${colorClass}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        zIndex: 5,
                      }}
                    >
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[14px]">
                            {getEventIcon(event.type)}
                          </span>
                          <div className="text-xs font-bold truncate">
                            {event.startTime} {event.title}
                          </div>
                        </div>
                        {height > 50 && event.location && (
                          <div className="text-[10px] opacity-80 truncate ml-5">
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All-day Events */}
      <div className="border-t border-gray-200 bg-background-light">
        <div className="grid grid-cols-8">
          <div className="p-2 border-r border-gray-200">
            <span className="text-xs font-bold text-text-muted">Dia Inteiro</span>
          </div>
          {weekDays.map((day, dayIndex) => {
            const allDayEvents = getEventsForDate(day).filter((e) => e.allDay);

            return (
              <div
                key={dayIndex}
                className="p-2 border-r border-gray-200 last:border-r-0 min-h-[60px]"
              >
                {allDayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`${getEventColor(event.type)} rounded-lg px-2 py-1 mb-1 cursor-pointer hover:shadow-sm transition-all text-xs font-bold truncate`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
