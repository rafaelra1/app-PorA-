import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    // Modal states
    isAddModalOpen: boolean;
    isMobileMenuOpen: boolean;

    // Navigation
    activeTab: string;

    // Modal controls
    openAddModal: () => void;
    closeAddModal: () => void;
    toggleMobileMenu: () => void;
    setActiveTab: (tab: string) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const openAddModal = () => setIsAddModalOpen(true);
    const closeAddModal = () => setIsAddModalOpen(false);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <UIContext.Provider
            value={{
                isAddModalOpen,
                isMobileMenuOpen,
                activeTab,
                openAddModal,
                closeAddModal,
                toggleMobileMenu,
                setActiveTab,
            }}
        >
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
};
