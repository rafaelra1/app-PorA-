import React from 'react';
import { DayMood } from '../../../types/magazine';

interface MoodBadgeProps {
    mood: DayMood;
}

const moodConfig: Record<DayMood, { label: string; icon: string; color: string; bg: string }> = {
    adventurous: { label: 'Aventureiro', icon: 'explore', color: 'text-orange-700', bg: 'bg-orange-50' },
    relaxing: { label: 'Relaxante', icon: 'spa', color: 'text-teal-700', bg: 'bg-teal-50' },
    cultural: { label: 'Cultural', icon: 'museum', color: 'text-purple-700', bg: 'bg-purple-50' },
    gastronomic: { label: 'Gastronômico', icon: 'restaurant', color: 'text-red-700', bg: 'bg-red-50' },
    romantic: { label: 'Romântico', icon: 'favorite', color: 'text-pink-700', bg: 'bg-pink-50' },
    urban: { label: 'Urbano', icon: 'apartment', color: 'text-gray-700', bg: 'bg-gray-100' },
    nature: { label: 'Natureza', icon: 'forest', color: 'text-green-700', bg: 'bg-green-50' },
};

/**
 * MoodBadge - Displays the mood/vibe of a day.
 */
const MoodBadge: React.FC<MoodBadgeProps> = ({ mood }) => {
    const config = moodConfig[mood] || moodConfig.adventurous;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
            <span className="material-symbols-outlined text-base">{config.icon}</span>
            {config.label}
        </span>
    );
};

export default MoodBadge;
