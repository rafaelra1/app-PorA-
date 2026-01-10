import * as React from 'react';
import { Card } from '../../../ui/Base';
import { Transport, HotelReservation, ItineraryActivity } from '../../../../types';

// =============================================================================
// Types
// =============================================================================

interface TimelineWidgetProps {
    transports: Transport[];
    hotels: HotelReservation[];
    activities?: ItineraryActivity[];
    onNavigate?: () => void;
}

interface TimelineEvent {
    id: string;
    type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'task';
    title: string;
    subtitle: string;
    date: string;
    time: string;
    icon: string;
    color: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

const getEventConfig = (type: TimelineEvent['type']): { icon: string; color: string } => {
    const configs: Record<TimelineEvent['type'], { icon: string; color: string }> = {
        flight: { icon: 'flight_takeoff', color: 'bg-blue-100 text-blue-600' },
        hotel: { icon: 'hotel', color: 'bg-purple-100 text-purple-600' },
        activity: { icon: 'local_activity', color: 'bg-emerald-100 text-emerald-600' },
        restaurant: { icon: 'restaurant', color: 'bg-orange-100 text-orange-600' },
        task: { icon: 'task_alt', color: 'bg-gray-100 text-gray-600' }
    };
    return configs[type] || configs.task;
};

const parseDate = (dateStr: string): Date => {
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
};

const formatDateShort = (dateStr: string): string => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// =============================================================================
// TimelineWidget Component
// =============================================================================

const TimelineWidget: React.FC<TimelineWidgetProps> = ({
    transports,
    hotels,
    activities = [],
    onNavigate
}) => {
    // Combine all events into timeline
    const events = React.useMemo((): TimelineEvent[] => {
        const allEvents: TimelineEvent[] = [];

        // Add flights
        transports.filter(t => t.type === 'flight').forEach(t => {
            const config = getEventConfig('flight');
            allEvents.push({
                id: `transport-${t.id}`,
                type: 'flight',
                title: `${t.departureLocation?.split('(')[0]} → ${t.arrivalLocation?.split('(')[0]}`,
                subtitle: t.reference || 'Voo',
                date: t.departureDate,
                time: t.departureTime?.slice(0, 5) || '00:00',
                ...config
            });
        });

        // Add hotels (check-ins)
        hotels.forEach(h => {
            const config = getEventConfig('hotel');
            allEvents.push({
                id: `hotel-${h.id}`,
                type: 'hotel',
                title: h.name,
                subtitle: 'Check-in',
                date: h.checkIn,
                time: h.checkInTime || '14:00',
                ...config
            });
        });

        // Add activities
        activities.filter(a => !a.completed).forEach(a => {
            const type = a.type === 'food' ? 'restaurant' : 'activity';
            const config = getEventConfig(type);
            allEvents.push({
                id: `activity-${a.id}`,
                type,
                title: a.title,
                subtitle: a.location || 'Local a definir',
                date: a.date,
                time: a.time,
                ...config
            });
        });

        // Sort by date and time
        return allEvents.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            return a.time.localeCompare(b.time);
        }).slice(0, 5); // Only first 5 events
    }, [transports, hotels, activities]);

    return (
        <Card
            className="p-5 hover:shadow-lg transition-all cursor-pointer h-full"
            onClick={onNavigate}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-indigo-100 rounded-full">
                    Próximos Eventos
                </span>
                <span className="text-xs text-text-muted">{events.length} itens</span>
            </div>

            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_available</span>
                    <p className="text-sm text-text-muted">Nenhum evento programado</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100" />

                    {/* Events */}
                    <div className="space-y-3">
                        {events.map((event, index) => (
                            <div key={event.id} className="flex items-start gap-3 relative">
                                {/* Icon */}
                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${event.color}`}>
                                    <span className="material-symbols-outlined text-lg">{event.icon}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="text-sm font-semibold text-text-main truncate">{event.title}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                        <span>{formatDateShort(event.date)}</span>
                                        <span>•</span>
                                        <span>{event.time}</span>
                                    </div>
                                </div>

                                {/* First item badge */}
                                {index === 0 && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 rounded-full shrink-0">
                                        PRÓXIMO
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default TimelineWidget;
