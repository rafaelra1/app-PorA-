import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    rightIcon?: React.ReactNode;
    leftIcon?: React.ReactNode;
    fullWidth?: boolean;
    labelClassName?: string;
    containerClassName?: string;
    helperText?: string;
}

export const StyledInput = forwardRef<HTMLInputElement, StyledInputProps>(
    (
        {
            label,
            error,
            rightIcon,
            leftIcon,
            helperText,
            fullWidth = false,
            className = '',
            labelClassName = '',
            containerClassName = '',
            ...props
        },
        ref
    ) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
                {/* Visual Label Bar */}
                <div className={`
                    w-full bg-[#8B5CF6] text-white
                    px-4 py-2 rounded-lg
                    font-bold text-sm tracking-wide lowercase
                    mb-1
                    ${labelClassName}
                `}>
                    {label}
                </div>

                {/* Input Area */}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            w-full px-4 py-3
                            ${leftIcon ? 'pl-12' : ''}
                            bg-white border text-gray-900 border-gray-400
                            rounded-lg
                            placeholder-gray-400 font-medium
                            focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]
                            transition-colors
                            ${error ? 'border-red-300 focus:border-red-500' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-xs text-red-500 font-medium ml-1">
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

StyledInput.displayName = 'StyledInput';
