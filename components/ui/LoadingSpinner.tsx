import React from 'react';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
};

/**
 * Loading spinner component with optional text
 * Uses the animate-spin class from design system
 * 
 * @example
 * <LoadingSpinner size="md" text="Loading..." />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    className = '',
}) => {
    const sizeClass = sizeMap[size];

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div className={`${sizeClass} border-4 border-gray-200 border-t-primary rounded-full animate-spin`} />
            {text && <p className="text-sm text-text-muted animate-pulse">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
