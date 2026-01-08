import { supabase } from '../lib/supabase';
import { Notification, UserPreferences } from '../types';

// =============================================================================
// Notification Service - CRUD operations for notifications and preferences
// =============================================================================

// Helper to convert snake_case DB response to camelCase
const mapNotificationFromDB = (row: any): Notification => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    deleted: row.deleted,
    createdAt: row.created_at,
    actionUrl: row.action_url,
    tripId: row.trip_id,
    metadata: row.metadata,
});

const mapPreferencesFromDB = (row: any): UserPreferences => ({
    userId: row.user_id,
    tripReminders: row.trip_reminders,
    documentAlerts: row.document_alerts,
    journalActivity: row.journal_activity,
    emailNotifications: row.email_notifications,
    pushNotifications: row.push_notifications,
    emailFrequency: row.email_frequency,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
});

// =============================================================================
// Notifications CRUD
// =============================================================================

/**
 * Fetch all non-deleted notifications for a user, ordered by most recent
 */
export async function fetchNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }

    return (data || []).map(mapNotificationFromDB);
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

/**
 * Soft delete a notification (sets deleted = true)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ deleted: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}

/**
 * Soft delete all notifications for a user
 */
export async function clearAllNotifications(userId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ deleted: true })
        .eq('user_id', userId)
        .eq('deleted', false);

    if (error) {
        console.error('Error clearing all notifications:', error);
        throw error;
    }
}

/**
 * Create a new notification
 */
export async function createNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'deleted'>
): Promise<Notification> {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            action_url: notification.actionUrl,
            trip_id: notification.tripId,
            metadata: notification.metadata || {},
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        throw error;
    }

    return mapNotificationFromDB(data);
}

// =============================================================================
// User Preferences CRUD
// =============================================================================

/**
 * Get user preferences, creating defaults if they don't exist
 */
export async function getPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
            return createDefaultPreferences(userId);
        }
        console.error('Error fetching preferences:', error);
        throw error;
    }

    return mapPreferencesFromDB(data);
}

/**
 * Create default preferences for a new user
 */
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
        userId,
        tripReminders: true,
        documentAlerts: true,
        journalActivity: false,
        emailNotifications: true,
        pushNotifications: false,
        emailFrequency: 'immediate',
    };

    const { data, error } = await supabase
        .from('user_preferences')
        .insert({
            user_id: userId,
            trip_reminders: defaultPrefs.tripReminders,
            document_alerts: defaultPrefs.documentAlerts,
            journal_activity: defaultPrefs.journalActivity,
            email_notifications: defaultPrefs.emailNotifications,
            push_notifications: defaultPrefs.pushNotifications,
            email_frequency: defaultPrefs.emailFrequency,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating default preferences:', error);
        throw error;
    }

    return mapPreferencesFromDB(data);
}

/**
 * Update user preferences
 */
export async function updatePreferences(
    userId: string,
    prefs: Partial<Omit<UserPreferences, 'userId'>>
): Promise<UserPreferences> {
    // Convert camelCase to snake_case for DB
    const updates: Record<string, any> = {};
    if (prefs.tripReminders !== undefined) updates.trip_reminders = prefs.tripReminders;
    if (prefs.documentAlerts !== undefined) updates.document_alerts = prefs.documentAlerts;
    if (prefs.journalActivity !== undefined) updates.journalActivity = prefs.journalActivity;
    if (prefs.emailNotifications !== undefined) updates.email_notifications = prefs.emailNotifications;
    if (prefs.pushNotifications !== undefined) updates.push_notifications = prefs.pushNotifications;
    if (prefs.emailFrequency !== undefined) updates.email_frequency = prefs.emailFrequency;
    if (prefs.quietHoursStart !== undefined) updates.quiet_hours_start = prefs.quietHoursStart;
    if (prefs.quietHoursEnd !== undefined) updates.quiet_hours_end = prefs.quietHoursEnd;

    const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating preferences:', error);
        throw error;
    }

    return mapPreferencesFromDB(data);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get human-readable time ago string
 */
export function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Get icon name for notification type
 */
export function getNotificationIcon(type: string): string {
    switch (type) {
        case 'alert':
        case 'weather_alert':
            return 'warning';
        case 'flight_change':
            return 'flight';
        case 'reminder':
        case 'itinerary_reminder':
            return 'schedule';
        case 'hotel_reminder':
            return 'hotel';
        case 'document_expiry':
            return 'description';
        case 'social':
            return 'favorite';
        default:
            return 'notifications';
    }
}

/**
 * Get icon color classes for notification type
 */
export function getNotificationIconColor(type: string): string {
    switch (type) {
        case 'alert':
        case 'weather_alert':
            return 'text-orange-500 bg-orange-100';
        case 'flight_change':
            return 'text-blue-500 bg-blue-100';
        case 'reminder':
        case 'itinerary_reminder':
            return 'text-green-500 bg-green-100';
        case 'hotel_reminder':
            return 'text-purple-500 bg-purple-100';
        case 'document_expiry':
            return 'text-red-500 bg-red-100';
        case 'social':
            return 'text-pink-500 bg-pink-100';
        default:
            return 'text-gray-500 bg-gray-100';
    }
}
