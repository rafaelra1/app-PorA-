import React from 'react';
import { Icon } from './Icon';
import { Button } from './Base';

export interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    variant?: 'default' | 'minimal' | 'illustrated' | 'dashed';
    illustration?: React.ReactNode;
}

/**
 * Empty state component for when there's no content to display
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'inbox',
    title,
    description,
    action,
    className = '',
    variant = 'default',
    illustration
}) => {
    const baseClasses = "flex flex-col items-center justify-center text-center animate-fade-in";

    const variants = {
        default: "py-20 px-4",
        minimal: "py-8 px-4",
        illustrated: "py-20 px-4",
        dashed: "py-20 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200"
    };

    const renderIcon = () => {
        if (illustration) {
            return (
                <div className="mb-8 max-w-[280px] w-full text-primary/20">
                    {illustration}
                </div>
            );
        }

        if (variant === 'minimal') {
            return (
                <div className="mb-3 text-text-muted">
                    <Icon name={icon} size="xl" />
                </div>
            );
        }

        // Standard icon container for default and dashed
        return (
            <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300 mb-4">
                <Icon name={icon} size="3xl" />
            </div>
        );
    };

    const titleClasses = variant === 'minimal'
        ? "text-lg font-semibold text-text-main mb-1"
        : "text-lg font-bold text-text-main mb-2";

    const descClasses = variant === 'minimal'
        ? "text-sm text-text-muted max-w-sm mb-4"
        : "text-text-muted text-sm mb-6 max-w-xs mx-auto";

    return (
        <div className={`${baseClasses} ${variants[variant]} ${className}`}>
            {renderIcon()}
            <h3 className={titleClasses}>{title}</h3>
            {description && (
                <p className={descClasses}>{description}</p>
            )}
            {action && (
                <div className="mt-2">
                    <Button
                        variant="primary"
                        onClick={action.onClick}
                        className={variant === 'minimal' ? 'bg-transparent text-primary hover:bg-primary/5 px-4 h-9 shadow-none' : ''}
                    >
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
