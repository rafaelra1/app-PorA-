import React, { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
    label?: string;
    value?: string; // Expects HH:mm
    onChange: (time: string) => void;
    error?: string;
    required?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    format?: '12h' | '24h';
}

const TimePicker: React.FC<TimePickerProps> = ({
    label,
    value = '09:00',
    onChange,
    error,
    required,
    fullWidth,
    disabled,
    format = '24h',
}) => {
    const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 9);
    const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);
    const [isPM, setIsPM] = useState(hours >= 12);
    const [focusedPart, setFocusedPart] = useState<'hours' | 'minutes' | 'ampm' | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h);
            setMinutes(m);
            setIsPM(h >= 12);
        }
    }, [value]);

    const updateTime = (newHours: number, newMinutes: number) => {
        const formattedHours = newHours.toString().padStart(2, '0');
        const formattedMinutes = newMinutes.toString().padStart(2, '0');
        onChange(`${formattedHours}:${formattedMinutes}`);
    };

    const incrementHours = () => {
        let next = (hours + 1) % 24;
        setHours(next);
        updateTime(next, minutes);
    };

    const decrementHours = () => {
        let next = (hours - 1 + 24) % 24;
        setHours(next);
        updateTime(next, minutes);
    };

    const incrementMinutes = () => {
        let next = (minutes + 5) % 60;
        // Round to nearest 5
        next = Math.floor(next / 5) * 5;
        setMinutes(next);
        updateTime(hours, next);
    };

    const decrementMinutes = () => {
        let next = (minutes - 5 + 60) % 60;
        next = Math.floor(next / 5) * 5;
        setMinutes(next);
        updateTime(hours, next);
    };

    const toggleAMPM = () => {
        const nextHours = isPM ? hours - 12 : hours + 12;
        setIsPM(!isPM);
        setHours(nextHours);
        updateTime(nextHours, minutes);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (focusedPart === 'hours') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                incrementHours();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                decrementHours();
            }
        } else if (focusedPart === 'minutes') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                incrementMinutes();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                decrementMinutes();
            }
        } else if (focusedPart === 'ampm') {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                toggleAMPM();
            }
        }
    };

    const displayHours = format === '12h'
        ? (hours % 12 || 12).toString().padStart(2, '0')
        : hours.toString().padStart(2, '0');

    const displayMinutes = minutes.toString().padStart(2, '0');

    return (
        <div
            className={`relative ${fullWidth ? 'w-full' : 'w-auto'}`}
            ref={containerRef}
            onKeyDown={handleKeyDown}
        >
            {label && (
                <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                    {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
                    {required && <span className="sr-only">(obrigatório)</span>}
                </label>
            )}

            <div
                role="group"
                aria-label="Seleção de horário"
                className={`
          flex items-center gap-2 p-1.5 bg-white border border-gray-200 rounded-xl transition-all
          focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${fullWidth ? 'w-full' : 'w-fit'}
        `}
            >
                {/* Hours */}
                <div className="flex flex-col items-center group/part">
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={incrementHours}
                        disabled={disabled}
                        className="size-6 text-text-muted hover:text-primary transition-colors flex items-center justify-center rounded-md"
                        aria-hidden="true"
                    >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                    </button>
                    <input
                        type="text"
                        value={displayHours}
                        readOnly
                        onFocus={() => setFocusedPart('hours')}
                        onBlur={() => setFocusedPart(null)}
                        className="w-10 text-center text-lg font-bold text-text-main border-none focus:ring-0 p-0 bg-transparent cursor-default selec-none"
                        aria-label={`${displayHours} horas. Use as setas para alterar.`}
                        disabled={disabled}
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={decrementHours}
                        disabled={disabled}
                        className="size-6 text-text-muted hover:text-primary transition-colors flex items-center justify-center rounded-md"
                        aria-hidden="true"
                    >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                    </button>
                </div>

                <span className="text-lg font-bold text-text-muted">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center group/part">
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={incrementMinutes}
                        disabled={disabled}
                        className="size-6 text-text-muted hover:text-primary transition-colors flex items-center justify-center rounded-md"
                        aria-hidden="true"
                    >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                    </button>
                    <input
                        type="text"
                        value={displayMinutes}
                        readOnly
                        onFocus={() => setFocusedPart('minutes')}
                        onBlur={() => setFocusedPart(null)}
                        className="w-10 text-center text-lg font-bold text-text-main border-none focus:ring-0 p-0 bg-transparent cursor-default select-none"
                        aria-label={`${displayMinutes} minutos. Use as setas para alterar.`}
                        disabled={disabled}
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={decrementMinutes}
                        disabled={disabled}
                        className="size-6 text-text-muted hover:text-primary transition-colors flex items-center justify-center rounded-md"
                        aria-hidden="true"
                    >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                    </button>
                </div>

                {format === '12h' && (
                    <button
                        type="button"
                        onClick={toggleAMPM}
                        onFocus={() => setFocusedPart('ampm')}
                        onBlur={() => setFocusedPart(null)}
                        disabled={disabled}
                        className={`
                    ml-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${isPM ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}
                    hover:brightness-95
                `}
                        aria-label={isPM ? 'PM. Clique para mudar para AM.' : 'AM. Clique para mudar para PM.'}
                    >
                        {isPM ? 'PM' : 'AM'}
                    </button>
                )}

                <div className="ml-auto pr-2">
                    <span className="material-symbols-outlined text-text-muted text-base" aria-hidden="true">schedule</span>
                </div>
            </div>

            {error && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
};

export default TimePicker;
