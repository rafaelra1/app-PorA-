import React, { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface StyledSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    fullWidth?: boolean;
    labelClassName?: string;
}

/**
 * Reusable Select component with Styled visual identity
 */
export const StyledSelect = forwardRef<HTMLSelectElement, StyledSelectProps>(
    (
        {
            label,
            error,
            helperText,
            options,
            placeholder,
            fullWidth = false,
            className = '',
            disabled,
            required,
            labelClassName = '',
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'px-4 py-3 rounded-lg border transition-all font-medium focus:outline-none focus:ring-1 appearance-none bg-no-repeat text-gray-900 placeholder-gray-400';
        const normalStyles =
            'border-gray-400 bg-white focus:border-[#8B5CF6] focus:ring-[#8B5CF6]';
        const errorStyles = 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500';
        const disabledStyles = 'opacity-50 cursor-not-allowed';
        const widthStyles = fullWidth ? 'w-full' : '';

        // Custom dropdown arrow
        const bgImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
        const bgPosition = 'right 0.5rem center';
        const bgSize = '1.5em 1.5em';

        const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;
        const errorId = error ? `${selectId}-error` : undefined;

        return (
            <div className={`${widthStyles}`}>
                {label && (
                    <div className={`
                        w-full bg-[#8B5CF6] text-white
                        px-4 py-2 rounded-lg
                        font-bold text-sm tracking-wide lowercase
                        mb-1
                        ${labelClassName}
                    `}>
                        {label}
                        {required && <span className="text-white/80 ml-1">*</span>}
                    </div>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    disabled={disabled}
                    required={required}
                    aria-required={required}
                    aria-invalid={!!error}
                    aria-describedby={errorId}
                    style={{
                        backgroundImage: bgImage,
                        backgroundPosition: bgPosition,
                        backgroundSize: bgSize,
                        paddingRight: '2.5rem',
                    }}
                    className={`
            ${baseStyles}
            ${error ? errorStyles : normalStyles}
            ${disabled ? disabledStyles : ''}
            ${widthStyles}
            ${className}
          `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-xs text-gray-500 ml-1">{helperText}</p>
                )}
            </div>
        );
    }
);

StyledSelect.displayName = 'StyledSelect';
