import React from 'react';
import { City } from '../../types';

interface CityFilterProps {
    cities: City[];
    selectedCityId: string | null;
    onCityChange: (city: City) => void;
    className?: string;
}

/**
 * Reusable city filter component for switching between cities.
 * Used in PreTripBriefingView and CityGuideLayout.
 */
export const CityFilter: React.FC<CityFilterProps> = ({
    cities,
    selectedCityId,
    onCityChange,
    className = ''
}) => {
    if (!cities || cities.length === 0) {
        return null;
    }

    return (
        <div className={`flex justify-start ${className}`}>
            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {cities.map(city => (
                    <button
                        key={city.id}
                        onClick={() => onCityChange(city)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${selectedCityId === city.id
                                ? 'bg-white text-text-main shadow-sm'
                                : 'text-text-muted hover:text-text-main hover:bg-gray-200/50'
                            }`}
                    >
                        {city.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CityFilter;
