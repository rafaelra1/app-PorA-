import React from 'react';

interface NavProgressIndicatorProps {
    progress: number; // 0-100
    isActive?: boolean;
    className?: string;
}

/**
 * Progress bar indicator for navigation sections
 * Shows completion status within nav items
 */
export const NavProgressIndicator: React.FC<NavProgressIndicatorProps> = ({
    progress,
    isActive = false,
    className = '',
}) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const isComplete = clampedProgress === 100;

    return (
        <div className={`relative w-full ${className}`}>
            {/* Background track */}
            <div
                className={`h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-white/20' : 'bg-gray-200'
                    }`}
            >
                {/* Progress fill */}
                <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${isActive
                            ? 'bg-white/70'
                            : isComplete
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-blue-400 to-blue-500'
                        }`}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>

            {/* Percentage label (optional, shown on hover via parent) */}
            {clampedProgress > 0 && (
                <span
                    className={`absolute right-0 -top-4 text-[10px] font-medium ${isActive ? 'text-white/70' : 'text-gray-500'
                        }`}
                >
                    {Math.round(clampedProgress)}%
                </span>
            )}
        </div>
    );
};

export default NavProgressIndicator;
