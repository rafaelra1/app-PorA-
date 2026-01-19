import React, { useState } from 'react';
import { Icon } from '../ui/Base';
import { EmptyState } from '../ui/EmptyState';
import { useTrips } from '@/contexts/TripContext'; // Updated import path to match context location

interface MyTripsViewProps {
    onSelectTrip: (tripId: string) => void;
    onOpenAddModal?: () => void;
}

const MyTripsView: React.FC<MyTripsViewProps> = ({ onSelectTrip, onOpenAddModal }) => {
    const { trips } = useTrips();
    const [filter, setFilter] = useState<'Todas' | 'Próximas' | 'Planejamento' | 'Concluídas'>('Todas');

    // Filter trips based on selection
    const filteredTrips = trips.filter(trip => {
        if (filter === 'Todas') return true;
        if (filter === 'Próximas') return trip.status === 'confirmed';
        if (filter === 'Planejamento') return trip.status === 'planning';
        if (filter === 'Concluídas') return trip.status === 'completed';
        return true;
    });

    if (trips.length === 0) {
        return (
            <div className="p-8 md:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-[#231212] mb-2 tracking-tight">Minhas Viagens</h1>
                        <p className="text-gray-500 text-sm">Gerencie e planeje suas próximas aventuras pelo mundo.</p>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm min-h-[400px] flex items-center justify-center">
                    <EmptyState
                        icon="luggage"
                        title="Nenhuma viagem cadastrada"
                        description="Comece a planejar sua próxima aventura!"
                        action={onOpenAddModal ? {
                            label: "Criar Primeira Viagem",
                            onClick: onOpenAddModal
                        } : undefined}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 md:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#231212] mb-2 tracking-tight">Minhas Viagens</h1>
                    <p className="text-gray-500 text-sm">Gerencie e planeje suas próximas aventuras pelo mundo.</p>
                </div>
                <button
                    onClick={onOpenAddModal}
                    className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Icon name="add" className="text-lg" /> Nova Viagem
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
                {['Todas', 'Próximas', 'Planejamento', 'Concluídas'].map((item) => (
                    <button
                        key={item}
                        onClick={() => setFilter(item as any)}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === item
                            ? 'bg-[#231212] text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredTrips.map((trip) => (
                    <div
                        key={trip.id}
                        onClick={() => onSelectTrip(trip.id)}
                        className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 group cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1"
                    >
                        {/* Image */}
                        <div className="relative aspect-[16/10] rounded-[20px] overflow-hidden mb-4">
                            <img src={trip.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={trip.title} />

                            <div className="absolute top-3 right-3">
                                <span className={`
                                    px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md
                                    ${trip.status === 'confirmed' ? 'bg-green-400/90 text-white' : ''}
                                    ${trip.status === 'planning' ? 'bg-blue-400/90 text-white' : ''}
                                    ${trip.status === 'completed' ? 'bg-gray-400/90 text-white' : ''}
                                `}>
                                    {trip.status === 'confirmed' ? 'CONFIRMADO' :
                                        trip.status === 'planning' ? 'PLANEJANDO' :
                                            trip.status === 'completed' ? 'CONCLUÍDO' : trip.status}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-3 pb-3">
                            <h3 className="font-bold text-[#231212] text-lg mb-1 group-hover:text-indigo-600 transition-colors">{trip.title}</h3>
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-4">
                                <Icon name="calendar_today" className="text-xs" />
                                {trip.startDate ? `${new Date(trip.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${new Date(trip.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Data a definir'}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                {/* Collaborators */}
                                <div className="flex -space-x-2">
                                    {trip.participants && trip.participants.map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 overflow-hidden">
                                            {c.avatar ? <img src={c.avatar} alt={c.name} /> : (c.name ? c.name.charAt(0) : '?')}
                                        </div>
                                    ))}
                                </div>

                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Icon name="arrow_forward" className="text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyTripsView;
