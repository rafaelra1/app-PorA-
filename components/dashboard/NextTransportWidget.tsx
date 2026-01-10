import * as React from 'react';
import { Transport } from '../../types';

interface NextTransportWidgetProps {
    transports: Transport[];
}

const transportIcons: Record<string, string> = {
    flight: 'flight',
    train: 'train',
    bus: 'directions_bus',
    car: 'directions_car',
    ferry: 'directions_boat',
    transfer: 'local_taxi',
};

const transportLabels: Record<string, string> = {
    flight: 'Voo',
    train: 'Trem',
    bus: 'Ônibus',
    car: 'Carro',
    ferry: 'Balsa',
    transfer: 'Transfer',
};

const NextTransportWidget: React.FC<NextTransportWidgetProps> = ({ transports }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (dateStr: string): Date => {
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
    };

    const upcomingTransports = transports
        .filter(t => {
            if (!t.departureDate) return false;
            const depDate = parseDate(t.departureDate);
            return depDate >= today;
        })
        .sort((a, b) => parseDate(a.departureDate).getTime() - parseDate(b.departureDate).getTime())
        .slice(0, 3);

    const getDaysUntil = (dateStr: string): number => {
        const depDate = parseDate(dateStr);
        const diffTime = depDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getDaysLabel = (days: number): string => {
        if (days === 0) return 'Hoje';
        if (days === 1) return 'Amanhã';
        return `Em ${days} dias`;
    };

    if (upcomingTransports.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-lg text-primary-dark">flight</span>
                    <h3 className="font-bold text-text-main">Próximos Transportes</h3>
                </div>
                <p className="text-sm text-text-muted text-center py-4">Nenhum transporte agendado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-primary-dark">flight</span>
                <h3 className="font-bold text-text-main">Próximos Transportes</h3>
            </div>
            <div className="space-y-3">
                {upcomingTransports.map(transport => {
                    const days = getDaysUntil(transport.departureDate);
                    const icon = transportIcons[transport.type] || 'commute';
                    const label = transportLabels[transport.type] || 'Transporte';

                    return (
                        <div
                            key={transport.id}
                            className="flex items-center gap-3 p-3 bg-background-light rounded-xl"
                        >
                            <div className="size-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl text-violet-600">{icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text-main text-sm truncate">
                                    {label}: {transport.operator} {transport.reference}
                                </p>
                                <p className="text-xs text-text-muted truncate">
                                    {transport.route || `${transport.departureCity || transport.departureLocation} → ${transport.arrivalCity || transport.arrivalLocation}`}
                                </p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${days === 0 ? 'bg-red-100 text-red-600' :
                                    days <= 2 ? 'bg-amber-100 text-amber-600' :
                                        'bg-green-100 text-green-600'
                                }`}>
                                {getDaysLabel(days)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NextTransportWidget;
