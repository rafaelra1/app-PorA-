import * as React from 'react';
import { MemoryStats } from '../../types';

interface GamificationWidgetProps {
    stats: MemoryStats;
}

// Badge definitions
interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    bgColor: string;
    condition: (stats: MemoryStats) => boolean;
}

const BADGES: Badge[] = [
    {
        id: 'gastronomic',
        name: 'Explorador Gastronômico',
        icon: 'restaurant',
        description: 'Maioria das avaliações em restaurantes',
        color: 'text-orange-600',
        bgColor: 'bg-gradient-to-br from-orange-100 to-amber-100',
        condition: (stats) => {
            const foodCount = (stats.categoryBreakdown['food'] || 0) + (stats.categoryBreakdown['meal'] || 0);
            const total = stats.reviewsWritten;
            return total >= 3 && foodCount / total > 0.5;
        },
    },
    {
        id: 'historian',
        name: 'Historiador',
        icon: 'museum',
        description: 'Maioria das avaliações em museus e cultura',
        color: 'text-purple-600',
        bgColor: 'bg-gradient-to-br from-purple-100 to-violet-100',
        condition: (stats) => {
            const cultureCount = (stats.categoryBreakdown['culture'] || 0) + (stats.categoryBreakdown['sightseeing'] || 0);
            const total = stats.reviewsWritten;
            return total >= 3 && cultureCount / total > 0.5;
        },
    },
    {
        id: 'adventurer',
        name: 'Aventureiro',
        icon: 'hiking',
        description: 'Maioria das avaliações em natureza e aventura',
        color: 'text-green-600',
        bgColor: 'bg-gradient-to-br from-green-100 to-emerald-100',
        condition: (stats) => {
            const natureCount = stats.categoryBreakdown['nature'] || 0;
            const total = stats.reviewsWritten;
            return total >= 3 && natureCount / total > 0.5;
        },
    },
    {
        id: 'nightowl',
        name: 'Coruja Noturna',
        icon: 'nightlife',
        description: 'Maioria das avaliações em vida noturna',
        color: 'text-violet-600',
        bgColor: 'bg-gradient-to-br from-violet-100 to-indigo-100',
        condition: (stats) => {
            const nightCount = stats.categoryBreakdown['nightlife'] || 0;
            const total = stats.reviewsWritten;
            return total >= 3 && nightCount / total > 0.5;
        },
    },
    {
        id: 'perfectionist',
        name: 'Perfeccionista',
        icon: 'verified',
        description: 'Avaliou 100% do roteiro',
        color: 'text-emerald-600',
        bgColor: 'bg-gradient-to-br from-emerald-100 to-teal-100',
        condition: (stats) => stats.pendingReviews === 0 && stats.reviewsWritten >= 5,
    },
    {
        id: 'starter',
        name: 'Primeiros Passos',
        icon: 'star',
        description: 'Sua primeira avaliação',
        color: 'text-amber-600',
        bgColor: 'bg-gradient-to-br from-amber-100 to-yellow-100',
        condition: (stats) => stats.reviewsWritten >= 1,
    },
];

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ stats }) => {
    const percentage = stats.totalPlacesVisited > 0
        ? Math.round((stats.reviewsWritten / stats.totalPlacesVisited) * 100)
        : 0;

    // Find earned badges
    const earnedBadges = BADGES.filter((badge) => badge.condition(stats));

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <span className="material-symbols-outlined text-white">emoji_events</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Seu Progresso</h3>
                        <p className="text-xs text-gray-500">Continue registrando memórias!</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Roteiro Avaliado</span>
                    <span className="text-sm font-bold text-purple-600">{percentage}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{stats.reviewsWritten} avaliações</span>
                    <span>{stats.totalPlacesVisited} lugares visitados</span>
                </div>
            </div>

            {/* Badges Section */}
            {earnedBadges.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Conquistas
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {earnedBadges.map((badge) => (
                            <div
                                key={badge.id}
                                className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl ${badge.bgColor} cursor-pointer hover:scale-105 transition-transform`}
                                title={badge.description}
                            >
                                <span className={`material-symbols-outlined text-lg ${badge.color}`}>
                                    {badge.icon}
                                </span>
                                <span className={`text-xs font-bold ${badge.color}`}>
                                    {badge.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Motivational Message */}
            {stats.pendingReviews > 0 && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                        <p className="text-xs text-amber-700">
                            <strong>Dica:</strong> Avalie {stats.pendingReviews} experiência{stats.pendingReviews !== 1 ? 's' : ''} pendente{stats.pendingReviews !== 1 ? 's' : ''} para desbloquear novas conquistas!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificationWidget;
