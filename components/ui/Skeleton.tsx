import React from 'react';

export interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    className?: string;
}

/**
 * Skeleton loader component for loading states
 * Uses the .skeleton animation from design system
 * 
 * @example
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" width="100%" height="200px" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : '100%';
    const heightStyle = height
        ? typeof height === 'number'
            ? `${height}px`
            : height
        : variant === 'text'
            ? '1rem'
            : variant === 'circular'
                ? widthStyle
                : '100px';

    return (
        <div
            className={`skeleton ${variantClasses[variant]} ${className}`}
            style={{
                width: widthStyle,
                height: heightStyle,
            }}
        />
    );
};

/**
 * Skeleton group for multiple loading lines
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className = '',
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    variant="text"
                    width={index === lines - 1 ? '70%' : '100%'}
                />
            ))}
        </div>
    );
};

export default Skeleton;
