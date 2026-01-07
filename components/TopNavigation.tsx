import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationFeed, { MOCK_NOTIFICATIONS } from './NotificationFeed';

interface TopNavigationProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onOpenAddModal: () => void;
}

import { NAV_ITEMS } from '../constants';


const TopNavigation: React.FC<TopNavigationProps> = ({ activeTab, onTabChange, onOpenAddModal }) => {
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <header className="bg-white border-b border-gray-100 flex-none relative z-[100]">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="size-9 rounded-xl bg-sl-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">flight_takeoff</span>
                        </div>
                        <span className="font-bold text-xl text-sl-text hidden sm:block">PorAí</span>
                    </div>

                    {/* Center: Navigation Pills */}
                    <nav className="hidden md:flex items-center gap-1 bg-sl-bg rounded-full p-1">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === item.id
                                    ? 'bg-sl-text text-white shadow-sm'
                                    : 'text-text-muted hover:text-sl-text hover:bg-white'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Search Button */}
                        <button className="size-10 rounded-full bg-sl-bg hover:bg-sl-pastel-blue flex items-center justify-center text-text-muted hover:text-sl-primary transition-colors">
                            <span className="material-symbols-outlined text-xl">search</span>
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="size-10 rounded-full bg-sl-bg hover:bg-sl-pastel-yellow flex items-center justify-center text-text-muted hover:text-yellow-600 transition-colors relative"
                            >
                                <span className="material-symbols-outlined text-xl">notifications</span>
                                {MOCK_NOTIFICATIONS.some(n => !n.read) && (
                                    <span className="absolute top-1 right-1 size-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                    <NotificationFeed isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                                </>
                            )}
                        </div>


                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-sl-bg hover:bg-sl-pastel-purple transition-colors group"
                            >
                                <div className="size-8 rounded-full bg-gradient-to-br from-sl-primary to-sl-primary-dark flex items-center justify-center text-white font-bold text-sm">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="hidden lg:flex flex-col items-start">
                                    <span className="text-sm font-semibold text-sl-text leading-tight">{user?.name || 'Usuário'}</span>
                                    <span className="text-[10px] text-text-muted leading-tight">Explorer</span>
                                </div>
                                <span className="material-symbols-outlined text-base text-text-muted group-hover:text-sl-primary transition-colors">
                                    expand_more
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => { onTabChange('profile'); setShowProfileMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sl-text hover:bg-sl-bg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">person</span>
                                            Meu Perfil
                                        </button>
                                        <button
                                            onClick={() => { onTabChange('settings'); setShowProfileMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sl-text hover:bg-sl-bg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">settings</span>
                                            Configurações
                                        </button>
                                        <hr className="my-2 border-gray-100" />
                                        <button
                                            onClick={logout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                            Sair
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation (Bottom of Header) */}
            <div className="md:hidden overflow-x-auto hide-scrollbar border-t border-gray-50">
                <nav className="flex items-center gap-1 p-2 min-w-max">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${activeTab === item.id
                                ? 'bg-sl-text text-white'
                                : 'text-text-muted hover:bg-sl-bg'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default TopNavigation;
