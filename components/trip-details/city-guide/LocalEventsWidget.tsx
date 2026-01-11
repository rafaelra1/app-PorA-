import React, { useEffect, useState } from 'react';
import { getGeminiService } from '../../../services/geminiService';

interface LocalEvent {
    title: string;
    date: string;
    description: string;
    type: 'festival' | 'music' | 'art' | 'holiday' | 'other';
}

interface LocalEventsWidgetProps {
    cityName: string;
    dates: string; // e.g., "10 Out - 15 Out" or specific arrival/departure
}

const LocalEventsWidget: React.FC<LocalEventsWidgetProps> = ({ cityName, dates }) => {
    const [events, setEvents] = useState<LocalEvent[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(false);
        try {
            const gemini = getGeminiService();
            const result = await gemini.searchLocalEvents(cityName, dates);
            if (result) {
                setEvents(result);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'festival': return 'celebration';
            case 'music': return 'music_note';
            case 'art': return 'palette';
            case 'holiday': return 'celebration';
            default: return 'event';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'festival': return 'text-amber-500 bg-amber-50';
            case 'music': return 'text-purple-500 bg-purple-50';
            case 'art': return 'text-pink-500 bg-pink-50';
            case 'holiday': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-blue-500 bg-blue-50';
        }
    };

    // Sort events to show holidays first
    const sortedEvents = events ? [...events].sort((a, b) => {
        if (a.type === 'holiday' && b.type !== 'holiday') return -1;
        if (a.type !== 'holiday' && b.type === 'holiday') return 1;
        return 0;
    }) : null;

    if (!events && !isLoading && !error) {
        return (
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-500">event</span>
                        Eventos Locais
                    </h4>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">AI</span>
                </div>
                <p className="text-xs text-text-muted mb-3">Descubra festivais e eventos durante sua estadia.</p>
                <button
                    onClick={handleGenerate}
                    className="w-full py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">magic_button</span>
                    Buscar Eventos
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-rose-500">event</span>
                    <h4 className="font-bold text-text-main">Buscando Eventos...</h4>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="size-10 bg-gray-100 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                <div className="h-2 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (events && events.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-text-main flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">event</span>
                    Eventos em {cityName}
                </h4>
            </div>

            <div className="space-y-3">
                {sortedEvents?.map((event, index) => {
                    const style = getColor(event.type);
                    const isHoliday = event.type === 'holiday';

                    return (
                        <div
                            key={index}
                            className={`flex gap-3 group ${
                                isHoliday
                                    ? 'p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-200'
                                    : ''
                            }`}
                        >
                            <div className={`mt-1 ${isHoliday ? 'size-12' : 'size-10'} rounded-xl flex items-center justify-center shrink-0 ${
                                isHoliday ? 'bg-emerald-200 text-emerald-700' : style
                            }`}>
                                <span className={`material-symbols-outlined ${isHoliday ? 'text-2xl' : 'text-xl'}`}>
                                    {getIcon(event.type)}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h5 className={`font-bold text-text-main group-hover:text-primary transition-colors ${
                                    isHoliday ? 'text-base text-emerald-800' : 'text-sm'
                                }`}>
                                    {event.title}
                                </h5>
                                <p className={`font-bold uppercase tracking-wide mb-0.5 ${
                                    isHoliday
                                        ? 'text-xs text-emerald-600'
                                        : 'text-[10px] text-text-muted'
                                }`}>
                                    {event.date} • {isHoliday ? 'Feriado' : event.type === 'other' ? 'Evento' : event.type}
                                </p>
                                <p className={`leading-relaxed ${
                                    isHoliday ? 'text-sm text-emerald-700' : 'text-xs text-text-muted'
                                }`}>
                                    {event.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LocalEventsWidget;
