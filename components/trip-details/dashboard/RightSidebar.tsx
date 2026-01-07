import React from 'react';
import { Icon } from '../../ui/Base';

const RightSidebar: React.FC = () => {
    // Static calendar data for demo (December 2025 based on user image)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const startDayOffset = 1; // Assuming month starts on Monday/Tuesday for visuals

    return (
        <aside className="w-80 bg-white h-full border-l border-gray-100 p-6 flex flex-col gap-8 hidden xl:flex shrink-0">
            {/* Calendar Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Dezembro 2025</h3>
                    <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <Icon name="chevron_left" className="text-sm" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <Icon name="chevron_right" className="text-sm" />
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4 text-center">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
                        <span key={day} className="text-xs font-bold text-gray-400">
                            {day}
                        </span>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center text-sm font-medium text-gray-600">
                    {/* Empty slots for start offset */}
                    <div className="col-span-1"></div>

                    {days.map((day) => (
                        <div
                            key={day}
                            className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all cursor-pointer hover:bg-gray-50
                                ${day === 23 ? 'bg-[#d0cfe1] text-[#231212] font-bold shadow-sm' : ''}
                            `}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Next Events - Empty State from mockup */}
            <div className="border-t border-gray-100 pt-8">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">PRÓXIMOS EVENTOS (BRASÍLIA)</h4>
                <p className="text-sm text-gray-400 text-center italic py-4">Nenhuma viagem agendada</p>
            </div>

            {/* Weather Widget (Bottom) */}
            <div className="mt-auto bg-[#1a1a1a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <span className="text-4xl font-bold tracking-tighter">24°C</span>
                        <p className="text-[#eceaea]/60 text-xs font-bold mt-1 uppercase tracking-wider">Brasil</p>
                    </div>
                    <Icon name="sunny" className="text-2xl text-yellow-400 animate-spin-slow" filled />
                </div>

                <div className="h-px bg-white/10 w-full mb-4"></div>

                <div className="flex justify-between items-center text-[10px] font-bold text-[#eceaea]/80 uppercase tracking-wider relative z-10">
                    <span>Vento: 12km/h</span>
                    <span>Umidade: 45%</span>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
