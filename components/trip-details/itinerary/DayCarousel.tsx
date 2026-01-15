import * as React from 'react';
import { useMemo, useRef, useEffect } from 'react';
import { ItineraryActivity } from '../../../types';
import { formatDate, parseDisplayDate } from '../../../lib/dateUtils';

interface DayCarouselProps {
    tripStartDate: string;
    tripEndDate: string;
    activities: ItineraryActivity[];
    selectedDay: number | null;
    onDayClick: (dayNumber: number) => void;
    cities?: { name: string; arrivalDate: string | Date; departureDate: string | Date }[];
}

const DayCarousel: React.FC<DayCarouselProps> = ({
    tripStartDate,
    tripEndDate,
    activities,
    selectedDay,
    onDayClick,
    cities = [],
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLButtonElement>(null);

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Generate trip days
    const tripDays = useMemo(() => {
        if (!tripStartDate || !tripEndDate) return [];

        const startStr = tripStartDate.includes('/') ? parseDisplayDate(tripStartDate) : tripStartDate;
        const endStr = tripEndDate.includes('/') ? parseDisplayDate(tripEndDate) : tripEndDate;

        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        const days: {
            date: Date;
            dayNumber: number;
            dateStr: string;
            weekDay: string;
            dayOfMonth: number;
            month: string;
            city?: string;
        }[] = [];

        let dayNumber = 1;
        const current = new Date(start);

        while (current <= end) {
            const dateStr = formatDate(current.toISOString().split('T')[0]);

            // Find city for this day
            const currentCity = cities.find(c => {
                const arr = new Date(c.arrivalDate);
                const dep = new Date(c.departureDate);
                const currDate = new Date(current);
                currDate.setHours(0, 0, 0, 0);
                arr.setHours(0, 0, 0, 0);
                dep.setHours(0, 0, 0, 0);
                return currDate >= arr && currDate <= dep;
            });

            days.push({
                date: new Date(current),
                dayNumber,
                dateStr,
                weekDay: weekDays[current.getDay()],
                dayOfMonth: current.getDate(),
                month: months[current.getMonth()],
                city: currentCity?.name,
            });
            current.setDate(current.getDate() + 1);
            dayNumber++;
        }

        return days;
    }, [tripStartDate, tripEndDate, cities]);

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

    // Auto-scroll to selected day
    useEffect(() => {
        if (selectedRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const element = selectedRef.current;
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            // Check if element is outside visible area
            if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedDay]);

    if (tripDays.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Gradient overlays for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Scrollable container */}
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto hide-scrollbar py-2 px-2 -mx-2 scroll-smooth"
            >
                {tripDays.map(day => {
                    const isSelected = selectedDay === day.dayNumber;
                    const isToday = todayDayNumber === day.dayNumber;
                    const activityCount = activityCountByDay[day.dayNumber] || 0;

                    return (
                        <button
                            key={day.dayNumber}
                            ref={isSelected ? selectedRef : null}
                            onClick={() => onDayClick(day.dayNumber)}
                            className={`
                                flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl
                                transition-all duration-200 min-w-[72px]
                                ${isSelected
                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                    : isToday
                                        ? 'bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20'
                                        : 'bg-gray-50 text-text-main hover:bg-gray-100 border border-gray-200'
                                }
                            `}
                        >
                            {/* Day badge */}
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                                Dia {day.dayNumber}
                            </span>

                            {/* Date */}
                            <span className="text-lg font-black leading-tight">
                                {day.dayOfMonth}
                            </span>

                            {/* Week day & month */}
                            <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                                {day.weekDay}, {day.month}
                            </span>

                            {/* City indicator (if available) */}
                            {day.city && (
                                <span className={`text-[9px] font-bold mt-0.5 truncate max-w-[60px] ${isSelected ? 'text-white/70' : 'text-purple-600'}`}>
                                    {day.city}
                                </span>
                            )}

                            {/* Activity indicator */}
                            {activityCount > 0 && (
                                <div className={`flex items-center gap-0.5 mt-1 ${isSelected ? 'opacity-90' : ''}`}>
                                    {activityCount <= 4 ? (
                                        Array.from({ length: activityCount }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`size-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`}
                                            />
                                        ))
                                    ) : (
                                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-purple-600'}`}>
                                            {activityCount} ativ.
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Quick navigation buttons */}
            {tripDays.length > 5 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 z-20 pr-1">
                    <button
                        onClick={() => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                            }
                        }}
                        className="size-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm text-text-muted">chevron_left</span>
                    </button>
                    <button
                        onClick={() => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                            }
                        }}
                        className="size-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm text-text-muted">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default DayCarousel;
