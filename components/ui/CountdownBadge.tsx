import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

interface CountdownBadgeProps {
    targetDate: string;
    variant?: 'default' | 'urgent';
}

// =============================================================================
// Helper Functions
// =============================================================================

const calculateDaysRemaining = (targetDate: string): number => {
    // Parse date in DD/MM/YYYY or YYYY-MM-DD format
    let target: Date;
    if (targetDate.includes('/')) {
        const [day, month, year] = targetDate.split('/').map(Number);
        target = new Date(year, month - 1, day);
    } else {
        target = new Date(targetDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// =============================================================================
// CountdownBadge Component
// =============================================================================

const CountdownBadge: React.FC<CountdownBadgeProps> = ({ targetDate, variant = 'default' }) => {
    const daysRemaining = calculateDaysRemaining(targetDate);

    // Determine urgency based on days remaining
    const isUrgent = variant === 'urgent' || daysRemaining <= 7;
    const isToday = daysRemaining === 0;
    const isPast = daysRemaining < 0;
    const isOngoing = isPast;

    // Styling based on state
    const getStyles = () => {
        if (isToday) {
            return 'bg-emerald-500 text-white animate-pulse';
        }
        if (isOngoing) {
            return 'bg-emerald-500/90 text-white';
        }
        if (isUrgent) {
            return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse-subtle';
        }
        return 'bg-white/20 backdrop-blur-md text-white border border-white/20';
    };

    // Icon based on state
    const getIcon = () => {
        if (isToday || isOngoing) return 'flight_takeoff';
        if (isUrgent) return 'alarm';
        return 'schedule';
    };

    // Text based on state
    const getText = () => {
        if (isToday) return 'Hoje é o dia!';
        if (isOngoing) return `Dia ${Math.abs(daysRemaining) + 1} de viagem`;
        if (daysRemaining === 1) return '1 Dia Restante';
        return `${daysRemaining} Dias Restantes`;
    };

    return (
        <div
            className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                font-bold text-xs uppercase tracking-wide
                transition-all duration-300
                ${getStyles()}
            `}
        >
            <span className="material-symbols-outlined text-sm">
                {getIcon()}
            </span>
            <span>{getText()}</span>
        </div>
    );
};

export default CountdownBadge;
