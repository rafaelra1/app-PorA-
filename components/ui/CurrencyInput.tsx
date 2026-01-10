import React, { useState, useEffect, useCallback } from 'react';

interface CurrencyInputProps {
    label?: string;
    value: number; // The numeric value (e.g. 1250.50)
    onChange: (value: number) => void;
    currency?: string; // e.g. 'BRL', 'USD', 'EUR'
    locale?: string; // e.g. 'pt-BR', 'en-US'
    placeholder?: string;
    error?: string;
    required?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    label,
    value,
    onChange,
    currency = 'BRL',
    locale = 'pt-BR',
    placeholder = '0,00',
    error,
    required,
    fullWidth,
    disabled,
    className = '',
}) => {
    const [displayValue, setDisplayValue] = useState('');

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    });

    // Extract digits from string
    const getDigits = (val: string) => val.replace(/\D/g, '');

    // Format a numeric value to display string
    const formatDisplay = useCallback((val: number) => {
        return formatter.format(val);
    }, [formatter]);

    useEffect(() => {
        // Only update display if it's different from current formatted value
        // This prevents cursor jumping while typing
        const currentFormatted = formatDisplay(value);
        if (displayValue !== currentFormatted && !focused) {
            setDisplayValue(currentFormatted);
        }
    }, [value, formatDisplay]);

    const [focused, setFocused] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = getDigits(e.target.value);
        const numeric = parseInt(raw, 10) / 100;

        if (isNaN(numeric)) {
            onChange(0);
            setDisplayValue('');
        } else {
            onChange(numeric);
            setDisplayValue(formatDisplay(numeric));
        }
    };

    const handleBlur = () => {
        setFocused(false);
        setDisplayValue(formatDisplay(value));
    };

    const handleFocus = () => {
        setFocused(true);
        // If value is 0, clear it for easier entry
        if (value === 0) setDisplayValue('');
    };

    const currencySymbol = formatter.formatToParts(0).find(p => p.type === 'currency')?.value || '';

    return (
        <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
            {label && (
                <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                    {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
                    {required && <span className="sr-only">(obrigatório)</span>}
                </label>
            )}

            <div className="relative group">
                <div className={`
            absolute left-4 top-1/2 -translate-y-1/2 font-bold text-text-muted transition-colors
            ${focused ? 'text-primary' : ''}
        `}>
                    {currencySymbol}
                </div>

                <input
                    type="text"
                    inputMode="decimal"
                    value={displayValue.replace(currencySymbol, '').trim()}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 
            focus:ring-2 focus:ring-primary focus:border-transparent 
            text-text-main font-bold placeholder-text-muted transition-all
            ${error ? 'border-red-500 bg-red-50/10' : 'bg-white'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
            ${className}
          `}
                    aria-invalid={!!error}
                    aria-label={`${label || 'Valor'}. Moeda: ${currency}.`}
                />

                {/* Subtle glow on focus */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>

            {error && (
                <p role="alert" className="mt-1 text-xs text-red-600 animate-in fade-in duration-200">
                    {error}
                </p>
            )}
        </div>
    );
};

export default CurrencyInput;
