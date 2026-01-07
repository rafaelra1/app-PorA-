import React, { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    autoResize?: boolean;
    maxLength?: number;
    showCharCount?: boolean;
}

/**
 * Reusable Textarea component with consistent styling
 * Supports labels, error states, auto-resize, and character count
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            error,
            helperText,
            fullWidth = false,
            autoResize = false,
            maxLength,
            showCharCount = false,
            className = '',
            disabled,
            value,
            ...props
        },
        ref
    ) => {
        const internalRef = useRef<HTMLTextAreaElement | null>(null);
        const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

        const baseStyles =
            'px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:outline-none focus:ring-2 resize-none';
        const normalStyles =
            'border-gray-100 bg-gray-50 focus:ring-primary focus:border-primary';
        const errorStyles = 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500';
        const disabledStyles = 'opacity-50 cursor-not-allowed';
        const widthStyles = fullWidth ? 'w-full' : '';

        // Auto-resize logic
        useEffect(() => {
            if (autoResize && textareaRef.current) {
                const textarea = textareaRef.current;
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        }, [value, autoResize, textareaRef]);

        const charCount = typeof value === 'string' ? value.length : 0;
        const showCount = showCharCount || maxLength;

        return (
            <div className={`${widthStyles}`}>
                {label && (
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                        {label}
                    </label>
                )}
                <textarea
                    ref={textareaRef}
                    disabled={disabled}
                    value={value}
                    maxLength={maxLength}
                    className={`
            ${baseStyles}
            ${error ? errorStyles : normalStyles}
            ${disabled ? disabledStyles : ''}
            ${widthStyles}
            ${className}
          `}
                    {...props}
                />
                <div className="flex justify-between items-center mt-1">
                    <div className="flex-1">
                        {error && <p className="text-xs text-red-600">{error}</p>}
                        {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
                    </div>
                    {showCount && (
                        <p className="text-xs text-text-muted ml-2">
                            {charCount}
                            {maxLength && `/${maxLength}`}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export default Textarea;
