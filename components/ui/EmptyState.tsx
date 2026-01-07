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
}

/**
 * Empty state component for when there's no content to display
 * 
 * @example
 * <EmptyState
 *   icon="luggage"
 *   title="No trips yet"
 *   description="Create your first trip to get started"
 *   action={{ label: "Create Trip", onClick: handleCreate }}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'inbox',
    title,
    description,
    action,
    className = '',
}) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in ${className}`}>
            <div className="mb-4 p-4 rounded-full bg-gray-50">
                <Icon name={icon} size="3xl" className="text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">{title}</h3>
            {description && (
                <p className="text-text-muted max-w-sm mb-6">{description}</p>
            )}
            {action && (
                <Button variant="primary" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
