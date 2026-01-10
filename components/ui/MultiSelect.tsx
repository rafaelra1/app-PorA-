import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    label?: string;
    options: Option[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    maxItems?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    options,
    selectedValues,
    onChange,
    placeholder = 'Selecione...',
    error,
    required,
    fullWidth,
    disabled,
    maxItems,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);

    const filteredOptions = options.filter(
        (opt) =>
            !selectedValues.includes(opt.value) &&
            opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleToggle = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleSelect = useCallback((value: string) => {
        if (maxItems && selectedValues.length >= maxItems) return;
        onChange([...selectedValues, value]);
        setInputValue('');
        setFocusedIndex(-1);
        inputRef.current?.focus();
    }, [selectedValues, onChange, maxItems]);

    const handleRemove = useCallback((value: string) => {
        onChange(selectedValues.filter(v => v !== value));
        inputRef.current?.focus();
    }, [selectedValues, onChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) setIsOpen(true);
                setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && focusedIndex >= 0) {
                    handleSelect(filteredOptions[focusedIndex].value);
                } else if (!isOpen) {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            case 'Backspace':
                if (inputValue === '' && selectedValues.length > 0) {
                    handleRemove(selectedValues[selectedValues.length - 1]);
                }
                break;
            default:
                break;
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const countId = `multiselect-count-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `multiselect-error-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div
            className={`relative ${fullWidth ? 'w-full' : 'w-auto'}`}
            ref={containerRef}
        >
            {label && (
                <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                    {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
                    {required && <span className="sr-only">(obrigatório)</span>}
                </label>
            )}

            <div
                onClick={handleToggle}
                className={`
          min-h-[50px] p-2 flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-xl transition-all
          ${isOpen ? 'ring-2 ring-primary border-transparent' : ''}
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-text'}
        `}
                aria-describedby={`${countId} ${error ? errorId : ''}`}
            >
                {selectedValues.map(val => {
                    const opt = options.find(o => o.value === val);
                    return (
                        <span
                            key={val}
                            className="px-2.5 py-1 bg-primary-light text-primary-dark rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in zoom-in-95 duration-150"
                        >
                            {opt?.label || val}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(val);
                                }}
                                disabled={disabled}
                                className="size-4 rounded-full hover:bg-primary-dark/10 flex items-center justify-center transition-colors"
                                aria-label={`Remover ${opt?.label || val}`}
                            >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        </span>
                    );
                })}

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        setFocusedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedValues.length === 0 ? placeholder : ''}
                    disabled={disabled}
                    className="flex-1 min-w-[60px] bg-transparent border-none focus:ring-0 p-1 text-sm text-text-main placeholder-text-muted"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                />

                <div className="ml-auto flex items-center gap-2 px-1">
                    <span id={countId} className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {selectedValues.length} selecionados
                    </span>
                    <span className={`material-symbols-outlined text-text-muted text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                    </span>
                </div>
            </div>

            {error && (
                <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}

            {isOpen && filteredOptions.length > 0 && (
                <ul
                    ref={listboxRef}
                    role="listbox"
                    className="absolute z-50 w-full mt-2 py-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200"
                >
                    {filteredOptions.map((opt, index) => (
                        <li
                            key={opt.value}
                            role="option"
                            aria-selected={focusedIndex === index}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(opt.value);
                            }}
                            onMouseEnter={() => setFocusedIndex(index)}
                            className={`
                px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer
                ${focusedIndex === index ? 'bg-primary-light text-primary-dark' : 'text-text-main hover:bg-background-light'}
              `}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MultiSelect;
