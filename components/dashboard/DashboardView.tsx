import React from 'react';
import { Icon } from '../ui/Base';
import { Trip } from '../../types';

interface DashboardViewProps {
    nextTrip: Trip;
    onViewTrip: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ nextTrip, onViewTrip }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8">
            {/* Hero Banner */}
            <div
                onClick={onViewTrip}
                className="relative h-[320px] xl:h-[400px] w-full rounded-[32px] overflow-hidden shadow-2xl group cursor-pointer transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]"
            >
                <img
                    src={nextTrip.coverImage}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    alt="Cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-8 left-8">
                    <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        Confirmada
                    </div>
                </div>

                {/* Main Text */}
                <div className="absolute bottom-10 left-10 max-w-2xl">
                    <h2 className="text-white/80 text-xl font-medium mb-2 drop-shadow-md tracking-tight">Próxima Aventura:</h2>
                    <h1 className="text-5xl xl:text-6xl font-black text-white leading-[0.95] tracking-tight drop-shadow-xl mb-6">
                        {nextTrip.destination}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-white/90 font-medium text-lg border-l-4 border-[#d0cfe1] pl-4">
                            {nextTrip.title}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-white/50"></div>
                        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors">
                            Ver Detalhes <Icon name="arrow_forward" className="text-base" />
                        </button>
                    </div>
                </div>

                {/* Countdown */}
                <div className="absolute bottom-10 right-10 flex gap-3">
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 text-center min-w-[90px] border border-white/10 shadow-lg">
                        <span className="block text-3xl font-bold text-white mb-0.5">12</span>
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Dias</span>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 text-center min-w-[90px] border border-white/10 shadow-lg">
                        <span className="block text-3xl font-bold text-white mb-0.5">04</span>
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Horas</span>
                    </div>
                </div>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* New Trip Widget */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center justify-center group relative overflow-hidden">
                    {/* Background blob */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-0 transition-transform group-hover:scale-150 duration-700"></div>

                    <div className="w-14 h-14 bg-[#231212] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/10 relative z-10 group-hover:-translate-y-1 transition-transform">
                        <Icon name="add" className="text-2xl" />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">Novo Roteiro</h3>
                    <p className="text-gray-500 text-xs mb-6 max-w-[200px] leading-relaxed relative z-10">
                        Escolha um ou mais países para sua próxima aventura!
                    </p>

                    <button className="bg-[#231212] text-white h-11 px-6 rounded-xl font-bold text-sm w-full hover:bg-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 relative z-10">
                        Planejar Agora
                    </button>
                </div>

                {/* Suggestion Widget */}
                <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group overflow-hidden h-[240px] lg:h-auto">
                    <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover rounded-[20px] transition-transform duration-700 group-hover:scale-110" alt="Bali" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent rounded-b-[20px]"></div>

                    <div className="absolute bottom-5 left-5 text-white z-10">
                        <h3 className="font-bold text-lg mb-0.5">Bali, Indonésia</h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                            <Icon name="trending_up" className="text-xs" />
                            Destino mais procurado
                        </div>
                    </div>

                    <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-md text-[#231212] text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Icon name="auto_awesome" className="text-xs text-indigo-500" filled />
                        IA Sugere
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
