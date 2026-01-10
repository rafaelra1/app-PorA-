import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

interface ItineraryDayHeaderProps {
    dayNumber: number;
    date: Date;
    cityName?: string;
    activityCount: number;
    isExpanded: boolean;
    onToggle: () => void;
    isToday?: boolean;
}

// =============================================================================
// ItineraryDayHeader Component
// =============================================================================

const ItineraryDayHeader: React.FC<ItineraryDayHeaderProps> = ({
    dayNumber,
    date,
    cityName,
    activityCount,
    isExpanded,
    onToggle,
    isToday = false
}) => {
    const formatDate = (d: Date): string => {
        return d.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const getDayLabel = (): string => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        const diff = (compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

        if (diff === 0) return 'Hoje';
        if (diff === 1) return 'Amanhã';
        if (diff === -1) return 'Ontem';
        return `Dia ${dayNumber}`;
    };

    return (
        <div
            className={`
                relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer 
                transition-all duration-200 group
                ${isToday
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white hover:bg-gray-50 border border-gray-100'
                }
            `}
            onClick={onToggle}
        >
            {/* Day Number Circle */}
            <div className={`
                relative size-14 rounded-2xl flex flex-col items-center justify-center shrink-0
                ${isToday
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                }
            `}>
                <span className={`
                    text-2xl font-black leading-none
                    ${isToday ? 'text-white' : 'text-indigo-600'}
                `}>
                    {dayNumber}
                </span>
                <span className={`
                    text-[10px] font-bold uppercase tracking-wide
                    ${isToday ? 'text-white/80' : 'text-indigo-400'}
                `}>
                    Dia
                </span>

                {/* Today Pulse */}
                {isToday && (
                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-ping" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`
                        text-sm font-bold capitalize
                        ${isToday ? 'text-white' : 'text-text-main'}
                    `}>
                        {formatDate(date)}
                    </span>
                    {isToday && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 rounded-full">
                            {getDayLabel()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {cityName && (
                        <div className={`
                            flex items-center gap-1 text-xs font-medium
                            ${isToday ? 'text-white/80' : 'text-text-muted'}
                        `}>
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {cityName}
                        </div>
                    )}
                    <div className={`
                        flex items-center gap-1 text-xs font-medium
                        ${isToday ? 'text-white/80' : 'text-text-muted'}
                    `}>
                        <span className="material-symbols-outlined text-sm">event</span>
                        {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}
                    </div>
                </div>
            </div>

            {/* Expand/Collapse Arrow */}
            <div className={`
                size-10 rounded-xl flex items-center justify-center transition-all
                ${isToday
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-text-muted group-hover:bg-indigo-100 group-hover:text-indigo-600'
                }
            `}>
                <span className={`
                    material-symbols-outlined text-xl transition-transform duration-200
                    ${isExpanded ? 'rotate-180' : ''}
                `}>
                    expand_more
                </span>
            </div>
        </div>
    );
};

export default ItineraryDayHeader;
