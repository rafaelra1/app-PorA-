import React, { useState, useMemo } from 'react';
import { SubTab, City } from '../../../types';
import { NavQuestion } from '../../../types/navigation';
import { TRIP_NAV_QUESTIONS } from '../../../constants/tripNavigation';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useIsMobile } from '../../../hooks/useMediaQuery';

import NavItemExpanded from './NavItemExpanded';
import NavItemCompact from './NavItemCompact';
import CollapseToggle from './CollapseToggle';
import MobileDrawer from './MobileDrawer';
import { Icon } from '../../ui/Base';

interface TripStats {
    cities?: number;
    days?: number;
    hotels?: number;
    transports?: number;
    documents?: number;
    expenses?: number;
    activities?: number;
    checklistComplete?: number;
    checklistTotal?: number;
}

interface TripNavigationSidebarProps {
    activeTab: SubTab;
    onTabChange: (tab: SubTab) => void;
    tripStats: TripStats;
    cities: City[];
    onCitySelect?: (city: City) => void;
    selectedCityId?: string;
}

/**
 * Main navigation sidebar component
 * Handles collapsed/expanded states and mobile drawer
 */
export const TripNavigationSidebar: React.FC<TripNavigationSidebarProps> = ({
    activeTab,
    onTabChange,
    tripStats,
    cities,
    onCitySelect,
    selectedCityId,
}) => {
    // Collapse state persisted to localStorage
    const [isCollapsed, setIsCollapsed] = useLocalStorage('porai_sidebar_collapsed', false);

    // Expanded sub-items
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Mobile state
    const isMobile = useIsMobile();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Build nav items with dynamic data
    const navItems = useMemo(() => {
        return TRIP_NAV_QUESTIONS.map((item): NavQuestion => {
            const enhanced = { ...item };

            // Add badges based on tripStats
            switch (item.id) {
                case 'itinerary':
                    enhanced.badge = tripStats.activities;
                    break;
                case 'cities':
                    enhanced.badge = tripStats.cities;
                    // Add city children dynamically
                    if (cities.length > 0) {
                        enhanced.children = cities.map((city) => ({
                            id: `city-${city.id}` as SubTab,
                            question: `Explorar ${city.name}`,
                            shortLabel: city.name,
                            icon: 'location_on',
                            gradient: 'from-cyan-400 to-teal-500',
                            iconColor: 'text-cyan-500',
                        }));
                    }
                    break;
                case 'logistics':
                    enhanced.badge = (tripStats.hotels || 0) + (tripStats.transports || 0);
                    // Update children badges
                    if (enhanced.children) {
                        enhanced.children = enhanced.children.map((child) => {
                            if (child.id === 'accommodation') {
                                return { ...child, badge: tripStats.hotels };
                            }
                            if (child.id === 'transport') {
                                return { ...child, badge: tripStats.transports };
                            }
                            return child;
                        });
                    }
                    break;
                case 'docs':
                    enhanced.badge = tripStats.documents;
                    break;
                case 'budget':
                    enhanced.badge = tripStats.expenses;
                    break;
                case 'checklist':
                    if (tripStats.checklistTotal && tripStats.checklistTotal > 0) {
                        enhanced.progress = Math.round(
                            ((tripStats.checklistComplete || 0) / tripStats.checklistTotal) * 100
                        );
                    }
                    break;
            }

            return enhanced;
        });
    }, [tripStats, cities]);

    // Toggle sub-item expansion
    const toggleExpanded = (itemId: string) => {
        setExpandedItems((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Handle tab change (close mobile drawer)
    const handleTabChange = (tab: SubTab) => {
        onTabChange(tab);
        if (isMobile) {
            setIsMobileOpen(false);
        }
    };

    // Navigation content (shared between desktop and mobile)
    const renderNavContent = () => (
        <nav
            role="navigation"
            aria-label="Navegação da viagem"
            data-sidebar
            className="space-y-1"
        >
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const isExpanded = expandedItems.includes(item.id);

                if (isCollapsed && !isMobile) {
                    return (
                        <NavItemCompact
                            key={item.id}
                            item={item}
                            isActive={isActive}
                            onClick={() => handleTabChange(item.id)}
                        />
                    );
                }

                return (
                    <NavItemExpanded
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        onClick={() => handleTabChange(item.id)}
                        onToggleExpand={() => toggleExpanded(item.id)}
                        isExpanded={isExpanded}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />
                );
            })}
        </nav>
    );

    // Mobile: hamburger button + drawer
    if (isMobile) {
        return (
            <>
                {/* Mobile trigger button */}
                <button
                    onClick={() => setIsMobileOpen(true)}
                    aria-label="Abrir menu de navegação"
                    className="
            fixed bottom-6 left-6 z-30
            w-14 h-14 rounded-full
            bg-gradient-to-br from-violet-500 to-purple-600
            text-white shadow-lg
            flex items-center justify-center
            transition-transform active:scale-95
          "
                >
                    <Icon name="menu" className="text-2xl" />
                </button>

                {/* Mobile drawer */}
                <MobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)}>
                    {renderNavContent()}
                </MobileDrawer>
            </>
        );
    }

    // Desktop: fixed sidebar
    return (
        <aside
            className={`
        shrink-0 h-full bg-white border-r border-gray-100
        transition-all duration-300 ease-out
        overflow-y-auto overflow-x-hidden hide-scrollbar
        ${isCollapsed ? 'w-[72px]' : 'w-[280px]'}
      `}
        >
            {/* Header with collapse toggle */}
            <div
                className={`
          sticky top-0 z-10 bg-white border-b border-gray-100
          flex items-center p-3
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}
            >
                {!isCollapsed && (
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Menu
                    </h2>
                )}
                <CollapseToggle
                    isCollapsed={isCollapsed}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* Navigation items */}
            <div className="p-3">
                {renderNavContent()}
            </div>
        </aside>
    );
};

export default TripNavigationSidebar;
