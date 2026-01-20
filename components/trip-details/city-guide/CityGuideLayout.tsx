import React from 'react';
import { City, CityTab } from '../../../types';
import { CityFilter } from '../../ui/CityFilter';
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
            {/* City Switcher */}
            <CityFilter
                cities={allCities || []}
                selectedCityId={selectedCity.id}
                onCityChange={(city) => onCityChange && onCityChange(city)}
                className="mb-6"
            />
            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
                {CITY_GUIDE_TABS.map(tab => {
                    const isActive = activeCityTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${isActive
                                ? 'text-accent-main border-accent-main'
                                : 'text-text-muted border-transparent hover:text-text-main'
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default CityGuideLayout;
