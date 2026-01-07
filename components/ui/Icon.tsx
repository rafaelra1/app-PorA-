import React from 'react';

export interface IconProps {
    name: string;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    className?: string;
    filled?: boolean;
    onClick?: () => void;
}

const sizeMap = {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
};

/**
 * Icon wrapper component for Material Symbols
 * Provides consistent sizing and styling for icons
 * 
 * @example
 * <Icon name="home" size="lg" filled />
 * <Icon name="search" className="text-primary" />
 */
export const Icon: React.FC<IconProps> = ({
    name,
    size = 'base',
    className = '',
    filled = false,
    onClick,
}) => {
    const sizeClass = sizeMap[size];
    const filledClass = filled ? 'filled' : '';
    const cursorClass = onClick ? 'cursor-pointer' : '';

    return (
        <span
            className={`material-symbols-outlined ${sizeClass} ${filledClass} ${cursorClass} ${className}`}
            onClick={onClick}
        >
            {name}
        </span>
    );
};

export default Icon;
