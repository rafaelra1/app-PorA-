import * as React from 'react';
import { useMemo } from 'react';
import { ItineraryActivity } from '../../../types';
import { formatDate, parseDisplayDate } from '../../../lib/dateUtils';

interface MiniCalendarProps {
    tripStartDate: string;
    tripEndDate: string;
    activities: ItineraryActivity[];
    selectedDay: number | null;
    onDayClick: (dayNumber: number) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
    tripStartDate,
    tripEndDate,
    activities,
    selectedDay,
    onDayClick,
}) => {
    const months = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

    // Generate trip days
    const tripDays = useMemo(() => {
        if (!tripStartDate || !tripEndDate) return [];

        const startStr = tripStartDate.includes('/') ? parseDisplayDate(tripStartDate) : tripStartDate;
        const endStr = tripEndDate.includes('/') ? parseDisplayDate(tripEndDate) : tripEndDate;

        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        const days: { date: Date; dayNumber: number; dateStr: string }[] = [];

        let dayNumber = 1;
        const current = new Date(start);

        while (current <= end) {
            const dateStr = formatDate(current.toISOString().split('T')[0]);
            days.push({
                date: new Date(current),
                dayNumber,
                dateStr,
            });
            current.setDate(current.getDate() + 1);
            dayNumber++;
        }

        return days;
    }, [tripStartDate, tripEndDate]);

    // Group days by month for display
    const daysByMonth = useMemo(() => {
        const grouped: { month: string; year: number; days: typeof tripDays }[] = [];
        let currentMonth = '';
        let currentGroup: typeof tripDays = [];

        tripDays.forEach(day => {
            const monthKey = `${day.date.getMonth()}-${day.date.getFullYear()}`;
            if (monthKey !== currentMonth) {
                if (currentGroup.length > 0) {
                    const prevDate = currentGroup[0].date;
                    grouped.push({
                        month: months[prevDate.getMonth()],
                        year: prevDate.getFullYear(),
                        days: currentGroup,
                    });
                }
                currentMonth = monthKey;
                currentGroup = [day];
            } else {
                currentGroup.push(day);
            }
        });

        if (currentGroup.length > 0) {
            const prevDate = currentGroup[0].date;
            grouped.push({
                month: months[prevDate.getMonth()],
                year: prevDate.getFullYear(),
                days: currentGroup,
            });
        }

        return grouped;
    }, [tripDays]);

    // Count activities per day
    const activityCountByDay = useMemo(() => {
        const counts: Record<number, number> = {};
        tripDays.forEach(day => {
            const count = activities.filter(a => formatDate(a.date) === day.dateStr).length;
            counts[day.dayNumber] = count;
        });
        return counts;
    }, [activities, tripDays]);

    // Check if today is within trip dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getTodayDayNumber = () => {
        const todayDay = tripDays.find(d => {
            const dayDate = new Date(d.date);
            dayDate.setHours(0, 0, 0, 0);
            return dayDate.getTime() === today.getTime();
        });
        return todayDay?.dayNumber || null;
    };

    const todayDayNumber = getTodayDayNumber();

    if (tripDays.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-4">
            <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                Dias da Viagem
            </h3>

            {daysByMonth.map((monthGroup, monthIdx) => (
                <div key={`${monthGroup.month}-${monthGroup.year}`} className={monthIdx > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
                    {/* Month header */}
                    <div className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                        {monthGroup.month} {monthGroup.year}
                    </div>

                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {daysOfWeek.map((dow, idx) => (
                            <div key={idx} className="text-[10px] font-bold text-gray-400 text-center">
                                {dow}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Add empty cells for days before first day of month group */}
                        {(() => {
                            const firstDay = monthGroup.days[0];
                            const dayOfWeek = firstDay.date.getDay();
                            const emptyCells = [];
                            for (let i = 0; i < dayOfWeek; i++) {
                                emptyCells.push(
                                    <div key={`empty-${i}`} className="aspect-square" />
                                );
                            }
                            return emptyCells;
                        })()}

                        {monthGroup.days.map(day => {
                            const isSelected = selectedDay === day.dayNumber;
                            const isToday = todayDayNumber === day.dayNumber;
                            const activityCount = activityCountByDay[day.dayNumber] || 0;
                            const hasActivities = activityCount > 0;

                            return (
                                <button
                                    key={day.dayNumber}
                                    onClick={() => onDayClick(day.dayNumber)}
                                    className={`
                                        aspect-square rounded-lg flex flex-col items-center justify-center
                                        text-xs font-bold transition-all relative
                                        ${isSelected
                                            ? 'bg-purple-600 text-white shadow-md scale-105'
                                            : isToday
                                                ? 'bg-primary/10 text-primary ring-2 ring-primary/30'
                                                : 'hover:bg-gray-100 text-text-main'
                                        }
                                    `}
                                >
                                    <span>{day.date.getDate()}</span>
                                    {hasActivities && (
                                        <div className={`absolute bottom-0.5 flex gap-0.5 ${isSelected ? 'opacity-80' : ''}`}>
                                            {activityCount <= 3 ? (
                                                Array.from({ length: activityCount }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`size-1 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`}
                                                    />
                                                ))
                                            ) : (
                                                <div className={`text-[8px] font-bold ${isSelected ? 'text-white/80' : 'text-purple-600'}`}>
                                                    {activityCount}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
                    <div className="flex items-center gap-1">
                        <div className="size-3 rounded bg-purple-600"></div>
                        <span>Selecionado</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="size-3 rounded bg-primary/10 ring-1 ring-primary/30"></div>
                        <span>Hoje</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="size-1.5 rounded-full bg-purple-500"></div>
                        <span>Atividade</span>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-black text-text-main">{tripDays.length}</div>
                    <div className="text-[10px] text-text-muted font-medium">dias</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-black text-purple-600">{activities.length}</div>
                    <div className="text-[10px] text-text-muted font-medium">atividades</div>
                </div>
            </div>
        </div>
    );
};

export default MiniCalendar;
