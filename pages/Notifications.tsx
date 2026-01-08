import React, { useState } from 'react';
import { Card } from '../components/ui/Base';
import { useNotifications } from '../contexts/NotificationContext';
import { getTimeAgo, getNotificationIcon, getNotificationIconColor } from '../services/notificationService';
import { NotificationType } from '../types';

type FilterType = 'all' | 'unread' | 'read';

const Notifications: React.FC = () => {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications();

    const [filter, setFilter] = useState<FilterType>('all');
    const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
    const [isSaving, setIsSaving] = useState(false);

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.read) return false;
        if (filter === 'read' && !n.read) return false;
        if (typeFilter !== 'all' && n.type !== typeFilter) return false;
        return true;
    });

    const handleMarkAllRead = async () => {
        setIsSaving(true);
        try {
            await markAllAsRead();
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Tem certeza que deseja limpar todas as notificações?')) return;
        setIsSaving(true);
        try {
            await clearAll();
        } finally {
            setIsSaving(false);
        }
    };

    const notificationTypes: { value: NotificationType | 'all'; label: string }[] = [
        { value: 'all', label: 'Todos os tipos' },
        { value: 'alert', label: 'Alertas' },
        { value: 'flight_change', label: 'Voos' },
        { value: 'reminder', label: 'Lembretes' },
        { value: 'hotel_reminder', label: 'Hospedagem' },
        { value: 'document_expiry', label: 'Documentos' },
        { value: 'weather_alert', label: 'Clima' },
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-text-main">Notificações</h2>
                    <p className="text-sm text-text-muted mt-1">
                        {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Marcar todas como lidas
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Limpar todas
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Read/Unread Filter */}
                <div className="flex items-center bg-gray-100 rounded-full p-1">
                    {(['all', 'unread', 'read'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${filter === f
                                    ? 'bg-white text-text-main shadow-sm'
                                    : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            {f === 'all' ? 'Todas' : f === 'unread' ? 'Não lidas' : 'Lidas'}
                        </button>
                    ))}
                </div>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                >
                    {notificationTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            {/* Notification List */}
            <Card className="divide-y divide-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="px-6 py-12 text-center">
                        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-text-muted">Carregando notificações...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl text-text-muted">notifications_off</span>
                        </div>
                        <h3 className="font-bold text-text-main mb-1">Nenhuma notificação</h3>
                        <p className="text-sm text-text-muted">
                            {filter === 'unread'
                                ? 'Você não tem notificações não lidas.'
                                : 'Você não tem notificações ainda.'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                            className={`px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!notification.read ? 'bg-primary/5' : ''
                                }`}
                        >
                            <div className="flex gap-4">
                                {/* Icon */}
                                <div
                                    className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${getNotificationIconColor(notification.type)}`}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {getNotificationIcon(notification.type)}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className={`text-sm font-semibold text-text-main ${!notification.read ? 'font-bold' : ''}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-text-muted mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!notification.read && (
                                                <span className="size-2 bg-secondary rounded-full" />
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="size-8 rounded-lg hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-red-500 text-lg">close</span>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted mt-2 font-medium">
                                        {getTimeAgo(notification.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};

export default Notifications;
