import { supabase } from '../../lib/supabase';
import { Trip } from '../../types';
import { ChecklistTask, RuleContext, ChecklistSummary } from './types';
import {
    TravelInsuranceRule,
    PassportValidityRule,
    ESTARule,
    SchengenInsuranceRule
} from './rules';

// Active rules for Phase 1
const ACTIVE_RULES = [
    new TravelInsuranceRule(),
    new PassportValidityRule(),
    new ESTARule(),
    new SchengenInsuranceRule()
];

/**
 * Generates tasks for a trip based on active rules
 */
export async function generateTasksForTrip(trip: Trip, userNationality: string = 'BR'): Promise<ChecklistTask[]> {
    const destinations = trip.detailedDestinations || [];

    // Parse dates
    const departureDate = new Date(trip.startDate);
    const returnDate = new Date(trip.endDate);

    // Build context
    const context: RuleContext = {
        trip,
        destinations,
        userNationality,
        departureDate,
        returnDate
    };

    // Generate tasks from all applicable rules
    const generatedTasks: ChecklistTask[] = [];

    for (const rule of ACTIVE_RULES) {
        if (rule.applies(context)) {
            const tasks = rule.generate(context);

            for (const task of tasks) {
                generatedTasks.push({
                    id: `${trip.id}-${task.ruleId}`, // Temporary ID
                    tripId: trip.id,
                    ruleId: task.ruleId,
                    text: task.text,
                    category: task.category,
                    priority: task.priority,
                    isCompleted: false,
                    dueDate: task.dueDate?.toISOString().split('T')[0],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        }
    }

    return generatedTasks;
}

/**
 * Loads tasks from Supabase for a trip
 */
export async function loadTasksFromDB(tripId: string): Promise<ChecklistTask[]> {
    const { data, error } = await supabase
        .from('trip_checklist_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error loading checklist tasks:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        tripId: row.trip_id,
        ruleId: row.rule_id,
        text: row.text,
        category: row.category,
        priority: row.priority,
        isCompleted: row.is_completed,
        completedAt: row.completed_at,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

/**
 * Saves or updates a task completion status
 */
export async function saveTaskCompletion(
    tripId: string,
    taskId: string,
    isCompleted: boolean
): Promise<void> {
    const updates: any = {
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
    };

    if (isCompleted) {
        updates.completed_at = new Date().toISOString();
    } else {
        updates.completed_at = null;
    }

    const { error } = await supabase
        .from('trip_checklist_items')
        .update(updates)
        .eq('id', taskId)
        .eq('trip_id', tripId);

    if (error) {
        console.error('Error updating task completion:', error);
        throw error;
    }
}

/**
 * Adds a custom manual task
 */
export async function addManualTask(
    tripId: string,
    text: string,
    category: ChecklistTask['category'] = 'packing',
    priority: ChecklistTask['priority'] = 'recommended'
): Promise<ChecklistTask> {
    const { data, error } = await supabase
        .from('trip_checklist_items')
        .insert({
            trip_id: tripId,
            rule_id: null, // Manual task
            text,
            category,
            priority,
            is_completed: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding manual task:', error);
        throw error;
    }

    return {
        id: data.id,
        tripId: data.trip_id,
        ruleId: data.rule_id,
        text: data.text,
        category: data.category,
        priority: data.priority,
        isCompleted: data.is_completed,
        completedAt: data.completed_at,
        dueDate: data.due_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

/**
 * Syncs generated tasks with database
 * - Inserts new rule-based tasks
 * - Preserves manual tasks and completion status
 */
export async function syncTasksWithDB(tripId: string, generatedTasks: ChecklistTask[]): Promise<void> {
    // Load existing tasks
    const existingTasks = await loadTasksFromDB(tripId);
    const existingRuleIds = new Set(
        existingTasks.filter(t => t.ruleId).map(t => t.ruleId)
    );

    // Find new tasks to insert
    const tasksToInsert = generatedTasks.filter(
        task => task.ruleId && !existingRuleIds.has(task.ruleId)
    );

    if (tasksToInsert.length === 0) {
        return; // Nothing to sync
    }

    const { error } = await supabase
        .from('trip_checklist_items')
        .insert(
            tasksToInsert.map(task => ({
                trip_id: task.tripId,
                rule_id: task.ruleId,
                text: task.text,
                category: task.category,
                priority: task.priority,
                due_date: task.dueDate,
                is_completed: false
            }))
        );

    if (error) {
        console.error('Error syncing tasks:', error);
        throw error;
    }
}

/**
 * Calculates summary statistics for checklist
 */
export function calculateSummary(tasks: ChecklistTask[]): ChecklistSummary {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const critical = tasks.filter(t => t.priority === 'blocking').length;

    const now = new Date();
    const overdue = tasks.filter(t => {
        if (t.isCompleted || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
    }).length;

    return { total, completed, critical, overdue };
}
