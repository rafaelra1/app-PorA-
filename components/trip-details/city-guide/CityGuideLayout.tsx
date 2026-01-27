import React from 'react';
import { City, CityTab } from '../../../types';
import { CityFilter } from '../../ui/CityFilter';
import { CityGuideNavigation } from './CityGuideNavigation';
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
            <div className="mb-6 space-y-6">
                <h1 className="text-4xl font-bold text-[#1A1A1A] tracking-tight lowercase">
                    {selectedCity.name}
                </h1>

                <CityGuideNavigation
                    activeTab={activeCityTab}
                    onTabChange={onTabChange}
                />
            </div>

            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default CityGuideLayout;
