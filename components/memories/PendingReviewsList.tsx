import * as React from 'react';
import { PendingReviewItem, ItineraryActivity } from '../../types';

interface PendingReviewsListProps {
    activities: ItineraryActivity[];
    reviewedIds: string[]; // IDs of activities that already have reviews
    onReviewClick: (item: PendingReviewItem) => void;
}

// Map activity types to icons
const getActivityIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
        'food': 'restaurant',
        'meal': 'restaurant',
        'culture': 'museum',
        'sightseeing': 'photo_camera',
        'nature': 'park',
        'shopping': 'shopping_bag',
        'nightlife': 'nightlife',
        'transport': 'directions_car',
        'accommodation': 'hotel',
        'other': 'place',
    };
    return iconMap[type] || 'place';
};

// Map activity types to colors
const getActivityColor = (type: string): string => {
    const colorMap: Record<string, string> = {
        'food': 'bg-orange-100 text-orange-600',
        'meal': 'bg-orange-100 text-orange-600',
        'culture': 'bg-purple-100 text-purple-600',
        'sightseeing': 'bg-blue-100 text-blue-600',
        'nature': 'bg-green-100 text-green-600',
        'shopping': 'bg-pink-100 text-pink-600',
        'nightlife': 'bg-violet-100 text-violet-600',
        'transport': 'bg-gray-100 text-gray-600',
        'accommodation': 'bg-cyan-100 text-cyan-600',
        'other': 'bg-gray-100 text-gray-600',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-600';
};

export const PendingReviewsList: React.FC<PendingReviewsListProps> = ({
    activities,
    reviewedIds,
    onReviewClick,
}) => {
    const now = new Date();

    // Filter activities: past date/time AND not reviewed
    const pendingItems: PendingReviewItem[] = activities
        .filter((act) => {
            const activityDateTime = new Date(`${act.date}T${act.time || '00:00'}`);
            const isPast = activityDateTime < now;
            const isNotReviewed = !reviewedIds.includes(act.id);
            // Exclude transport type as they are not typically reviewable
            const isReviewable = act.type !== 'transport' && act.type !== 'accommodation';
            return isPast && isNotReviewed && isReviewable;
        })
        .map((act) => ({
            itineraryItemId: act.id,
            title: act.title,
            scheduledTime: `${act.date}T${act.time || '00:00'}`,
            location: act.location || act.locationDetail || 'Local não especificado',
            type: act.type,
        }))
        .slice(0, 5); // Limit to 5 pending items

    if (pendingItems.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Tudo Avaliado!</h3>
                        <p className="text-xs text-gray-500">Você está em dia com suas memórias</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600">pending_actions</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Avaliações Pendentes</h3>
                        <p className="text-xs text-gray-500">
                            {pendingItems.length} experiência{pendingItems.length !== 1 ? 's' : ''} aguardando seu relato
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
                {pendingItems.map((item) => {
                    const itemDate = new Date(item.scheduledTime);
                    const formattedDate = itemDate.toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                    });

                    return (
                        <div
                            key={item.itineraryItemId}
                            className="p-4 hover:bg-gray-50/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                {/* Icon */}
                                <div className={`size-9 rounded-lg flex items-center justify-center ${getActivityColor(item.type)}`}>
                                    <span className="material-symbols-outlined text-lg">
                                        {getActivityIcon(item.type)}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{formattedDate}</span>
                                        <span>•</span>
                                        <span className="truncate">{item.location}</span>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => onReviewClick(item)}
                                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md hover:shadow-purple-500/20"
                                >
                                    Avaliar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PendingReviewsList;
