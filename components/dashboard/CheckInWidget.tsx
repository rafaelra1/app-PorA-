import * as React from 'react';
import { Transport, HotelReservation } from '../../types';

interface CheckInWidgetProps {
    transports: Transport[];
    hotels: HotelReservation[];
}

const CheckInWidget: React.FC<CheckInWidgetProps> = ({ transports, hotels }) => {
    const now = new Date();

    const parseDate = (dateStr: string): Date => {
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
    };

    const getHoursUntil = (dateStr: string, timeStr?: string): number => {
        const date = parseDate(dateStr);
        if (timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            date.setHours(h, m, 0, 0);
        }
        return (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    };

    // Flight check-ins: within 48 hours
    const flightCheckIns = transports
        .filter(t => t.type === 'flight' && t.departureDate)
        .filter(t => {
            const hours = getHoursUntil(t.departureDate, t.departureTime);
            return hours > 0 && hours <= 48;
        })
        .map(t => ({
            id: t.id,
            type: 'flight' as const,
            title: `${t.operator} ${t.reference}`,
            subtitle: t.route || `${t.departureCity || t.departureLocation} → ${t.arrivalCity || t.arrivalLocation}`,
            hoursUntil: getHoursUntil(t.departureDate, t.departureTime),
        }));

    // Hotel check-ins: within 24 hours
    const hotelCheckIns = hotels
        .filter(h => h.checkIn)
        .filter(h => {
            const hours = getHoursUntil(h.checkIn, h.checkInTime);
            return hours > 0 && hours <= 24;
        })
        .map(h => ({
            id: h.id,
            type: 'hotel' as const,
            title: h.name,
            subtitle: h.address,
            hoursUntil: getHoursUntil(h.checkIn, h.checkInTime),
        }));

    const allCheckIns = [...flightCheckIns, ...hotelCheckIns]
        .sort((a, b) => a.hoursUntil - b.hoursUntil);

    const formatTimeUntil = (hours: number): string => {
        if (hours < 1) return 'Menos de 1h';
        if (hours < 24) return `Em ${Math.round(hours)}h`;
        return `Em ${Math.round(hours / 24)} dia(s)`;
    };

    if (allCheckIns.length === 0) {
        return null; // Don't render if no pending check-ins
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft border-l-4 border-amber-400">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-amber-500">schedule</span>
                <h3 className="font-bold text-text-main">Check-ins Pendentes</h3>
                <span className="ml-auto bg-amber-100 text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {allCheckIns.length}
                </span>
            </div>
            <div className="space-y-3">
                {allCheckIns.map(item => (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl"
                    >
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'flight' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                            <span className={`material-symbols-outlined text-xl ${item.type === 'flight' ? 'text-blue-600' : 'text-purple-600'
                                }`}>
                                {item.type === 'flight' ? 'flight' : 'hotel'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text-main text-sm truncate">{item.title}</p>
                            <p className="text-xs text-text-muted truncate">{item.subtitle}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-200 text-amber-700 shrink-0">
                            {formatTimeUntil(item.hoursUntil)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CheckInWidget;
