import React, { ButtonHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    className = '',
    id,
    ...props
}) => {
    // Generate unique ID for the label if not provided
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const labelId = `${switchId}-label`;
    const descriptionId = description ? `${switchId}-description` : undefined;

    const handleClick = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div className={`flex items-center justify-between py-3 ${className}`}>
            <div className="flex-1 pr-4">
                {label && (
                    <p
                        id={labelId}
                        className={`text-sm font-bold ${disabled ? 'text-gray-400' : 'text-text-main'}`}
                    >
                        {label}
                    </p>
                )}
                {description && (
                    <p
                        id={descriptionId}
                        className={`text-xs mt-0.5 ${disabled ? 'text-gray-300' : 'text-text-muted'}`}
                    >
                        {description}
                    </p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                id={switchId}
                aria-checked={checked}
                aria-labelledby={label ? labelId : undefined}
                aria-describedby={descriptionId}
                disabled={disabled}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${checked ? 'bg-primary' : 'bg-gray-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                {...props}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                        ${checked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    );
};

export default Switch;
