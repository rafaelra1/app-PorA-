
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationFeed from './NotificationFeed';

interface ProfileMenuProps {
  onNavigate?: (tab: string) => void;
}

const Header: React.FC<ProfileMenuProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  const handleMenuItemClick = (action: string) => {
    setIsProfileOpen(false);

    switch (action) {
      case 'profile':
        onNavigate?.('profile');
        break;
      case 'travels':
        onNavigate?.('travels');
        break;
      case 'documents':
        onNavigate?.('documents');
        break;
      case 'settings':
        onNavigate?.('settings');
        break;
      case 'help':
        console.log('Open help');
        break;
      case 'logout':
        logout();
        break;
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 shrink-0 px-2 md:px-0">
      <div className="relative flex-1 max-w-md hidden md:block">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-gray-400">search</span>
        <input
          className="w-full h-12 pl-12 pr-4 rounded-[10px] bg-white dark:bg-gray-800 border-none shadow-sm text-sm text-text-main dark:text-white focus:ring-2 focus:ring-primary/50 placeholder:text-text-muted/70 dark:placeholder:text-gray-500 transition-colors"
          placeholder="Search destinations, flights..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="size-10 rounded-[10px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border border-white dark:border-gray-800"></span>
          </button>
          <NotificationFeed
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 pl-2 pr-4 py-1.5 rounded-[10px] shadow-sm cursor-pointer hover:shadow-md transition-all"
          >
            <img
              alt="User Avatar"
              className="size-8 rounded-[8px] object-cover"
              src={user?.avatar}
            />
            <span className="text-sm font-bold text-text-main dark:text-white hidden sm:block">{user?.name}</span>
            <span className={`material-symbols-outlined text-text-muted dark:text-gray-400 text-sm hidden sm:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <img
                    alt="User Avatar"
                    className="size-12 rounded-xl object-cover"
                    src={user?.avatar}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-main dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-text-muted dark:text-gray-400 truncate">{user?.role || 'Viajante'}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => handleMenuItemClick('profile')}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-text-muted dark:text-gray-400 text-xl">person</span>
                  <span className="text-sm font-medium text-text-main dark:text-white">Meu Perfil</span>
                </button>

                <button
                  onClick={() => handleMenuItemClick('travels')}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-text-muted dark:text-gray-400 text-xl">luggage</span>
                  <span className="text-sm font-medium text-text-main dark:text-white">Minhas Viagens</span>
                </button>

                <button
                  onClick={() => handleMenuItemClick('documents')}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-text-muted dark:text-gray-400 text-xl">folder_open</span>
                  <span className="text-sm font-medium text-text-main dark:text-white">Documentos</span>
                </button>

                <button
                  onClick={() => handleMenuItemClick('settings')}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-text-muted dark:text-gray-400 text-xl">settings</span>
                  <span className="text-sm font-medium text-text-main dark:text-white">Configurações</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

              {/* Bottom Section */}
              <div className="py-2">
                <button
                  onClick={() => handleMenuItemClick('help')}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-text-muted dark:text-gray-400 text-xl">help</span>
                  <span className="text-sm font-medium text-text-main dark:text-white">Ajuda & Suporte</span>
                </button>

                <button
                  onClick={() => handleMenuItemClick('logout')}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">logout</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
