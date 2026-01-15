import React from 'react';
import { MagazineActivity, ActivityCategory } from '../../../types/magazine';

interface MagazineActivityCardProps {
    activity: MagazineActivity;
}

const categoryConfig: Record<ActivityCategory, { icon: string; color: string; bg: string }> = {
    sightseeing: { icon: 'photo_camera', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    food: { icon: 'restaurant', color: 'text-orange-700', bg: 'bg-orange-50' },
    culture: { icon: 'museum', color: 'text-purple-700', bg: 'bg-purple-50' },
    nature: { icon: 'park', color: 'text-green-700', bg: 'bg-green-50' },
    transport: { icon: 'flight', color: 'text-blue-700', bg: 'bg-blue-50' },
    shopping: { icon: 'shopping_bag', color: 'text-pink-700', bg: 'bg-pink-50' },
    nightlife: { icon: 'local_bar', color: 'text-slate-700', bg: 'bg-slate-50' },
    rest: { icon: 'hotel', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    other: { icon: 'star', color: 'text-gray-700', bg: 'bg-gray-50' },
};

/**
 * MagazineActivityCard - An activity card styled for magazine view.
 */
const MagazineActivityCard: React.FC<MagazineActivityCardProps> = ({ activity }) => {
    const config = categoryConfig[activity.category] || categoryConfig.other;

    return (
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 group">
            {/* Image (if available) */}
            {activity.image?.url && (
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={activity.image.url}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Time Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                        {activity.time}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    {/* Category Icon */}
                    <div className={`p-2 rounded-xl ${config.bg}`}>
                        <span className={`material-symbols-outlined ${config.color}`}>
                            {config.icon}
                        </span>
                    </div>

                    {/* Title & Time */}
                    <div className="flex-1 min-w-0">
                        {!activity.image?.url && (
                            <span className="text-xs font-medium text-primary mb-1 block">{activity.time}</span>
                        )}
                        <h4 className="font-semibold text-gray-900 text-base leading-tight">{activity.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {activity.address}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {activity.description}
                </p>

                {/* Why We Chose This */}
                <div className="bg-primary/5 rounded-xl p-3 mb-3">
                    <p className="text-xs text-primary font-medium flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm mt-0.5">favorite</span>
                        <span>{activity.whyWeChoseThis}</span>
                    </p>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {activity.duration}
                    </span>

                    {activity.cost && (
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">payments</span>
                            {activity.cost}
                        </span>
                    )}
                </div>

                {/* Tips */}
                {(activity.proTip || activity.photoSpot) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        {activity.proTip && (
                            <div className="flex items-start gap-2 text-xs">
                                <span className="text-amber-500">💡</span>
                                <span className="text-gray-600">{activity.proTip}</span>
                            </div>
                        )}
                        {activity.photoSpot && (
                            <div className="flex items-start gap-2 text-xs">
                                <span className="text-blue-500">📸</span>
                                <span className="text-gray-600">{activity.photoSpot}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Perfect For Tags */}
                {activity.perfectFor.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {activity.perfectFor.map((tag, idx) => (
                            <span
                                key={idx}
                                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
};

export default MagazineActivityCard;
