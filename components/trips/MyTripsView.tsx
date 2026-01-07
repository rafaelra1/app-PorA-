import React, { useState } from 'react';
import { Icon } from '../ui/Base';
import { Trip } from '../../types';

interface MyTripsViewProps {
    onSelectTrip: (tripId: string) => void;
}

// Mock data matching the image
const MOCK_TRIPS = [
    {
        id: 't1',
        title: 'Aventura em Kyoto',
        date: '12 Out - 24 Out, 2023',
        status: 'CONFIRMADO',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000',
        collaborators: ['https://i.pravatar.cc/150?u=1', 'LM']
    },
    {
        id: 't2',
        title: 'Fim de Ano em Paris',
        date: '28 Dez - 03 Jan, 2024',
        status: 'PLANEJANDO',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000',
        collaborators: ['https://i.pravatar.cc/150?u=2', '+1']
    },
    {
        id: 't3',
        title: 'Tour Itália – Veneza',
        date: '15 Mai - 20 Mai, 2024',
        status: 'CONFIRMADO',
        image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&q=80&w=1000',
        collaborators: ['https://i.pravatar.cc/150?u=3']
    },
    {
        id: 't4',
        title: 'Verão na Grécia',
        date: '02 Ago - 10 Ago, 2023',
        status: 'CONCLUÍDO',
        image: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?auto=format&fit=crop&q=80&w=1000',
        collaborators: ['https://i.pravatar.cc/150?u=4', 'TR']
    },
    {
        id: 't5',
        title: 'Exploração Urbana',
        date: '10 Fev - 18 Fev, 2023',
        status: 'CONCLUÍDO',
        image: 'https://images.unsplash.com/photo-1449824913929-79aa4361e851?auto=format&fit=crop&q=80&w=1000',
        collaborators: ['https://i.pravatar.cc/150?u=5']
    },
    {
        id: 't6',
        title: 'Retiro Espiritual Bali',
        date: 'A definir, 2024',
        status: 'PLANEJANDO',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000',
        collaborators: ['https://i.pravatar.cc/150?u=6', '+3']
    }
];

const MyTripsView: React.FC<MyTripsViewProps> = ({ onSelectTrip }) => {
    const [filter, setFilter] = useState<'Todas' | 'Próximas' | 'Planejamento' | 'Concluídas'>('Todas');

    return (
        <div className="p-8 md:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#231212] mb-2 tracking-tight">Minhas Viagens</h1>
                    <p className="text-gray-500 text-sm">Gerencie e planeje suas próximas aventuras pelo mundo.</p>
                </div>
                <button className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
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
                {MOCK_TRIPS.map((trip) => (
                    <div
                        key={trip.id}
                        onClick={() => onSelectTrip(trip.id)}
                        className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 group cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1"
                    >
                        {/* Image */}
                        <div className="relative aspect-[16/10] rounded-[20px] overflow-hidden mb-4">
                            <img src={trip.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={trip.title} />

                            <div className="absolute top-3 right-3">
                                <span className={`
                                    px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md
                                    ${trip.status === 'CONFIRMADO' ? 'bg-green-400/90 text-white' : ''}
                                    ${trip.status === 'PLANEJANDO' ? 'bg-blue-400/90 text-white' : ''}
                                    ${trip.status === 'CONCLUÍDO' ? 'bg-gray-400/90 text-white' : ''}
                                `}>
                                    {trip.status}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-3 pb-3">
                            <h3 className="font-bold text-[#231212] text-lg mb-1 group-hover:text-indigo-600 transition-colors">{trip.title}</h3>
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-4">
                                <Icon name="calendar_today" className="text-xs" />
                                {trip.date}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                {/* Collaborators */}
                                <div className="flex -space-x-2">
                                    {trip.collaborators.map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 overflow-hidden">
                                            {c.startsWith('http') ? <img src={c} alt="User" /> : c}
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
