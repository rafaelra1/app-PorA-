import React from 'react';
import { AIItineraryActivity } from '../../types';

interface AIActivityCardProps {
    activity: AIItineraryActivity;
    dayNumber: number;
    onViewDetails?: () => void;
    onSwap?: () => void;
}

const typeIcons: Record<string, { icon: string; color: string }> = {
    culture: { icon: 'museum', color: 'bg-indigo-500' },
    food: { icon: 'restaurant', color: 'bg-orange-500' },
    rest: { icon: 'hotel', color: 'bg-blue-500' },
    transport: { icon: 'directions_car', color: 'bg-gray-500' },
    nature: { icon: 'park', color: 'bg-emerald-500' },
    shopping: { icon: 'shopping_bag', color: 'bg-pink-500' },
    nightlife: { icon: 'nightlife', color: 'bg-purple-500' },
};

const AIActivityCard: React.FC<AIActivityCardProps> = ({
    activity,
    dayNumber,
    onViewDetails,
    onSwap,
}) => {
    const typeInfo = typeIcons[activity.type] || { icon: 'place', color: 'bg-gray-500' };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Image header if available */}
            {activity.image && (
                <div className="relative h-32 overflow-hidden">
                    <img
                        src={activity.image}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                        <span className="bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300">
                            {activity.time}
                        </span>
                    </div>
                </div>
            )}

            <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className={`size-10 rounded-xl ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                        <span className="material-symbols-outlined text-white text-lg">{typeInfo.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {!activity.image && (
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{activity.time}</span>
                            )}
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{activity.title}</h4>
                        {activity.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                {activity.location}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{activity.description}</p>

                {/* Reasoning (Why I chose this) */}
                {activity.reasoning && (
                    <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm mt-0.5">lightbulb</span>
                            <span>{activity.reasoning}</span>
                        </p>
                    </div>
                )}

                {/* Meta info */}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {activity.duration && (
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {activity.duration}
                        </span>
                    )}
                    {activity.estimatedCost && (
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">payments</span>
                            {activity.estimatedCost}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onViewDetails}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">info</span>
                        Detalhes
                    </button>
                    <button
                        onClick={onSwap}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                        Trocar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIActivityCard;
