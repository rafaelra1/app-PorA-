import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { getTimeAgo, getNotificationIcon, getNotificationIconColor } from '../services/notificationService';

interface NotificationFeedProps {
    isOpen: boolean;
    onClose: () => void;
    onViewAll?: () => void;
}

const NotificationFeed: React.FC<NotificationFeedProps> = ({ isOpen, onClose, onViewAll }) => {
    const feedRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications();

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

    const handleNotificationClick = async (id: string, read: boolean, actionUrl?: string) => {
        if (!read) {
            await markAsRead(id);
        }
        if (actionUrl) {
            window.open(actionUrl, '_blank');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

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
                            {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="size-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            title="Marcar todas como lidas"
                        >
                            <span className="material-symbols-outlined text-text-muted text-sm">done_all</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="size-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-muted text-sm">close</span>
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
                {isLoading ? (
                    <div className="px-4 py-8 text-center">
                        <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-text-muted">Carregando...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-outlined text-2xl text-text-muted">notifications_off</span>
                        </div>
                        <p className="text-sm font-semibold text-text-main">Nenhuma notificação</p>
                        <p className="text-xs text-text-muted mt-1">Você está em dia!</p>
                    </div>
                ) : (
                    notifications.slice(0, 10).map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id, notification.read, notification.actionUrl)}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${!notification.read ? 'bg-primary/5' : ''
                                }`}
                        >
                            <div className="flex gap-3">
                                <div
                                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${getNotificationIconColor(notification.type)}`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {getNotificationIcon(notification.type)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-semibold text-text-main ${!notification.read ? 'font-bold' : ''}`}>
                                            {notification.title}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {!notification.read && (
                                                <span className="size-2 bg-secondary rounded-full shrink-0" />
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                className="size-5 rounded hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-red-500 text-xs">close</span>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notification.message}</p>
                                    <p className="text-[10px] text-text-muted mt-1 font-medium">
                                        {getTimeAgo(notification.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onViewAll}
                        className="w-full text-center text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                        Ver todas as notificações
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationFeed;
