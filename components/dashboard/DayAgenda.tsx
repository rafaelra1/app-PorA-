import * as React from 'react';

// ========== TYPES ==========
export interface AgendaEvent {
    id: string;
    title: string;
    subtitle?: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'transfer' | 'meal' | 'sightseeing' | 'accommodation' | 'activity';
    color?: string; // Optional legacy field
    icon?: string; // Material symbol icon name
    location?: string;
    status?: 'on_time' | 'delayed' | 'cancelled';
    image?: string; // Legacy field (not used in compact design)
    route?: { from: string; to: string }; // For transport
}

interface DayAgendaProps {
    date: Date;
    onClose: () => void;
    events?: AgendaEvent[];
}

// ========== COLOR MAPPING ==========
const getCardColors = (type: AgendaEvent['type']) => {
    const colorMap: Record<string, { bg: string; iconBg: string; iconText: string }> = {
        // Transports (Violet)
        flight: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
        train: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
        bus: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
        car: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
        ferry: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
        transfer: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
        // Meals (Orange)
        meal: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-600' },
        // Accommodation (Emerald)
        accommodation: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
        // Attractions/Sightseeing (Amber)
        sightseeing: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
        activity: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    };
    return colorMap[type] || { bg: 'bg-gray-50', iconBg: 'bg-gray-100', iconText: 'text-gray-600' };
};

// ========== ICON MAPPING ==========
const getIcon = (type: AgendaEvent['type'], customIcon?: string) => {
    if (customIcon) return customIcon;
    const iconMap: Record<string, string> = {
        flight: 'flight',
        train: 'train',
        bus: 'directions_bus',
        car: 'directions_car',
        ferry: 'directions_boat',
        transfer: 'airport_shuttle',
        meal: 'restaurant',
        sightseeing: 'photo_camera',
        accommodation: 'hotel',
        activity: 'calendar_today',
    };
    return iconMap[type] || 'calendar_today';
};

// ========== COMPACT AGENDA CARD ==========
const CompactAgendaCard: React.FC<{ event: AgendaEvent }> = ({ event }) => {
    const colors = getCardColors(event.type);
    const icon = getIcon(event.type, event.icon);

    const statusColors: Record<string, string> = {
        on_time: 'bg-green-100 text-green-700',
        delayed: 'bg-amber-100 text-amber-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    const statusLabels: Record<string, string> = {
        on_time: 'No Horário',
        delayed: 'Atrasado',
        cancelled: 'Cancelado',
    };

    // Build subtitle from location or route
    const subtitle = event.route
        ? `${event.route.from} → ${event.route.to}`
        : event.location || event.subtitle || '';

    return (
        <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${colors.bg} hover:shadow-sm transition-shadow cursor-pointer`}>
            {/* Icon (32x32) */}
            <div className={`size-8 rounded-lg ${colors.iconBg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-lg ${colors.iconText}`}>
                    {icon}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-gray-500">
                        {event.startTime} - {event.endTime}
                    </span>
                    {/* Status badge */}
                    {event.status && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${statusColors[event.status]}`}>
                            {statusLabels[event.status]}
                        </span>
                    )}
                </div>
                <h4 className="text-xs font-bold text-gray-900 truncate">{event.title}</h4>
                {subtitle && (
                    <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

// ========== MAIN COMPONENT ==========
const DayAgenda: React.FC<DayAgendaProps> = ({ date, onClose, events = [] }) => {
    const formatDate = (d: Date) => {
        return d.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary-light flex items-center justify-center text-primary-dark">
                        <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main text-lg capitalize">{formatDate(date)}</h3>
                        <p className="text-text-muted text-sm">
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

            {/* Event List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">event_busy</span>
                        <p className="text-sm">Nenhum evento para este dia.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <CompactAgendaCard key={event.id} event={event} />
                    ))
                )}
            </div>
        </div>
    );
};

export default DayAgenda;
