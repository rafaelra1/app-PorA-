import { Trip, DetailedDestination } from '../../types';

// =============================================================================
// Checklist Types
// =============================================================================

export type ChecklistCategory = 'documentation' | 'health' | 'reservations' | 'packing' | 'financial' | 'tech';
export type ChecklistPriority = 'blocking' | 'important' | 'recommended';

export interface ChecklistTask {
    id: string;
    tripId: string;
    ruleId?: string; // NULL for manual tasks
    text: string;
    category: ChecklistCategory;
    priority: ChecklistPriority;
    isCompleted: boolean;
    completedAt?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChecklistSummary {
    total: number;
    completed: number;
    critical: number; // blocking tasks
    overdue: number;
}

// =============================================================================
// Rule System Types
// =============================================================================

export interface RuleContext {
    trip: Trip;
    destinations: DetailedDestination[];
    userNationality?: string; // Default to 'BR' if not specified
    departureDate: Date;
    returnDate: Date;
}

export interface GeneratedTask {
    ruleId: string;
    text: string;
    category: ChecklistCategory;
    priority: ChecklistPriority;
    dueDate?: Date;
    reasoning?: string; // For debugging
}

export interface ChecklistRule {
    id: string;
    name: string;
    description: string;

    /**
     * Determines if this rule applies to the given trip context
     */
    applies(context: RuleContext): boolean;

    /**
     * Generates tasks if the rule applies
     */
    generate(context: RuleContext): GeneratedTask[];
}
