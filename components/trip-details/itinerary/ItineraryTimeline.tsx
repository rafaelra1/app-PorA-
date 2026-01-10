import * as React from 'react';
import { ItineraryActivity, ItineraryActivityType } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface ItineraryTimelineProps {
    activities: ItineraryActivity[];
    onActivityClick?: (activity: ItineraryActivity) => void;
    onToggleComplete?: (activityId: string) => void;
}

interface ActivityConfig {
    icon: string;
    color: string;
    bgColor: string;
}

// =============================================================================
// Config
// =============================================================================

const activityConfig: Record<ItineraryActivityType | string, ActivityConfig> = {
    transport: { icon: 'flight', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    accommodation: { icon: 'hotel', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    meal: { icon: 'restaurant', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    food: { icon: 'restaurant', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    sightseeing: { icon: 'attractions', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    culture: { icon: 'museum', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    nature: { icon: 'park', color: 'text-green-600', bgColor: 'bg-green-100' },
    shopping: { icon: 'shopping_bag', color: 'text-pink-600', bgColor: 'bg-pink-100' },
    nightlife: { icon: 'nightlife', color: 'text-violet-600', bgColor: 'bg-violet-100' },
    other: { icon: 'event', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

// =============================================================================
// Timeline Item Component
// =============================================================================

interface TimelineItemProps {
    activity: ItineraryActivity;
    isFirst: boolean;
    isLast: boolean;
    onClick?: (activity: ItineraryActivity) => void;
    onToggleComplete?: (activityId: string) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
    activity,
    isFirst,
    isLast,
    onClick,
    onToggleComplete
}) => {
    const config = activityConfig[activity.type] || activityConfig.other;

    return (
        <div className="flex gap-4 group relative">
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
                {/* Top Line */}
                {!isFirst && (
                    <div className="w-0.5 h-4 bg-gray-200" />
                )}

                {/* Dot */}
                <div
                    className={`
                        size-10 rounded-xl flex items-center justify-center shrink-0 
                        transition-all duration-200 cursor-pointer
                        ${activity.completed
                            ? 'bg-emerald-500 text-white'
                            : `${config.bgColor} ${config.color}`
                        }
                        group-hover:scale-110 group-hover:shadow-md
                    `}
                    onClick={() => onToggleComplete?.(activity.id)}
                >
                    <span className="material-symbols-outlined text-lg">
                        {activity.completed ? 'check' : config.icon}
                    </span>
                </div>

                {/* Bottom Line */}
                {!isLast && (
                    <div className="w-0.5 flex-1 min-h-[20px] bg-gray-200" />
                )}
            </div>

            {/* Content Card */}
            <div
                className={`
                    flex-1 bg-white rounded-xl border border-gray-100 p-4 mb-3
                    transition-all duration-200 cursor-pointer
                    hover:shadow-md hover:border-gray-200
                    ${activity.completed ? 'opacity-60' : ''}
                `}
                onClick={() => onClick?.(activity)}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Time Badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`
                                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold
                                ${config.bgColor} ${config.color}
                            `}>
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {activity.time}
                            </span>
                            {activity.duration && (
                                <span className="text-xs text-text-muted">
                                    • {activity.duration}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h4 className={`
                            font-bold text-sm text-text-main mb-1
                            ${activity.completed ? 'line-through' : ''}
                        `}>
                            {activity.title}
                        </h4>

                        {/* Location */}
                        {activity.location && (
                            <div className="flex items-center gap-1 text-xs text-text-muted">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {activity.location}
                            </div>
                        )}

                        {/* Notes */}
                        {activity.notes && (
                            <p className="text-xs text-text-muted mt-2 line-clamp-2">
                                {activity.notes}
                            </p>
                        )}
                    </div>

                    {/* Image Thumbnail */}
                    {activity.image && (
                        <div className="size-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <img
                                src={activity.image}
                                alt={activity.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons on Hover */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete?.(activity.id);
                        }}
                        className={`
                            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors
                            ${activity.completed
                                ? 'bg-gray-100 text-text-muted hover:bg-gray-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }
                        `}
                    >
                        <span className="material-symbols-outlined text-sm">
                            {activity.completed ? 'undo' : 'check_circle'}
                        </span>
                        {activity.completed ? 'Desfazer' : 'Concluir'}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(activity);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-text-muted hover:bg-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// ItineraryTimeline Component
// =============================================================================

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
    activities,
    onActivityClick,
    onToggleComplete
}) => {
    // Sort activities by time
    const sortedActivities = [...activities].sort((a, b) =>
        a.time.localeCompare(b.time)
    );

    if (sortedActivities.length === 0) {
        return (
            <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_busy</span>
                <p className="text-sm text-text-muted">Nenhuma atividade neste dia</p>
            </div>
        );
    }

    return (
        <div className="pl-2">
            {sortedActivities.map((activity, index) => (
                <TimelineItem
                    key={activity.id}
                    activity={activity}
                    isFirst={index === 0}
                    isLast={index === sortedActivities.length - 1}
                    onClick={onActivityClick}
                    onToggleComplete={onToggleComplete}
                />
            ))}
        </div>
    );
};

export default ItineraryTimeline;
