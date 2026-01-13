import * as React from 'react';

// ========== TYPES ==========
export interface AgendaEvent {
    id: string;
    title: string;
    subtitle?: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'transfer' | 'meal' | 'sightseeing' | 'accommodation' | 'activity' | 'holiday' | 'nightlife' | 'culture' | 'nature' | 'shopping' | 'restaurant';
    color?: string; // Optional legacy field
    icon?: string; // Material symbol icon name
    location?: string;
    status?: 'on_time' | 'delayed' | 'cancelled';
    image?: string; // Legacy field (not used in compact design)
    route?: { from: string; to: string }; // For transport
    holidayType?: 'nacional' | 'facultativo'; // For holidays
}

interface DayAgendaProps {
    date: Date;
    onClose: () => void;
    events?: AgendaEvent[];
}

// ========== EXPANDED AGENDA CARD (UNIFIED COLORFUL STYLE) ==========
// This component applies the premium "colorful banner" style to ALL event types.
interface ExpandedAgendaCardProps {
    event: AgendaEvent;
}

// Config for each event type
const cardConfig: Record<string, { gradientFrom: string; gradientTo: string; border: string; iconBg: string; iconText: string; titleText: string; badgeBg: string; badgeText: string; icon: string; badgeLabel: string }> = {
    // Holiday (Nacional)
    'holiday-nacional': {
        gradientFrom: 'from-emerald-50', gradientTo: 'to-emerald-100', border: 'border-emerald-200',
        iconBg: 'bg-emerald-200', iconText: 'text-emerald-700', titleText: 'text-emerald-800',
        badgeBg: 'bg-emerald-200', badgeText: 'text-emerald-700', icon: 'celebration',
        badgeLabel: 'Feriado Nacional'
    },
    // Holiday (Facultativo)
    'holiday-facultativo': {
        gradientFrom: 'from-amber-50', gradientTo: 'to-amber-100', border: 'border-amber-200',
        iconBg: 'bg-amber-200', iconText: 'text-amber-700', titleText: 'text-amber-800',
        badgeBg: 'bg-amber-200', badgeText: 'text-amber-700', icon: 'celebration',
        badgeLabel: 'Ponto Facultativo'
    },
    // Transports (Violet)
    flight: {
        gradientFrom: 'from-violet-50', gradientTo: 'to-violet-100', border: 'border-violet-200',
        iconBg: 'bg-violet-200', iconText: 'text-violet-700', titleText: 'text-violet-800',
        badgeBg: 'bg-violet-200', badgeText: 'text-violet-700', icon: 'flight',
        badgeLabel: 'Voo'
    },
    train: {
        gradientFrom: 'from-violet-50', gradientTo: 'to-violet-100', border: 'border-violet-200',
        iconBg: 'bg-violet-200', iconText: 'text-violet-700', titleText: 'text-violet-800',
        badgeBg: 'bg-violet-200', badgeText: 'text-violet-700', icon: 'train',
        badgeLabel: 'Trem'
    },
    bus: {
        gradientFrom: 'from-violet-50', gradientTo: 'to-violet-100', border: 'border-violet-200',
        iconBg: 'bg-violet-200', iconText: 'text-violet-700', titleText: 'text-violet-800',
        badgeBg: 'bg-violet-200', badgeText: 'text-violet-700', icon: 'directions_bus',
        badgeLabel: 'Ônibus'
    },
    car: {
        gradientFrom: 'from-violet-50', gradientTo: 'to-violet-100', border: 'border-violet-200',
        iconBg: 'bg-violet-200', iconText: 'text-violet-700', titleText: 'text-violet-800',
        badgeBg: 'bg-violet-200', badgeText: 'text-violet-700', icon: 'directions_car',
        badgeLabel: 'Carro'
    },
    ferry: {
        gradientFrom: 'from-violet-50', gradientTo: 'to-violet-100', border: 'border-violet-200',
        iconBg: 'bg-violet-200', iconText: 'text-violet-700', titleText: 'text-violet-800',
        badgeBg: 'bg-violet-200', badgeText: 'text-violet-700', icon: 'directions_boat',
        badgeLabel: 'Balsa'
    },
    transfer: {
        gradientFrom: 'from-violet-50', gradientTo: 'to-violet-100', border: 'border-violet-200',
        iconBg: 'bg-violet-200', iconText: 'text-violet-700', titleText: 'text-violet-800',
        badgeBg: 'bg-violet-200', badgeText: 'text-violet-700', icon: 'airport_shuttle',
        badgeLabel: 'Transfer'
    },
    // Meal (Orange)
    meal: {
        gradientFrom: 'from-orange-50', gradientTo: 'to-orange-100', border: 'border-orange-200',
        iconBg: 'bg-orange-200', iconText: 'text-orange-700', titleText: 'text-orange-800',
        badgeBg: 'bg-orange-200', badgeText: 'text-orange-700', icon: 'restaurant',
        badgeLabel: 'Refeição'
    },
    // Accommodation (Teal)
    accommodation: {
        gradientFrom: 'from-teal-50', gradientTo: 'to-teal-100', border: 'border-teal-200',
        iconBg: 'bg-teal-200', iconText: 'text-teal-700', titleText: 'text-teal-800',
        badgeBg: 'bg-teal-200', badgeText: 'text-teal-700', icon: 'hotel',
        badgeLabel: 'Hospedagem'
    },
    // Sightseeing (Amber)
    sightseeing: {
        gradientFrom: 'from-sky-50', gradientTo: 'to-sky-100', border: 'border-sky-200',
        iconBg: 'bg-sky-200', iconText: 'text-sky-700', titleText: 'text-sky-800',
        badgeBg: 'bg-sky-200', badgeText: 'text-sky-700', icon: 'photo_camera',
        badgeLabel: 'Passeio'
    },
    // Generic Activity (Slate)
    activity: {
        gradientFrom: 'from-slate-50', gradientTo: 'to-slate-100', border: 'border-slate-200',
        iconBg: 'bg-slate-200', iconText: 'text-slate-700', titleText: 'text-slate-800',
        badgeBg: 'bg-slate-200', badgeText: 'text-slate-700', icon: 'calendar_today',
        badgeLabel: 'Atividade'
    },
    // Nightlife (Pink/Fuchsia)
    nightlife: {
        gradientFrom: 'from-fuchsia-50', gradientTo: 'to-fuchsia-100', border: 'border-fuchsia-200',
        iconBg: 'bg-fuchsia-200', iconText: 'text-fuchsia-700', titleText: 'text-fuchsia-800',
        badgeBg: 'bg-fuchsia-200', badgeText: 'text-fuchsia-700', icon: 'nightlife',
        badgeLabel: 'Vida Noturna'
    },
    // Culture (Indigo)
    culture: {
        gradientFrom: 'from-indigo-50', gradientTo: 'to-indigo-100', border: 'border-indigo-200',
        iconBg: 'bg-indigo-200', iconText: 'text-indigo-700', titleText: 'text-indigo-800',
        badgeBg: 'bg-indigo-200', badgeText: 'text-indigo-700', icon: 'museum',
        badgeLabel: 'Cultura'
    },
    // Nature (Green)
    nature: {
        gradientFrom: 'from-green-50', gradientTo: 'to-green-100', border: 'border-green-200',
        iconBg: 'bg-green-200', iconText: 'text-green-700', titleText: 'text-green-800',
        badgeBg: 'bg-green-200', badgeText: 'text-green-700', icon: 'park',
        badgeLabel: 'Natureza'
    },
    // Shopping (Rose)
    shopping: {
        gradientFrom: 'from-rose-50', gradientTo: 'to-rose-100', border: 'border-rose-200',
        iconBg: 'bg-rose-200', iconText: 'text-rose-700', titleText: 'text-rose-800',
        badgeBg: 'bg-rose-200', badgeText: 'text-rose-700', icon: 'shopping_bag',
        badgeLabel: 'Compras'
    },
    // Restaurant (Orange - same as meal)
    restaurant: {
        gradientFrom: 'from-orange-50', gradientTo: 'to-orange-100', border: 'border-orange-200',
        iconBg: 'bg-orange-200', iconText: 'text-orange-700', titleText: 'text-orange-800',
        badgeBg: 'bg-orange-200', badgeText: 'text-orange-700', icon: 'restaurant',
        badgeLabel: 'Restaurante'
    },
};

