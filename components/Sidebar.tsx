
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ui/ThemeToggle';

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  return (
    <aside className="hidden md:flex flex-col w-64 h-full rounded-2xl glass-sidebar dark:bg-gray-900/80 dark:border dark:border-gray-800 shadow-glass p-6 justify-between shrink-0 z-20 transition-colors duration-300">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="size-8 rounded-[10px] bg-primary flex items-center justify-center text-text-main">
            <span className="material-symbols-outlined text-xl">flight_takeoff</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-main dark:text-white text-lg font-bold leading-none">PorAí</h1>
            <span className="text-xs text-text-muted dark:text-gray-400 mt-1 font-medium tracking-wide uppercase">{user?.role || 'Viajante'}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id
                ? 'bg-primary text-text-main font-semibold shadow-sm scale-[1.02]'
                : 'text-text-muted dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-text-main dark:hover:text-white'
                }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? 'filled' : ''}`}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <ThemeToggle />
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#E8E6F3] to-[#F2F1F8] dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl relative overflow-hidden group cursor-pointer">
        <div className="relative z-10">
          <p className="text-sm font-bold text-text-main dark:text-white mb-1">Upgrade Plan</p>
          <p className="text-xs text-text-muted dark:text-gray-300 mb-3">Unlock more trips & shared vaults.</p>
          <button className="bg-white dark:bg-gray-900 text-text-main dark:text-white text-xs font-bold py-2 px-4 rounded-[8px] shadow-sm hover:shadow-md transition-shadow">
            Go Pro
          </button>
        </div>
        <div className="absolute -bottom-4 -right-4 size-20 bg-secondary/30 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
      </div>
    </aside>
  );
};

export default Sidebar;

