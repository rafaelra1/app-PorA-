import * as React from 'react';
import { useRef, useEffect } from 'react';

interface DateCarouselProps {
    days: {
        day: number;
        date: string;
        weekday: string;
    }[];
    selectedDay: number | null; // null means "All"
    onSelectDay: (day: number | null) => void;
}

export const DateCarousel: React.FC<DateCarouselProps> = ({ days, selectedDay, onSelectDay }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to selected day
    useEffect(() => {
        if (selectedDay !== null && scrollContainerRef.current) {
            const selectedElement = scrollContainerRef.current.querySelector(`[data-day="${selectedDay}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedDay]);

    return (
        <div className="w-full bg-white border-b border-gray-100 z-10">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-3 p-4 hide-scrollbar snap-x"
            >
                {/* "All" Option */}
                <button
                    onClick={() => onSelectDay(null)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl border-2 transition-all p-2 snap-center group ${selectedDay === null
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <span className={`material-symbols-outlined text-2xl mb-1 ${selectedDay === null ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'
                        }`}>
                        density_small
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${selectedDay === null ? 'text-purple-800' : 'text-gray-400 group-hover:text-gray-600'
                        }`}>
                        Todos
                    </span>
                </button>

                {/* Days */}
                {days.map((day) => {
                    const isSelected = selectedDay === day.day;
                    const dateObj = new Date(day.date + 'T00:00:00'); // Ensure time doesn't shift date
                    const dayNum = dateObj.getDate();
                    const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

                    // Simple weekday formatting if not provided
                    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

                    return (
                        <button
                            key={day.day}
                            data-day={day.day}
                            onClick={() => onSelectDay(day.day)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl border-2 transition-all p-1 snap-center group text-center relative ${isSelected
                                    ? 'border-purple-600 bg-purple-600 shadow-md transform scale-105'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'
                                }`}>
                                {weekday}
                            </span>
                            <span className={`text-xl font-black leading-none mb-0.5 ${isSelected ? 'text-white' : 'text-gray-800'
                                }`}>
                                {dayNum}
                            </span>
                            <span className={`text-[10px] font-medium leading-none ${isSelected ? 'text-white/80' : 'text-gray-500'
                                }`}>
                                {month}
                            </span>
                            {isSelected && (
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rotate-45"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
