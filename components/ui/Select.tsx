import React, { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    fullWidth?: boolean;
}

/**
 * Reusable Select component with consistent styling
 * Supports labels, error states, and helper text
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
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
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:outline-none focus:ring-2 appearance-none bg-no-repeat';
        const normalStyles =
            'border-gray-100 bg-gray-50 focus:ring-primary focus:border-primary';
        const errorStyles = 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500';
        const disabledStyles = 'opacity-50 cursor-not-allowed';
        const widthStyles = fullWidth ? 'w-full' : '';

        // Custom dropdown arrow
        const bgImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
        const bgPosition = 'right 0.5rem center';
        const bgSize = '1.5em 1.5em';

        return (
            <div className={`${widthStyles}`}>
                {label && (
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    disabled={disabled}
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
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1 text-xs text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
