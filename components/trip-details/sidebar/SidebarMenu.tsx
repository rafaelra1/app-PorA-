import React, { useState, useEffect } from 'react';
import { SubTab, CityTab } from '../../../types'; // Ensure CityTab is imported or defined
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarMenuProps {
    activeTab: SubTab;
    activeCityTab?: CityTab; // New prop for city internal state
    onTabChange: (tab: SubTab) => void;
    onCityTabChange?: (tab: CityTab) => void; // New prop for city internal state
    cities?: { id: string; name: string }[];
}

const MENU_ITEMS = [
    { id: 'cities' as SubTab, label: 'cidades', hasSubmenu: true },
    { id: 'itinerary' as SubTab, label: 'roteiro', hasSubmenu: false },
    { id: 'budget' as SubTab, label: 'custos', hasSubmenu: false },
    { id: 'journal' as SubTab, label: 'memórias', hasSubmenu: true },
];

const CITY_SUB_ITEMS: { id: CityTab | 'transporte' | 'pesquisas', label: string, icon: string }[] = [
    { id: 'info', label: 'o que saber antes', icon: 'help' },
    { id: 'accommodation', label: 'onde dormir', icon: 'bed' }, // Mapped to accommodation logic
    { id: 'attractions', label: 'o que fazer', icon: 'camera_alt' },
    { id: 'gastronomy', label: 'comer & beber', icon: 'restaurant' }, // Combined for simplicity or split? Design says "o que comer" and "onde comer". Let's map appropriately.
    // Design: o que comer (Typical Dishes), onde comer (Restaurants)
    // Current CityGuide has 'gastronomy' (Restaurants) and 'typicalDishes' inside 'info' or separate?
    // Let's stick to existing CityTab keys where possible or map new ones.
    // Existing: 'info', 'attractions', 'gastronomy', 'tips', 'timeline', 'map'
    // Design Requests:
    // 1. o que saber antes -> 'info'
    // 2. onde dormir -> 'accommodation' (We need to handle this view in CityHub)
    // 3. o que fazer -> 'attractions'
    // 4. o que comer -> 'typical_dishes' (New or part of Gastronomy)
    // 5. onde comer -> 'gastronomy'
    // 6. transporte -> 'transport' (New)
    // 7. pesquisas -> 'search' (New)
];

// Extended CityTab type locally if needed or mapped to string
// We'll pass the ID and let Parent handle it.

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeTab, activeCityTab, onTabChange, onCityTabChange, cities = [] }) => {
    const [expanded, setExpanded] = useState<string | null>('cities');

    // Auto-expand if active tab is inside cities
    useEffect(() => {
        if (activeTab.startsWith('city-') || activeTab === 'cities') {
            setExpanded('cities');
        }
    }, [activeTab]);

    const handleClick = (item: typeof MENU_ITEMS[0]) => {
        if (item.hasSubmenu) {
            setExpanded(expanded === item.id ? null : item.id);
            if (item.id !== 'cities') onTabChange(item.id); // Cities doesn't nav on toggle, only on sub-click
            else if (!activeTab.startsWith('city-')) onTabChange('cities'); // If clicking header and not in a city, go to list
        } else {
            onTabChange(item.id);
        }
    };

    const handleCityClick = (cityId: string) => {
        onTabChange(`city-${cityId}` as SubTab);
        if (onCityTabChange) onCityTabChange('info'); // Reset to info when switching city
    };

    const handleCitySubClick = (subId: string) => {
        if (onCityTabChange) onCityTabChange(subId as CityTab);
    };

    return (
        <div className="flex flex-col gap-2">
            {MENU_ITEMS.map((item) => {
                const isGroupActive = activeTab === item.id || (item.id === 'cities' && activeTab.startsWith('city-'));
                const isExpanded = expanded === item.id;

                return (
                    <div key={item.id} className="flex flex-col">
                        <button
                            onClick={() => handleClick(item)}
                            className={`
                w-full text-left px-5 py-3 rounded-xl font-bold flex items-center justify-between transition-all
                ${isGroupActive ? 'bg-[#FFD93D] text-[#1A1A1A] shadow-sm' : 'bg-white text-[#1A1A1A] hover:bg-gray-50 border border-transparent'}
              `}
                        >
                            <span className="text-sm lowercase font-medium">{item.label}</span>
                            {item.hasSubmenu && (
                                <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    keyboard_arrow_down
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isExpanded && item.id === 'cities' && cities.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-col gap-1 pl-0 mt-2">
                                        {cities.map((city) => {
                                            const isCityActive = activeTab === `city-${city.id}`;

                                            return (
                                                <div key={city.id} className="flex flex-col">
                                                    <button
                                                        onClick={() => handleCityClick(city.id)}
                                                        className={`
                                                            w-full text-left px-5 py-2.5 flex items-center justify-between transition-colors
                                                            ${isCityActive ? 'font-bold text-[#1A1A1A] bg-gray-50' : 'text-gray-500 hover:text-[#1A1A1A]'}
                                                        `}
                                                    >
                                                        <span className="text-sm lowercase truncate">{city.name}</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

