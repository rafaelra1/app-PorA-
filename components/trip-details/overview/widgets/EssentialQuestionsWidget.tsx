import * as React from 'react';
import { Card } from '../../../ui/Base';
import { HotelReservation, Transport, City } from '../../../../types';

interface EssentialQuestionsWidgetProps {
    cities: City[];
    hotels: HotelReservation[];
    transports: Transport[];
}

interface QuestionItem {
    id: string;
    text: string;
    icon: string;
    status: 'ok' | 'pending' | 'warning';
    detail: string;
}

export const EssentialQuestionsWidget: React.FC<EssentialQuestionsWidgetProps> = ({ cities, hotels, transports }) => {
    // Determine status based on data
    const hasFlights = transports.some(t => t.type === 'flight');
    const totalCities = cities.length || 1;
    const totalNights = cities.reduce((sum, c) => sum + (c.nights || 0), 0);
    const hotelNights = hotels.reduce((sum, h) => {
        // Calculate nights from check-in to check-out
        if (h.checkIn && h.checkOut) {
            const checkIn = new Date(h.checkIn.split('/').reverse().join('-'));
            const checkOut = new Date(h.checkOut.split('/').reverse().join('-'));
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            return sum + Math.max(0, nights);
        }
        return sum;
    }, 0);

    const allNightsCovered = hotelNights >= totalNights;

    const questions: QuestionItem[] = [
        {
            id: 'flights',
            text: 'Todas as passagens estão reservadas?',
            icon: 'flight',
            status: hasFlights ? 'ok' : 'pending',
            detail: hasFlights ? 'Voos confirmados' : 'Nenhuma passagem cadastrada',
        },
        {
            id: 'hotels',
            text: 'Existem reservas para todas as noites da viagem?',
            icon: 'hotel',
            status: allNightsCovered ? 'ok' : hotelNights > 0 ? 'warning' : 'pending',
            detail: allNightsCovered
                ? `${hotelNights} noites cobertas`
                : hotelNights > 0
                    ? `${hotelNights} de ${totalNights} noites`
                    : 'Nenhuma hospedagem cadastrada',
        },
    ];

    const getStatusColor = (status: QuestionItem['status']) => {
        switch (status) {
            case 'ok': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'warning': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'pending': return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    const getStatusIcon = (status: QuestionItem['status']) => {
        switch (status) {
            case 'ok': return 'check_circle';
            case 'warning': return 'warning';
            case 'pending': return 'radio_button_unchecked';
        }
    };

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/20 rounded-full">
                    Perguntas Essenciais
                </span>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                    <span className="material-symbols-outlined text-sm text-primary">checklist</span>
                    Verificação Rápida
                </div>
            </div>

            <div className="space-y-3">
                {questions.map(q => (
                    <div
                        key={q.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${getStatusColor(q.status)}`}
                    >
                        <div className="size-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-xl">{q.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-text-main mb-0.5">{q.text}</p>
                            <p className="text-xs text-text-muted">{q.detail}</p>
                        </div>
                        <div className="shrink-0">
                            <span className={`material-symbols-outlined text-2xl`}>
                                {getStatusIcon(q.status)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default EssentialQuestionsWidget;
