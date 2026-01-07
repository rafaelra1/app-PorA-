import React, { useState } from 'react';
import { City, CityTab } from '../../../types';
import { Badge } from '../../ui/Base';
import { CITY_GUIDE_TABS, DEFAULT_CITY_PLACEHOLDER } from '../../../constants';
import { Loader2, Sparkles } from 'lucide-react';
import { getGeminiService } from '../../../services/geminiService';

interface CityGuideLayoutProps {
    selectedCity: City;
    allCities?: City[];
    activeCityTab: CityTab;
    onBack: () => void;
    onTabChange: (tab: CityTab) => void;
    onCityChange?: (city: City) => void;
    children: React.ReactNode;
}

const CityGuideLayout: React.FC<CityGuideLayoutProps> = ({
    selectedCity,
    allCities,
    activeCityTab,
    onBack,
    onTabChange,
    onCityChange,
    children
}) => {
    return (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500 pb-10 text-left">
            <div className="flex justify-start mb-6">
                {/* City Switcher */}
                {allCities && allCities.length > 0 && (
                    <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                        <button
                            onClick={onBack}
                            className="px-4 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all text-text-muted hover:text-text-main hover:bg-gray-200/50"
                        >
                            Todas
                        </button>
                        {allCities.map(city => (
                            <button
                                key={city.id}
                                onClick={() => onCityChange && onCityChange(city)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${selectedCity.id === city.id
                                    ? 'bg-white text-text-main shadow-sm'
                                    : 'text-text-muted hover:text-text-main hover:bg-gray-200/50'
                                    }`}
                            >
                                {city.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>



            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default CityGuideLayout;
