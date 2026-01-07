import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * Reusable Input component with consistent styling
 * Supports labels, error states, icons, and helper text
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:outline-none focus:ring-2';
        const normalStyles =
            'border-gray-100 bg-gray-50 focus:ring-primary focus:border-primary';
        const errorStyles = 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500';
        const disabledStyles = 'opacity-50 cursor-not-allowed';
        const widthStyles = fullWidth ? 'w-full' : '';

        const iconPadding = leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '';

        return (
            <div className={`${widthStyles}`}>
                {label && (
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        disabled={disabled}
                        className={`
              ${baseStyles}
              ${error ? errorStyles : normalStyles}
              ${disabled ? disabledStyles : ''}
              ${iconPadding}
              ${widthStyles}
              ${className}
            `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1 text-xs text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
