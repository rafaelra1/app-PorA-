
export type TaskStatus = 'pending' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SyncStatus = 'synced' | 'pending' | 'error';

export type TaskCategory = 'documentation' | 'health' | 'reservations' | 'packing' | 'financial' | 'tech' | 'other';
export type TaskPriorityLevel = 'blocking' | 'important' | 'recommended';

export interface Task {
    id: string;
    trip_id: string; // Foreign key to trips table
    title: string;
    description?: string;
    due_date?: string;
    is_completed: boolean;
    is_urgent: boolean;
    category?: TaskCategory; // Standardized categories
    priority?: TaskPriorityLevel; // New: Priority level for smart tasks
    rule_id?: string; // New: NULL for manual tasks, identifies auto-generated tasks
    created_at: string;
    updated_at: string;
    synced_at?: string; // Local helper to track sync status
}

export type ChecklistActionType = 'ADD' | 'UPDATE' | 'DELETE';

export interface PendingAction {
    id: string; // UUID for the action itself
    type: ChecklistActionType;
    payload: Partial<Task> & { id: string }; // The task data being modified
    timestamp: number;
    tripId: string;
}
