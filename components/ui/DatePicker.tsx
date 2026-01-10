import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    isToday,
    parse
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
    label?: string;
    value?: string; // Expects DD/MM/YYYY
    onChange: (date: string) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    placeholder = 'DD/MM/AAAA',
    error,
    required,
    fullWidth,
    disabled,
    minDate,
    maxDate,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [focusedDate, setFocusedDate] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Parse initial value
    useEffect(() => {
        if (value) {
            try {
                const parsed = parse(value, 'dd/MM/yyyy', new Date());
                if (!isNaN(parsed.getTime())) {
                    setCurrentMonth(parsed);
                    setFocusedDate(parsed);
                }
            } catch (e) {
                // Fallback to today
            }
        }
    }, [value]);

    const handleToggle = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
    };

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, handleClose]);

    const handleDateSelect = (date: Date) => {
        onChange(format(date, 'dd/MM/yyyy'));
        handleClose();
        inputRef.current?.focus();
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const daysInMonth = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        let nextFocus = new Date(focusedDate);

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                nextFocus = addDays(focusedDate, 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                nextFocus = addDays(focusedDate, -1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                nextFocus = addDays(focusedDate, 7);
                break;
            case 'ArrowUp':
                e.preventDefault();
                nextFocus = addDays(focusedDate, -7);
                break;
            case 'PageUp':
                e.preventDefault();
                nextFocus = subMonths(focusedDate, 1);
                break;
            case 'PageDown':
                e.preventDefault();
                nextFocus = addMonths(focusedDate, 1);
                break;
            case 'Home':
                e.preventDefault();
                nextFocus = startOfWeek(focusedDate);
                break;
            case 'End':
                e.preventDefault();
                nextFocus = endOfWeek(focusedDate);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                handleDateSelect(focusedDate);
                return;
            case 'Escape':
                e.preventDefault();
                handleClose();
                inputRef.current?.focus();
                return;
            case 'Tab':
                // Let natural tab happen
                return;
            default:
                return;
        }

        setFocusedDate(nextFocus);
        if (!isSameMonth(nextFocus, currentMonth)) {
            setCurrentMonth(nextFocus);
        }
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const statusId = `datepicker-status-${Math.random().toString(36).substr(2, 9)}`;

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

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    readOnly
                    onClick={handleToggle}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-haspopup="grid"
                    aria-expanded={isOpen}
                    className={`
            w-full px-4 py-3 rounded-xl border border-gray-200 
            focus:ring-2 focus:ring-primary focus:border-transparent 
            text-text-main placeholder-text-muted cursor-pointer
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
                />
                <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted pointer-events-none"
                    aria-hidden="true"
                >
                    calendar_month
                </span>
            </div>

            {error && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}

            {/* Screen Reader Status */}
            <div id={statusId} role="status" aria-live="polite" className="sr-only">
                {isOpen ? `Calendário aberto. Mês atual: ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}. Use as setas para navegar.` : 'Calendário fechado.'}
            </div>

            {isOpen && (
                <div
                    className="absolute z-50 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 min-w-[320px] animate-in fade-in zoom-in-95 duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Escolha uma data"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-text-main capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="size-8 rounded-lg hover:bg-background-light flex items-center justify-center text-text-muted transition-colors"
                                aria-label="Mês anterior"
                            >
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="size-8 rounded-lg hover:bg-background-light flex items-center justify-center text-text-muted transition-colors"
                                aria-label="Próximo mês"
                            >
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div role="grid" aria-labelledby={statusId} className="grid grid-cols-7 gap-1">
                        {weekDays.map(day => (
                            <div key={day} className="h-8 flex items-center justify-center text-[10px] font-bold text-text-muted uppercase tracking-tighter" role="columnheader">
                                {day}
                            </div>
                        ))}

                        {daysInMonth().map((date, i) => {
                            const isSelected = value ? isSameDay(date, parse(value, 'dd/MM/yyyy', new Date())) : false;
                            const isCurrentMonth = isSameMonth(date, currentMonth);
                            const isFoc = isSameDay(date, focusedDate);
                            const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => !isDisabled && handleDateSelect(date)}
                                    disabled={isDisabled}
                                    aria-selected={isSelected}
                                    aria-current={isToday(date) ? 'date' : undefined}
                                    tabIndex={isFoc ? 0 : -1}
                                    className={`
                    size-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center relative
                    ${!isCurrentMonth ? 'text-text-muted opacity-30' : 'text-text-main'}
                    ${isSelected ? 'bg-primary text-white shadow-md' : 'hover:bg-primary-light hover:text-primary-dark'}
                    ${isFoc && !isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                    ${isDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                    ${isToday(date) && !isSelected ? 'text-primary font-bold' : ''}
                  `}
                                    role="gridcell"
                                    aria-label={format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                >
                                    {format(date, 'd')}
                                    {isToday(date) && (
                                        <span className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Shortcuts / Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
                        <button
                            type="button"
                            onClick={() => handleDateSelect(new Date())}
                            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-xs font-bold text-text-muted hover:text-text-main transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
