import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Notification, UserPreferences } from '../types';
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification as deleteNotificationService,
    clearAllNotifications,
    getPreferences,
    updatePreferences as updatePreferencesService,
} from '../services/notificationService';

// =============================================================================
// Context Types
// =============================================================================

interface NotificationContextType {
    // Notifications state
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    // Notification actions
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    refreshNotifications: () => Promise<void>;

    // Preferences state
    preferences: UserPreferences | null;
    preferencesLoading: boolean;

    // Preferences actions
    updatePreferences: (prefs: Partial<Omit<UserPreferences, 'userId'>>) => Promise<void>;
    refreshPreferences: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Preferences state
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [preferencesLoading, setPreferencesLoading] = useState(false);

    // Computed values
    const unreadCount = notifications.filter(n => !n.read).length;

    // ==========================================================================
    // Fetch notifications on auth change
    // ==========================================================================
    const refreshNotifications = useCallback(async () => {
        if (!user?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchNotifications(user.id);
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Erro ao carregar notificações');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // ==========================================================================
    // Fetch preferences
    // ==========================================================================
    const refreshPreferences = useCallback(async () => {
        if (!user?.id) return;

        setPreferencesLoading(true);

        try {
            const prefs = await getPreferences(user.id);
            setPreferences(prefs);
        } catch (err) {
            console.error('Failed to fetch preferences:', err);
        } finally {
            setPreferencesLoading(false);
        }
    }, [user?.id]);

    // ==========================================================================
    // Load data on authentication
    // ==========================================================================
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            refreshNotifications();
            refreshPreferences();
        } else {
            setNotifications([]);
            setPreferences(null);
        }
    }, [isAuthenticated, user?.id, refreshNotifications, refreshPreferences]);

    // ==========================================================================
    // Notification Actions
    // ==========================================================================
    const markAsRead = useCallback(async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            throw err;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;

        try {
            await markAllNotificationsAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            throw err;
        }
    }, [user?.id]);

    const deleteNotification = useCallback(async (id: string) => {
        try {
            await deleteNotificationService(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
            throw err;
        }
    }, []);

    const clearAll = useCallback(async () => {
        if (!user?.id) return;

        try {
            await clearAllNotifications(user.id);
            setNotifications([]);
        } catch (err) {
            console.error('Failed to clear all notifications:', err);
            throw err;
        }
    }, [user?.id]);

    // ==========================================================================
    // Preferences Actions
    // ==========================================================================
    const updatePreferences = useCallback(async (prefs: Partial<Omit<UserPreferences, 'userId'>>) => {
        if (!user?.id) return;

        try {
            const updated = await updatePreferencesService(user.id, prefs);
            setPreferences(updated);
        } catch (err) {
            console.error('Failed to update preferences:', err);
            throw err;
        }
    }, [user?.id]);

    // ==========================================================================
    // Context Value
    // ==========================================================================
    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications,
        preferences,
        preferencesLoading,
        updatePreferences,
        refreshPreferences,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// =============================================================================
// Hook
// =============================================================================

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
