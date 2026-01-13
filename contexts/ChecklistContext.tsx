import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, PendingAction, ChecklistActionType, TaskCategory, TaskPriorityLevel } from '../types/checklist';
import * as checklistCache from '../lib/checklistCache';
import * as checklistService from '../services/checklistService';
import { useAuth } from './AuthContext';

interface ChecklistContextType {
    tasks: Task[];
    isLoading: boolean;
    isSyncing: boolean;
    addTask: (title: string, tripId: string, options?: { dueDate?: string; category?: TaskCategory; priority?: TaskPriorityLevel; description?: string; ruleId?: string }) => Promise<void>;
    toggleTask: (taskId: string, isCompleted: boolean) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    deleteTasksByPattern: (pattern: string, tripId: string) => Promise<void>;
    refreshTasks: (tripId: string, trip?: any) => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextType | null>(null);

export const ChecklistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // We need to know which trip is active to filter tasks, but the context might be global or per-trip.
    // If we wrap this inside TripDetails, we can pass tripId via props or rely on the caller to provide tripId to methods.
    // Ideally, the state `tasks` should be relevant to the *current view*.
    // Let's assume this provider is at a high level but we fetch based on usage. 
    // Actually, maintaining a single list of tasks in context is tricky if we switch trips.
    // Let's keep it simple: The context provides the *methods* and holds the *loaded tasks* for the *currently requested trip*.
    // We'll rely on `refreshTasks` to switch context.

    // Monitor online status to trigger sync
    useEffect(() => {
        const handleOnline = () => {
            // We don't know the tripId here easily unless we store it.
            // But we can sync pending actions regardless of trip.
            checklistService.syncPendingActions().then(() => {
                console.log('Synced pending actions after reconnecting.');
            });
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const refreshTasks = useCallback(async (tripId: string, trip?: any) => {
        setIsLoading(true);
        try {
            // 1. Load from cache first for speed
            const cachedTasks = await checklistCache.getTasksByTripId(tripId);
            setTasks(cachedTasks);

            // 2. Trigger sync in background (if online)
            if (navigator.onLine) {
                setIsSyncing(true);
                try {
                    // Pass trip data to enable smart task generation
                    const freshTasks = await checklistService.syncChecklist(tripId, trip);
                    setTasks(freshTasks);
                } catch (err) {
                    console.error('Background sync failed:', err);
                } finally {
                    setIsSyncing(false);
                }
            }
        } catch (error) {
            console.error('Error refreshing tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const queueAction = async (type: ChecklistActionType, payload: any, tripId: string) => {
        const action: PendingAction = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now(),
            tripId
        };

        // Save to IndexedDB queue
        await checklistCache.addPendingAction(action);

        // Try to sync immediately if online
        if (navigator.onLine) {
            setIsSyncing(true);
            checklistService.syncPendingActions()
                .catch(err => console.error('Immediate sync failed, queued for later:', err))
                .finally(() => setIsSyncing(false));
        }
    };

    const addTask = useCallback(async (title: string, tripId: string, options?: { dueDate?: string; category?: TaskCategory; priority?: TaskPriorityLevel; description?: string; ruleId?: string }) => {
        if (!user) return;

        const newTask: Task = {
            id: crypto.randomUUID(),
            trip_id: tripId,
            title,
            description: options?.description,
            due_date: options?.dueDate,
            is_completed: false,
            is_urgent: options?.priority === 'blocking',
            category: options?.category,
            priority: options?.priority,
            rule_id: options?.ruleId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Optimistic Update
        setTasks(prev => [...prev, newTask]);

        // Save to Cache
        await checklistCache.saveTask(newTask);

        // Queue Sync Action
        await queueAction('ADD', newTask, tripId);
    }, [user]);

    const toggleTask = useCallback(async (taskId: string, isCompleted: boolean) => {
        // Optimistic Update
        let targetTask: Task | undefined;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                targetTask = { ...t, is_completed: isCompleted, updated_at: new Date().toISOString() };
                return targetTask;
            }
            return t;
        }));

        if (targetTask) {
            await checklistCache.saveTask(targetTask);
            await queueAction('UPDATE', { id: taskId, is_completed: isCompleted, updated_at: targetTask.updated_at }, targetTask.trip_id);
        }
    }, []);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        let targetTask: Task | undefined;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                targetTask = { ...t, ...updates, updated_at: new Date().toISOString() };
                return targetTask;
            }
            return t;
        }));

        if (targetTask) {
            await checklistCache.saveTask(targetTask);
            await queueAction('UPDATE', { ...updates, id: taskId, updated_at: targetTask.updated_at }, targetTask.trip_id);
        }
    }, []);

    const deleteTask = useCallback(async (taskId: string) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;

        // Optimistic Update
        setTasks(prev => prev.filter(t => t.id !== taskId));

        // Update Cache
        await checklistCache.deleteTaskFromCache(taskId);

        // Queue Sync Action
        await queueAction('DELETE', { id: taskId }, taskToDelete.trip_id);
    }, [tasks]);

    const deleteTasksByPattern = useCallback(async (pattern: string, tripId: string) => {
        const normalizedPattern = pattern.toLowerCase();
        const tasksToDelete = tasks.filter(t => t.trip_id === tripId && t.title.toLowerCase().includes(normalizedPattern));

        if (tasksToDelete.length === 0) return;

        // Optimistic Update
        setTasks(prev => prev.filter(t => !(t.trip_id === tripId && t.title.toLowerCase().includes(normalizedPattern))));

        // Update Cache & Queue Actions
        for (const task of tasksToDelete) {
            await checklistCache.deleteTaskFromCache(task.id);
            await queueAction('DELETE', { id: task.id }, tripId);
        }
    }, [tasks]);

    const contextValue = React.useMemo(() => ({
        tasks,
        isLoading,
        isSyncing,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
        deleteTasksByPattern,
        refreshTasks
    }), [
        tasks,
        isLoading,
        isSyncing,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
        deleteTasksByPattern,
        refreshTasks
    ]);

    return (
        <ChecklistContext.Provider value={contextValue}>
            {children}
        </ChecklistContext.Provider>
    );
};

export const useChecklist = () => {
    const context = useContext(ChecklistContext);
    if (!context) {
        throw new Error('useChecklist must be used within ChecklistProvider');
    }
    return context;
};
