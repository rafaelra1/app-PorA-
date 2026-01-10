import * as React from 'react';
import { Card } from '../../../ui/Base';

// =============================================================================
// Types
// =============================================================================

interface CountdownWidgetProps {
    startDate: string;
    createdAt?: string;
    onNavigate?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const calculateDaysUntilTrip = (startDate: string): { value: number; label: string; isOngoing: boolean; progress: number } => {
    // Parse date in DD/MM/YYYY or YYYY-MM-DD format
    let start: Date;
    if (startDate.includes('/')) {
        start = new Date(startDate.split('/').reverse().join('-'));
    } else {
        start = new Date(startDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate progress (assuming 60 days max countdown window)
    const maxDays = 60;
    const progress = Math.max(0, Math.min(100, ((maxDays - diffDays) / maxDays) * 100));

    if (diffDays < 0) {
        return { value: Math.abs(diffDays), label: 'dias em viagem', isOngoing: true, progress: 100 };
    } else if (diffDays === 0) {
        return { value: 0, label: 'Hoje!', isOngoing: true, progress: 100 };
    } else if (diffDays === 1) {
        return { value: 1, label: 'dia restante', isOngoing: false, progress };
    }
    return { value: diffDays, label: 'dias restantes', isOngoing: false, progress };
};

// =============================================================================
// CircularProgress Component
// =============================================================================

interface CircularProgressProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    isOngoing?: boolean;
    children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size = 120,
    strokeWidth = 8,
    isOngoing = false,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Gradient colors
    const gradientId = `countdown-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        {isOngoing ? (
                            <>
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#34D399" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                            </>
                        )}
                    </linearGradient>
                </defs>

                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100 dark:text-gray-700"
                />

                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    style={{ willChange: 'stroke-dashoffset' }}
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {children}
            </div>
        </div>
    );
};

// =============================================================================
// CountdownWidget Component
// =============================================================================

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ startDate, onNavigate }) => {
    const countdown = calculateDaysUntilTrip(startDate);

    return (
        <Card
            className="p-5 hover:shadow-lg transition-all cursor-pointer group"
            onClick={onNavigate}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/20 rounded-full">
                    Contagem Regressiva
                </span>
                {countdown.isOngoing && (
                    <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full animate-pulse">
                        <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                        EM VIAGEM
                    </span>
                )}
            </div>

            <div className="flex items-center justify-center py-4">
                <CircularProgress
                    progress={countdown.progress}
                    size={140}
                    strokeWidth={10}
                    isOngoing={countdown.isOngoing}
                >
                    {countdown.value === 0 && countdown.label === 'Hoje!' ? (
                        <>
                            <span className="material-symbols-outlined text-4xl text-emerald-500 mb-1">
                                flight_takeoff
                            </span>
                            <span className="text-sm font-bold text-emerald-600">Hoje!</span>
                        </>
                    ) : (
                        <>
                            <span className={`text-4xl font-black ${countdown.isOngoing ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {countdown.value}
                            </span>
                            <span className="text-xs text-text-muted font-medium text-center px-2">
                                {countdown.label}
                            </span>
                        </>
                    )}
                </CircularProgress>
            </div>

            <p className="text-center text-xs text-text-muted mt-2">
                {countdown.isOngoing
                    ? 'Aproveite sua viagem! ✨'
                    : 'Faltam poucos dias para a aventura!'}
            </p>
        </Card>
    );
};

export default CountdownWidget;
