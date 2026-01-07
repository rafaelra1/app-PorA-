import React from 'react';
import { Icon } from '../ui/Base';

export type AppView = 'dashboard' | 'calendar' | 'trips' | 'documents' | 'journal' | 'assistant';

interface AppSidebarProps {
    currentView: AppView;
    onChangeView: (view: AppView) => void;
}

const navItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' }, // Using grid_view for dashboard
    { id: 'calendar', label: 'Calendário', icon: 'calendar_month' },
    { id: 'trips', label: 'Minhas Viagens', icon: 'luggage' },
    { id: 'documents', label: 'Documentos', icon: 'folder_open' },
    { id: 'journal', label: 'Diário', icon: 'book' },
    { id: 'assistant', label: 'Assistente IA', icon: 'smart_toy' },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ currentView, onChangeView }) => {
    return (
        <aside className="h-full w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 z-50">
            {/* Logo */}
            <div className="h-24 flex items-center px-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Icon name="flight_takeoff" className="text-xl" filled />
                    </div>
                    <div>
                        <h1 className="font-black text-lg text-gray-900 leading-tight">Poraí</h1>
                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Exploradora</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 py-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onChangeView(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${currentView === item.id
                                ? 'bg-[#eceaea] text-[#231212] font-bold shadow-sm'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <Icon
                            name={item.icon}
                            className={`text-xl transition-colors ${currentView === item.id ? 'text-[#231212]' : 'text-gray-400 group-hover:text-gray-600'}`}
                            filled={currentView === item.id}
                        />
                        <span className="text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Pro Plan Card */}
            <div className="p-4 mt-auto">
                <div className="bg-[#e3e6d0]/30 rounded-2xl p-5 relative overflow-hidden">
                    {/* Decor element */}
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#e3e6d0] rounded-full opacity-50 blur-xl"></div>

                    <h3 className="font-bold text-[#231212] text-sm mb-1 relative z-10">Plano Pro</h3>
                    <p className="text-[11px] text-gray-500 mb-4 relative z-10 leading-relaxed">
                        Desbloqueie mais viagens e recursos exclusivos.
                    </p>

                    <button className="w-full bg-white text-[#231212] h-9 rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all relative z-10 border border-[#231212]/5">
                        Upgrade
                    </button>
                </div>
            </div>

            {/* User Profile (Optional, matching style) */}
            {/* <div className="p-4 border-t border-gray-100"> ... </div> */}
        </aside>
    );
};

export default AppSidebar;