const ExpandedAgendaCard: React.FC<ExpandedAgendaCardProps> = ({ event }) => {
    // Determine config key
    let configKey = event.type as string;
    if (event.type === 'holiday') {
        configKey = `holiday-${event.holidayType || 'nacional'}`;
    }
    const config = cardConfig[configKey] || cardConfig['activity'];
    const icon = event.icon || config.icon;

    // Build subtitle from location or route
    const subtitle = event.route
        ? `${event.route.from} → ${event.route.to}`
        : event.location || event.subtitle || '';

    const isAllDay = event.startTime === '00:00' && event.endTime === '23:59';

    return (
        <div className={`rounded-xl p-4 border bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} ${config.border} hover:shadow-md transition-shadow cursor-pointer`}>
            <div className="flex items-center gap-3">
                <div className={`size-12 rounded-xl flex items-center justify-center ${config.iconBg} ${config.iconText}`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-base ${config.titleText} truncate`}>
                        {event.title}
                    </h4>
                    {subtitle && (
                        <p className={`text-xs ${config.iconText} opacity-80 truncate`}>{subtitle}</p>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 ${config.badgeBg} ${config.badgeText}`}>
                        <span className="material-symbols-outlined text-xs">event</span>
                        {config.badgeLabel}
                    </span>
                </div>
                {/* Time display */}
                {!isAllDay && (
                    <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${config.titleText}`}>{event.startTime}</p>
                        <p className={`text-xs ${config.iconText} opacity-70`}>{event.endTime}</p>
                    </div>
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

    // Check if any event is a holiday for header icon styling
    const hasHoliday = events.some(e => e.type === 'holiday');
    const holidayEvent = events.find(e => e.type === 'holiday');
    const isNacionalHoliday = holidayEvent?.holidayType === 'nacional';

    const totalItems = events.length;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center ${hasHoliday
                        ? isNacionalHoliday
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-amber-100 text-amber-600'
                        : 'bg-primary-light text-primary-dark'
                        }`}>
                        <span className="material-symbols-outlined">
                            {hasHoliday ? 'celebration' : 'calendar_today'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main text-lg capitalize">{formatDate(date)}</h3>
                        <p className="text-text-muted text-sm">
                            {totalItems} {totalItems === 1 ? 'evento agendado' : 'eventos agendados'}
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
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">event_busy</span>
                        <p className="text-sm">Nenhum evento para este dia.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <ExpandedAgendaCard key={event.id} event={event} />
                    ))
                )}
            </div>
        </div>
    );
};

export default DayAgenda;
