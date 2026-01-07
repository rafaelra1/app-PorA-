import React, { useState } from 'react';
import { AIItineraryDayV2, AIItineraryActivityV2 } from '../../../types';

interface ItineraryTimelineV2Props {
    days: AIItineraryDayV2[];
    onActivityClick?: (activity: AIItineraryActivityV2) => void;
}

const activityTypeIcons: Record<string, string> = {
    culture: 'museum',
    food: 'restaurant',
    nature: 'park',
    shopping: 'shopping_bag',
    nightlife: 'nightlife',
    rest: 'hotel',
    transport: 'directions_car',
};

const activityTypeColors: Record<string, string> = {
    culture: 'bg-purple-500',
    food: 'bg-orange-500',
    nature: 'bg-green-500',
    shopping: 'bg-pink-500',
    nightlife: 'bg-indigo-500',
    rest: 'bg-blue-500',
    transport: 'bg-gray-500',
};

const ItineraryTimelineV2: React.FC<ItineraryTimelineV2Props> = ({ days, onActivityClick }) => {
    const [expandedDay, setExpandedDay] = useState<number | null>(days.length > 0 ? days[0].day : null);

    if (days.length === 0) {
        return (
            <div className="text-center py-12 text-[#9F9FB1]">
                <span className="material-symbols-outlined text-5xl mb-3 block">event_busy</span>
                <p>Nenhum dia no roteiro ainda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {days.map((day) => (
                <div key={day.day} className="bg-white rounded-2xl border border-[#EDEFF3] overflow-hidden">
                    {/* Day Header */}
                    <button
                        onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[#EDEFF3]/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B68FF] to-[#9F9FB1] flex flex-col items-center justify-center text-white">
                                <span className="text-xs font-medium uppercase">Dia</span>
                                <span className="text-lg font-bold leading-none">{day.day}</span>
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-[#1F1F1F]">{day.title}</h3>
                                <p className="text-sm text-[#9F9FB1]">
                                    {day.city && <span>{day.city} • </span>}
                                    {day.date}
                                    {day.weatherForecast && <span> • {day.weatherForecast}</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {day.totalCost && (
                                <span className="text-sm font-medium text-[#6B68FF]">
                                    R$ {day.totalCost.toLocaleString('pt-BR')}
                                </span>
                            )}
                            <span className={`material-symbols-outlined text-[#9F9FB1] transition-transform ${expandedDay === day.day ? 'rotate-180' : ''
                                }`}>
                                expand_more
                            </span>
                        </div>
                    </button>

                    {/* Activities Timeline */}
                    {expandedDay === day.day && (
                        <div className="px-4 pb-4">
                            {day.summary && (
                                <p className="text-sm text-[#9F9FB1] mb-4 pl-16">{day.summary}</p>
                            )}

                            <div className="relative pl-16">
                                {/* Timeline Line */}
                                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-[#EDEFF3]"></div>

                                {day.activities.map((activity, idx) => (
                                    <div key={activity.id || idx} className="relative mb-4 last:mb-0">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-9 w-6 h-6 rounded-full ${activityTypeColors[activity.type] || 'bg-[#6B68FF]'} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-white text-sm">
                                                {activityTypeIcons[activity.type] || 'place'}
                                            </span>
                                        </div>

                                        {/* Activity Card */}
                                        <div
                                            onClick={() => onActivityClick?.(activity)}
                                            className="p-4 bg-[#EDEFF3] rounded-xl hover:bg-[#6B68FF]/10 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-[#6B68FF]">{activity.time}</span>
                                                    <h4 className="font-semibold text-[#1F1F1F]">{activity.title}</h4>
                                                </div>
                                                {activity.approximateCost && (
                                                    <span className="text-sm font-medium text-[#1F1F1F]">
                                                        R$ {activity.approximateCost}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-[#9F9FB1] mb-2">{activity.description}</p>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {activity.duration && (
                                                    <span className="flex items-center gap-1 text-[#9F9FB1]">
                                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                                        {activity.duration}
                                                    </span>
                                                )}
                                                {activity.location && (
                                                    <span className="flex items-center gap-1 text-[#9F9FB1]">
                                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                                        {activity.location}
                                                    </span>
                                                )}
                                                {activity.travelTimeFromPrevious && idx > 0 && (
                                                    <span className="flex items-center gap-1 text-[#6B68FF]">
                                                        <span className="material-symbols-outlined text-sm">directions_walk</span>
                                                        {activity.travelTimeFromPrevious}
                                                    </span>
                                                )}
                                                {activity.priority && (
                                                    <span className={`px-2 py-0.5 rounded ${activity.priority === 'essential' ? 'bg-green-100 text-green-700' :
                                                            activity.priority === 'desirable' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {activity.priority === 'essential' ? 'Essencial' :
                                                            activity.priority === 'desirable' ? 'Desejável' : 'Opcional'}
                                                    </span>
                                                )}
                                                {activity.bookingRequired && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                                        Reserva necessária
                                                    </span>
                                                )}
                                            </div>

                                            {activity.reasoning && (
                                                <p className="mt-2 text-xs text-[#6B68FF] italic">
                                                    💡 {activity.reasoning}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ItineraryTimelineV2;
