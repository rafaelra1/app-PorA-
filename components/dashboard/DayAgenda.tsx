import React from 'react';

interface AgendaEvent {
    id: string;
    title: string;
    subtitle?: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    color: string; // Tailwind bg color class
    avatar?: string;
    icon?: string; // Material symbol icon name
}

interface DayAgendaProps {
    date: Date;
    onClose: () => void;
    events?: AgendaEvent[];
}

const DayAgenda: React.FC<DayAgendaProps> = ({ date, onClose, events = [] }) => {
    // Helper to convert time string (HH:mm) to minutes from start of day (e.g., 00:00)
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Dynamic hour range based on events
    const calculateHourRange = () => {
        if (events.length === 0) {
            return { start: 8, end: 20 }; // Default range
        }

        const eventTimes = events
            .filter(e => e.startTime && e.endTime)
            .flatMap(e => [timeToMinutes(e.startTime), timeToMinutes(e.endTime)]);

        if (eventTimes.length === 0) {
            return { start: 8, end: 20 }; // Default if no timed events
        }

        const minMinutes = Math.min(...eventTimes);
        const maxMinutes = Math.max(...eventTimes);

        // Add 1 hour buffer before first event and after last event
        let startHour = Math.max(0, Math.floor(minMinutes / 60) - 1);
        let endHour = Math.min(23, Math.ceil(maxMinutes / 60) + 1);

        // Ensure minimum range of 8 hours
        if (endHour - startHour < 8) {
            const midpoint = Math.floor((startHour + endHour) / 2);
            startHour = Math.max(0, midpoint - 4);
            endHour = Math.min(23, midpoint + 4);
        }

        return { start: startHour, end: endHour };
    };

    const { start: startHour, end: endHour } = calculateHourRange();
    const hourHeight = 80; // Height in pixels for one hour
    const startMinutes = startHour * 60;

    // Generate hours for the timeline
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    // Helper to format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-soft animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary-light flex items-center justify-center text-primary-dark">
                        <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main text-lg capitalize">{formatDate(date)}</h3>
                        <p className="text-text-muted text-sm items-center flex gap-1">
                            {events.length} {events.length === 1 ? 'evento agendado' : 'eventos agendados'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="size-8 rounded-full bg-background-light hover:bg-gray-200 flex items-center justify-center text-text-muted transition-colors"
                >
                    <span className="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            {/* Timeline Container */}
            <div
                className="relative border-l border-dashed border-gray-200 ml-12"
                style={{ height: `${(endHour - startHour) * hourHeight}px` }}
            >
                {/* Hour markers */}
                {hours.map((hour) => (
                    <div
                        key={hour}
                        className="absolute w-full flex items-center"
                        style={{ top: `${(hour - startHour) * hourHeight}px` }}
                    >
                        <span className="absolute -left-12 text-xs font-semibold text-text-muted w-8 text-right">
                            {hour}:00
                        </span>
                        <div className="w-2 h-2 rounded-full bg-gray-200 -ml-[5px] ring-4 ring-white"></div>
                        <div className="w-full border-t border-dashed border-gray-100 ml-2"></div>
                    </div>
                ))}

                {/* Events */}
                {events.map((event) => {
                    const startTimeMinutes = timeToMinutes(event.startTime);
                    const endTimeMinutes = timeToMinutes(event.endTime);

                    // Calculate position and height
                    const top = ((startTimeMinutes - startMinutes) / 60) * hourHeight;
                    const height = ((endTimeMinutes - startTimeMinutes) / 60) * hourHeight;

                    // Minimal height visual fix - increased to fit 3 lines (Time, Title, Subtitle)
                    const displayHeight = Math.max(height, 85);

                    return (
                        <div
                            key={event.id}
                            className={`absolute left-4 right-0 rounded-3xl p-3.5 border shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start justify-between ${event.color}`}
                            style={{
                                top: `${top}px`,
                                height: `${displayHeight}px`,
                                // Make a bit narrower to not touch the right edge
                                width: 'calc(100% - 1.5rem)',
                                zIndex: 10 // Ensure it sits above grid lines
                            }}
                        >
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                <div className="flex items-center gap-1.5 mb-1 text-gray-600">
                                    {/* Icon based on color/context */}
                                    <span className="material-symbols-outlined text-sm">
                                        {event.title.toLowerCase().includes('voo') || event.title.toLowerCase().includes('embarque') ? 'flight' :
                                            event.title.toLowerCase().includes('restaurante') || event.subtitle?.toLowerCase().includes('restaurante') ? 'restaurant' :
                                                event.title.toLowerCase().includes('hotel') || event.title.toLowerCase().includes('check-in') ? 'hotel' :
                                                    'calendar_today'}
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {event.startTime} - {event.endTime}
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 leading-tight mb-0.5 truncate pr-2">{event.title}</h4>
                                {event.subtitle && (
                                    <p className="text-xs text-gray-500 leading-tight line-clamp-1">{event.subtitle}</p>
                                )}
                            </div>

                            {event.avatar && (
                                <img
                                    src={event.avatar}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover ml-2"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DayAgenda;
