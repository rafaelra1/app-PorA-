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



            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default CityGuideLayout;
