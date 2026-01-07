import React, { useRef, useEffect } from 'react';

export interface Notification {
    id: string;
    type: 'alert' | 'flight_change' | 'reminder';
    title: string;
    description: string;
    time: string;
    read: boolean;
    actionUrl?: string;
    tripId?: string;
}

// Mock notifications data
export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'alert',
        title: 'Alerta de Viagem',
        description: 'Temperatura baixa prevista em Tóquio. Leve agasalhos!',
        time: '2 min atrás',
        read: false,
        tripId: 'tokyo-trip',
    },
    {
        id: '2',
        type: 'flight_change',
        title: 'Alteração de Voo',
        description: 'Seu voo JJ8765 teve o portão alterado para B12.',
        time: '15 min atrás',
        read: false,
        tripId: 'tokyo-trip',
    },
    {
        id: '3',
        type: 'reminder',
        title: 'Lembrete de Check-in',
        description: 'O check-in online para seu voo abre em 24 horas.',
        time: '1 hora atrás',
        read: true,
        tripId: 'tokyo-trip',
    },
    {
        id: '4',
        type: 'reminder',
        title: 'Reserva Confirmada',
        description: 'Sua reserva no Hotel Shinjuku foi confirmada.',
        time: '3 horas atrás',
        read: true,
        tripId: 'tokyo-trip',
    },
    {
        id: '5',
        type: 'alert',
        title: 'Documentos',
        description: 'Verifique se seu passaporte está válido para a viagem.',
        time: '1 dia atrás',
        read: true,
    },
];

interface NotificationFeedProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationFeed: React.FC<NotificationFeedProps> = ({ isOpen, onClose }) => {
    const feedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (feedRef.current && !feedRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'alert':
                return 'warning';
            case 'flight_change':
                return 'flight';
            case 'reminder':
                return 'schedule';
            default:
                return 'notifications';
        }
    };

    const getIconColor = (type: Notification['type']) => {
        switch (type) {
            case 'alert':
                return 'text-orange-500 bg-orange-100';
            case 'flight_change':
                return 'text-blue-500 bg-blue-100';
            case 'reminder':
                return 'text-green-500 bg-green-100';
            default:
                return 'text-gray-500 bg-gray-100';
        }
    };

    const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

    return (
        <div
            ref={feedRef}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-[110] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">notifications</span>
                    <h3 className="font-bold text-text-main">Notificações</h3>
                    {unreadCount > 0 && (
                        <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} novas
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="size-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-text-muted text-sm">close</span>
                </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((notification) => (
                    <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''
                            }`}
                    >
                        <div className="flex gap-3">
                            <div
                                className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(
                                    notification.type
                                )}`}
                            >
                                <span className="material-symbols-outlined text-lg">{getIcon(notification.type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-semibold text-text-main ${!notification.read ? 'font-bold' : ''}`}>
                                        {notification.title}
                                    </p>
                                    {!notification.read && (
                                        <span className="size-2 bg-secondary rounded-full shrink-0 mt-1.5"></span>
                                    )}
                                </div>
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notification.description}</p>
                                <p className="text-[10px] text-text-muted mt-1 font-medium">{notification.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <button className="w-full text-center text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                    Ver todas as notificações
                </button>
            </div>
        </div>
    );
};

export default NotificationFeed;
