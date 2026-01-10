// components/ui/FlightStatusBadge.tsx
// Visual badge component for displaying flight status

import * as React from 'react';
import { FlightStatusCode } from '../../types';
import { STATUS_COLORS, flightStatusService } from '../../services/flightStatusService';
import Icon from './Icon';

interface FlightStatusBadgeProps {
    status: FlightStatusCode;
    delay?: number;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

const STATUS_ICONS: Record<FlightStatusCode, string> = {
    scheduled: 'clock',
    active: 'airplane',
    landed: 'check-circle',
    cancelled: 'x-circle',
    diverted: 'alert-triangle',
    delayed: 'clock',
    unknown: 'help-circle',
};

const SIZE_CLASSES = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
};

export const FlightStatusBadge: React.FC<FlightStatusBadgeProps> = ({
    status,
    delay,
    size = 'md',
    showIcon = true,
    className = '',
}) => {
    const colors = STATUS_COLORS[status];
    const label = flightStatusService.getStatusLabel(status);
    const iconName = STATUS_ICONS[status];

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
        >
            {showIcon && (
                <Icon name={iconName} size={size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'base'} />
            )}
            <span>{label}</span>
            {delay && delay > 0 && status === 'delayed' && (
                <span className="opacity-80">+{flightStatusService.formatDelay(delay)}</span>
            )}
        </span>
    );
};

export default FlightStatusBadge;
