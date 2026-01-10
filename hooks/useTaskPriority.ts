import { PreparationTask } from '../types';

export const useTaskPriority = () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    const getDaysRemaining = (deadline?: string): number | null => {
        if (!deadline) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(deadline);
        targetDate.setHours(0, 0, 0, 0);

        // Check if valid date
        if (isNaN(targetDate.getTime())) return null;

        const diffMs = targetDate.getTime() - today.getTime();
        return Math.ceil(diffMs / ONE_DAY_MS);
    };

    const calculatePriorityScore = (task: PreparationTask): number => {
        let score = 0;
        const daysRemaining = getDaysRemaining(task.deadline);

        // 1. Base Priority Score
        if (task.priority === 'high') score += 100;
        else if (task.priority === 'medium') score += 50;
        else score += 10;

        // 2. Deadline Urgency Score
        if (daysRemaining !== null) {
            if (daysRemaining < 0) score += 200; // OVERDUE is critical
            else if (daysRemaining === 0) score += 150; // TODAY
            else if (daysRemaining <= 3) score += 100; // VERY URGENT
            else if (daysRemaining <= 7) score += 50; // URGENT
            else if (daysRemaining <= 14) score += 20; // APPROACHING
            else if (daysRemaining <= 30) score += 10;
            else score += 0;
        }

        // 3. Status Score (Completed tasks should drop to bottom usually, but maybe we filter them out in UI)
        // For sorting mixed lists:
        if (task.status === 'done') score = -1000;

        return score;
    };

    const sortTasks = (tasks: PreparationTask[]): PreparationTask[] => {
        return [...tasks].sort((a, b) => {
            const scoreA = calculatePriorityScore(a);
            const scoreB = calculatePriorityScore(b);
            return scoreB - scoreA; // Descending order (higher score first)
        });
    };

    const getUrgencyLevel = (task: PreparationTask): 'critical' | 'high' | 'normal' | 'low' => {
        const daysRemaining = getDaysRemaining(task.deadline);

        if (task.status === 'done') return 'low';

        if (daysRemaining !== null) {
            if (daysRemaining < 0) return 'critical';
            if (daysRemaining <= 3) return 'critical';
            if (daysRemaining <= 7) return 'high';
        }

        if (task.priority === 'high') return 'high';
        if (task.priority === 'medium') return 'normal';

        return 'low';
    };

    return {
        calculatePriorityScore,
        getDaysRemaining,
        sortTasks,
        getUrgencyLevel
    };
};
