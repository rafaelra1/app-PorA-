import React from 'react';
import { WeatherInfo } from '../../../../types/preTripBriefing';

interface WeatherSectionProps {
    weather: WeatherInfo;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({ weather }) => {
    // Ensure we have valid data with defaults
    const forecast = weather?.forecast || [];
    const packingList = weather?.packingList || [];
    const summary = weather?.summary || 'Verifique a previsão do tempo antes de viajar.';

    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌤️</span> Clima & Malas
            </h2>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mb-6">
                {/* Forecast Header */}
                <div className="p-3 bg-indigo-50 border-b border-indigo-100">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="material-symbols-outlined text-indigo-500 text-base">info</span>
                        <p className="text-indigo-900 font-medium text-xs">{summary}</p>
                    </div>
                </div>

                {/* Grid Flow for days */}
                {forecast.length > 0 ? (
                    <div className="overflow-x-auto">
                        <div className="flex min-w-max divide-x divide-gray-100">
                            {forecast.map((day, idx) => {
                                // Safely extract day number from date
                                const dayNumber = day?.date?.split?.('-')?.[2] || (idx + 1).toString();
                                const dayOfWeek = day?.dayOfWeek || `Dia ${idx + 1}`;
                                const conditionIcon = day?.conditionIcon || '☀️';
                                const maxTemp = day?.maxTemp ?? '--';
                                const minTemp = day?.minTemp ?? '--';
                                const rainProb = day?.rainProb ?? 0;

                                return (
                                    <div key={idx} className="flex-1 min-w-[80px] p-3 flex flex-col items-center text-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{dayOfWeek}</span>
                                        <span className="text-base font-bold text-gray-900 mb-1">{dayNumber}</span>
                                        <span className="text-2xl mb-2">{conditionIcon}</span>
                                        <div className="space-y-0.5 w-full">
                                            <div className="flex justify-between text-xs px-1">
                                                <span className="text-gray-400">Máx</span>
                                                <span className="font-bold text-gray-800">{maxTemp}°</span>
                                            </div>
                                            <div className="flex justify-between text-xs px-1">
                                                <span className="text-gray-400">Mín</span>
                                                <span className="font-bold text-gray-600">{minTemp}°</span>
                                            </div>
                                        </div>
                                        {rainProb > 0 && (
                                            <div className="mt-2 text-[10px] font-bold text-blue-500 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-[10px]">water_drop</span>
                                                {rainProb}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">cloud_off</span>
                        Previsão detalhada não disponível. Consulte um serviço de meteorologia.
                    </div>
                )}
            </div>

            {/* Packing List */}
            {packingList.length > 0 && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase text-[10px] tracking-wide">
                        <span className="material-symbols-outlined text-base">styler</span>
                        O que levar (Sugerido)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {packingList.map((item, idx) => (
                            <div key={idx} className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 shadow-sm flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-gray-300 text-[10px]">check_circle</span>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};
