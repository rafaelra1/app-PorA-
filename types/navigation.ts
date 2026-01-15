/**
 * Navigation Types for Trip Details Sidebar
 * Defines the structure for guided question-style navigation
 */

import { SubTab } from '../types';

/**
 * Navigation item with question-based format
 * Used for both main nav items and nested children (cities, logistics)
 */
export interface NavQuestion {
    id: SubTab;

    // Text content
    question: string;           // Main question (expanded mode)
    shortLabel: string;         // Short label (compact mode tooltip)
    description?: string;       // Helper description

    // Visual styling
    icon: string;               // Material Symbol name
    gradient: string;           // Tailwind gradient classes
    iconColor: string;          // Icon color when inactive

    // State indicators
    badge?: number;             // Counter badge (e.g., number of items)
    progress?: number;          // 0-100, section completion progress
    isComplete?: boolean;       // Section fully complete?

    // Nested navigation
    children?: NavQuestion[];   // Child items (cities, logistics sub-items)
    isExpanded?: boolean;       // Is sub-navigation expanded?
}

/**
 * Sidebar component state
 * Persisted to localStorage for user preference
 */
export interface SidebarState {
    isCollapsed: boolean;
    expandedItems: string[];    // IDs of items with expanded sub-navigation
    activeTab: SubTab;
}

/**
 * Props for building navigation with dynamic data
 */
export interface NavBuildContext {
    tripStats: {
        cities?: number;
        days?: number;
        hotels?: number;
        transports?: number;
        documents?: number;
        expenses?: number;
        activities?: number;
        checklistComplete?: number;
        checklistTotal?: number;
    };
    cities: Array<{
        id: string;
        name: string;
    }>;
    selectedCityId?: string;
}
