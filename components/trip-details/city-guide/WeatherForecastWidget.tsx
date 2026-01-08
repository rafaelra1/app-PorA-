import React, { useEffect, useState } from 'react';
import { weatherService, ForecastDay } from '../../../services/weatherService';

interface WeatherForecastWidgetProps {
    cityName: string;
    arrivalDate?: string;
    departureDate?: string;
}

const WeatherForecastWidget: React.FC<WeatherForecastWidgetProps> = ({
    cityName,
    arrivalDate,
    departureDate
}) => {
    const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchForecast = async () => {
            if (!cityName) return;
            setIsLoading(true);
            try {
                const data = await weatherService.getForecast(cityName);
                if (isMounted) setForecast(data);
            } catch (err) {
                console.error("Failed to load forecast", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchForecast();
        return () => { isMounted = false; };
    }, [cityName]);

    // Filter forecast to trip dates if provided
    const displayForecast = forecast?.filter(day => {
        if (!arrivalDate && !departureDate) return true;
        const dayDate = new Date(day.date);
        const arrival = arrivalDate ? new Date(arrivalDate) : null;
        const departure = departureDate ? new Date(departureDate) : null;

        if (arrival && dayDate < arrival) return false;
        if (departure && dayDate > departure) return false;
        return true;
    }) || forecast;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const day = date.getDate();
        return { weekday: weekday.replace('.', ''), day };
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-blue-500">wb_sunny</span>
                    <h4 className="font-bold text-text-main">Previsão do Tempo</h4>
                </div>
                <div className="flex gap-3 overflow-x-auto">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="shrink-0 w-16 h-24 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!displayForecast || displayForecast.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">wb_sunny</span>
                    <h4 className="font-bold text-text-main">Previsão de 7 Dias</h4>
                </div>
                <span className="text-[10px] text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                    {cityName}
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {displayForecast.slice(0, 7).map((day, index) => {
                    const { weekday, day: dayNum } = formatDate(day.date);
                    const isToday = index === 0;

                    return (
                        <div
                            key={day.date}
                            className={`shrink-0 w-16 rounded-2xl p-3 flex flex-col items-center gap-1 transition-all ${isToday
                                    ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                        >
                            <span className={`text-[10px] uppercase font-bold ${isToday ? '' : 'text-text-muted'}`}>
                                {isToday ? 'Hoje' : weekday}
                            </span>
                            <span className={`text-xs font-bold ${isToday ? '' : 'text-text-main'}`}>
                                {dayNum}
                            </span>
                            <span className={`material-symbols-outlined text-2xl my-1 ${isToday ? '' :
                                    day.icon.includes('rain') ? 'text-blue-500' :
                                        day.icon.includes('sun') ? 'text-amber-500' :
                                            'text-gray-500'
                                }`}>
                                {day.icon}
                            </span>
                            <div className="flex items-center gap-1 text-xs">
                                <span className={`font-bold ${isToday ? '' : 'text-text-main'}`}>
                                    {day.tempMax}°
                                </span>
                                <span className={`${isToday ? 'opacity-70' : 'text-text-muted'}`}>
                                    {day.tempMin}°
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alert for extreme weather */}
            {displayForecast.some(d => d.icon.includes('thunder') || d.icon.includes('heavy')) && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
                    <span className="text-xs text-amber-700">
                        Alerta: Condições climáticas adversas previstas
                    </span>
                </div>
            )}
        </div>
    );
};

export default WeatherForecastWidget;
