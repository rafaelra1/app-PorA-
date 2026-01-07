import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import usePlacesAutocomplete from 'use-places-autocomplete';

export interface PlaceSearchResult {
    name: string;
    address: string;
    location?: { lat: number; lng: number };
    placeId: string;
    description: string;
}

interface PlaceSearchInputProps {
    onSelect: (data: PlaceSearchResult) => void;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
    onSelect,
    placeholder,
    value: externalValue,
    onChange: externalOnChange
}) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            // No type restriction to allow searching establishment, geocode, etc.
            types: [],
            language: 'pt-BR'
        },
        debounce: 400,
        defaultValue: externalValue || ''
    });

    // Sync with external value updates
    useEffect(() => {
        if (externalValue !== undefined && externalValue !== value) {
            setValue(externalValue, false);
        }
    }, [externalValue, setValue]);

    const inputContainerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyles, setDropdownStyles] = useState<{ top: number; left: number; width: number } | null>(null);

    // Update dropdown position when suggestions appear
    useEffect(() => {
        if (status === "OK" && inputContainerRef.current) {
            const rect = inputContainerRef.current.getBoundingClientRect();
            setDropdownStyles({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width
            });
        } else {
            setDropdownStyles(null);
        }
    }, [status, value]);

    const handleSelect = useCallback((placeId: string, description: string) => {
        setValue(description, false);
        clearSuggestions();
        setDropdownStyles(null);

        const service = new google.maps.places.PlacesService(document.createElement('div'));

        service.getDetails(
            { placeId, fields: ['name', 'formatted_address', 'geometry', 'place_id'] },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    const result: PlaceSearchResult = {
                        name: place.name || '',
                        address: place.formatted_address || '',
                        location: place.geometry?.location ? {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        } : undefined,
                        placeId: place.place_id || placeId,
                        description: description
                    };

                    onSelect(result);

                    if (externalOnChange) {
                        externalOnChange(description);
                    }
                }
            }
        );
    }, [setValue, clearSuggestions, onSelect, externalOnChange]);

    return (
        <div className="relative w-full" ref={inputContainerRef}>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400">location_on</span>
                <input
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (externalOnChange) externalOnChange(e.target.value);
                    }}
                    disabled={!ready}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 font-medium bg-white"
                    placeholder={placeholder || "Buscar local..."}
                />
            </div>

            {/* Suggestions Dropdown */}
            {status === "OK" && dropdownStyles && createPortal(
                <div
                    className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                    style={dropdownStyles}
                >
                    {data.map(({ place_id, description, structured_formatting }) => (
                        <button
                            key={place_id}
                            onClick={() => handleSelect(place_id, description)}
                            className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                        >
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{structured_formatting.main_text}</div>
                                <div className="text-xs text-gray-500">{structured_formatting.secondary_text}</div>
                            </div>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};
