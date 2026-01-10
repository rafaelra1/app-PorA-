import { PreparationTask, NotificationType } from '../types';
import { createNotification } from './notificationService';

const SENT_NOTIFICATIONS_KEY = 'checklist_sent_notifications';

interface SentNotificationRecord {
    taskId: string;
    type: 'overdue' | 'upcoming';
    date: string; // YYYY-MM-DD to allow one per day
}

const getSentNotifications = (): SentNotificationRecord[] => {
    try {
        const stored = localStorage.getItem(SENT_NOTIFICATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveSentNotification = (record: SentNotificationRecord) => {
    const current = getSentNotifications();
    localStorage.setItem(SENT_NOTIFICATIONS_KEY, JSON.stringify([...current, record]));
};

const hasBeenNotifiedToday = (taskId: string, type: 'overdue' | 'upcoming'): boolean => {
    const sent = getSentNotifications();
    const today = new Date().toISOString().split('T')[0];
    return sent.some(r => r.taskId === taskId && r.type === type && r.date === today);
};

export const checklistNotificationService = {
    checkAndNotify: async (tasks: PreparationTask[], userId: string, tripId?: string) => {
        if (!userId) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const task of tasks) {
            if (task.status === 'done') continue;
            if (!task.deadline) continue;

            const deadlineDate = new Date(task.deadline);
            deadlineDate.setHours(0, 0, 0, 0);

            const diffTime = deadlineDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // 1. Overdue Check
            if (diffDays < 0) {
                if (!hasBeenNotifiedToday(task.id, 'overdue')) {
                    await createNotification({
                        userId,
                        type: 'alert' as NotificationType,
                        title: 'Tarefa Atrasada',
                        message: `A tarefa "${task.title}" venceu em ${deadlineDate.toLocaleDateString('pt-BR')}.`,
                        tripId,
                        actionUrl: `/trip/${tripId}?tab=cities`, // Assuming this leads to checklist eventually or updated routing
                        metadata: { taskId: task.id }
                    });
                    saveSentNotification({ taskId: task.id, type: 'overdue', date: new Date().toISOString().split('T')[0] });
                }
            }
            // 2. Upcoming Check (3 days or less)
            else if (diffDays <= 3 && diffDays >= 0) {
                if (!hasBeenNotifiedToday(task.id, 'upcoming')) {
                    const when = diffDays === 0 ? 'hoje' : `em ${diffDays} dias`;
                    await createNotification({
                        userId,
                        type: 'reminder' as NotificationType,
                        title: 'Prazo Próximo',
                        message: `A tarefa "${task.title}" vence ${when}.`,
                        tripId,
                        actionUrl: `/trip/${tripId}?tab=cities`,
                        metadata: { taskId: task.id }
                    });
                    saveSentNotification({ taskId: task.id, type: 'upcoming', date: new Date().toISOString().split('T')[0] });
                }
            }
        }
    }
};
