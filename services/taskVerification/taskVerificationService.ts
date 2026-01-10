/**
 * Task Verification Service
 *
 * Main service interface for the task verification system.
 * Provides high-level methods for integrating with the rest of the app.
 *
 * Usage patterns:
 * 1. On trip save → generateTasksForTrip()
 * 2. On trip update → refreshTasksForTrip()
 * 3. On task complete → handleTaskCompletion()
 * 4. Periodic check → checkAllUpcomingTrips()
 */

import { Trip, Transport, Insurance, TaskItem } from '../../types';
import {
  TripVerificationContext,
  TravelerInfo,
  GeneratedTask,
  VerificationResult,
  TaskPriority,
  TaskUrgency,
} from './types';
import {
  VerificationEngine,
  buildVerificationContext,
  verificationEngine,
} from './VerificationEngine';

// =============================================================================
// Service Interface
// =============================================================================

export interface TaskVerificationService {
  /**
   * Generate tasks for a new or existing trip
   */
  generateTasksForTrip(
    trip: Trip,
    options?: GenerateTasksOptions
  ): Promise<VerificationResult>;

  /**
   * Refresh tasks after trip modification
   */
  refreshTasksForTrip(
    trip: Trip,
    options?: GenerateTasksOptions
  ): Promise<TaskRefreshResult>;

  /**
   * Handle task completion and check dependencies
   */
  handleTaskCompletion(
    tripId: string,
    taskId: string,
    task: TaskItem
  ): Promise<void>;

  /**
   * Check all upcoming trips for pending tasks
   */
  checkAllUpcomingTrips(trips: Trip[]): Promise<Map<string, VerificationResult>>;

  /**
   * Calculate priority score for a task
   */
  calculateTaskPriority(
    task: GeneratedTask,
    ctx: TripVerificationContext
  ): PriorityCalculation;

  /**
   * Calculate suggested deadline for a task
   */
  calculateTaskDeadline(
    task: GeneratedTask,
    ctx: TripVerificationContext
  ): DeadlineCalculation;
}

export interface GenerateTasksOptions {
  transports?: Transport[];
  insurance?: Insurance;
  existingTasks?: TaskItem[];
  travelers?: TravelerInfo[];
  forceRefresh?: boolean;
}

export interface TaskRefreshResult {
  newTasks: GeneratedTask[];
  invalidatedTasks: string[];
  staleTasks: string[];
  unchanged: boolean;
}

export interface PriorityCalculation {
  score: number;           // 0-100, higher = more urgent
  priority: TaskPriority;
  factors: PriorityFactor[];
  explanation: string;
}

export interface PriorityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface DeadlineCalculation {
  suggestedDate: Date;
  latestDate: Date;        // Absolute latest to still make the trip
  idealDate: Date;         // Ideal completion date
  daysRemaining: number;
  isOverdue: boolean;
  isUrgent: boolean;       // Less than 7 days
  breakdown: {
    processingTime: number;
    bufferDays: number;
    daysBeforeTrip: number;
  };
}

// =============================================================================
// Priority Calculation Logic
// =============================================================================

/**
 * Calculate comprehensive priority score for a task
 *
 * Factors considered:
 * 1. Urgency level (blocking vs optional)
 * 2. Days until trip
 * 3. Processing time required
 * 4. Dependencies (blocked tasks increase priority)
 * 5. Category importance
 */
export function calculateTaskPriority(
  task: GeneratedTask,
  ctx: TripVerificationContext
): PriorityCalculation {
  const factors: PriorityFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Factor 1: Urgency Level (weight: 35%)
  const urgencyWeight = 35;
  const urgencyScores: Record<TaskUrgency, number> = {
    blocking: 100,
    important: 75,
    recommended: 50,
    optional: 25,
  };
  const urgencyScore = urgencyScores[task.urgency];
  factors.push({
    name: 'Urgência',
    weight: urgencyWeight,
    score: urgencyScore,
    description: getUrgencyDescription(task.urgency),
  });
  totalScore += urgencyScore * urgencyWeight;
  totalWeight += urgencyWeight;

  // Factor 2: Time Pressure (weight: 30%)
  const timeWeight = 30;
  const totalDaysNeeded = task.daysBeforeTrip + task.processingTimeDays + task.bufferDays;
  const daysAvailable = ctx.daysUntilTrip;

  let timeScore: number;
  if (daysAvailable <= 0) {
    timeScore = 100; // Trip already started
  } else if (daysAvailable < totalDaysNeeded) {
    timeScore = 95; // Not enough time with buffer
  } else if (daysAvailable < totalDaysNeeded * 1.5) {
    timeScore = 80; // Tight timeline
  } else if (daysAvailable < totalDaysNeeded * 2) {
    timeScore = 60; // Comfortable
  } else if (daysAvailable < totalDaysNeeded * 3) {
    timeScore = 40; // Plenty of time
  } else {
    timeScore = 20; // Very far out
  }

  factors.push({
    name: 'Pressão de Tempo',
    weight: timeWeight,
    score: timeScore,
    description: `${daysAvailable} dias até a viagem, ${totalDaysNeeded} dias necessários`,
  });
  totalScore += timeScore * timeWeight;
  totalWeight += timeWeight;

  // Factor 3: Processing Time (weight: 15%)
  const processingWeight = 15;
  let processingScore: number;
  if (task.processingTimeDays >= 30) {
    processingScore = 90; // Long processing (visa)
  } else if (task.processingTimeDays >= 14) {
    processingScore = 70; // Medium processing (passport)
  } else if (task.processingTimeDays >= 7) {
    processingScore = 50; // Short processing
  } else {
    processingScore = 30; // Immediate
  }

  factors.push({
    name: 'Tempo de Processamento',
    weight: processingWeight,
    score: processingScore,
    description: `${task.processingTimeDays} dias de processamento típico`,
  });
  totalScore += processingScore * processingWeight;
  totalWeight += processingWeight;

  // Factor 4: Dependencies (weight: 10%)
  const depWeight = 10;
  const hasDependencies = task.dependsOn && task.dependsOn.length > 0;
  const hasBlockedTasks = ctx.existingTasks.some(
    (t) => t.category === task.category && !t.completed
  );
  const depScore = hasDependencies ? 60 : hasBlockedTasks ? 40 : 20;

  factors.push({
    name: 'Dependências',
    weight: depWeight,
    score: depScore,
    description: hasDependencies
      ? 'Bloqueia outras tarefas'
      : 'Independente',
  });
  totalScore += depScore * depWeight;
  totalWeight += depWeight;

  // Factor 5: Category Importance (weight: 10%)
  const catWeight = 10;
  const categoryScores: Record<string, number> = {
    documentation: 90,
    health: 85,
    legal: 85,
    reservations: 70,
    financial: 60,
    transport: 55,
    connectivity: 40,
    packing: 30,
    other: 25,
  };
  const catScore = categoryScores[task.category] || 50;

  factors.push({
    name: 'Categoria',
    weight: catWeight,
    score: catScore,
    description: `Categoria: ${task.category}`,
  });
  totalScore += catScore * catWeight;
  totalWeight += catWeight;

  // Calculate final score
  const finalScore = Math.round(totalScore / totalWeight);

  // Map score to priority
  const priority: TaskPriority =
    finalScore >= 80
      ? 'critical'
      : finalScore >= 60
        ? 'high'
        : finalScore >= 40
          ? 'medium'
          : 'low';

  return {
    score: finalScore,
    priority,
    factors,
    explanation: generatePriorityExplanation(priority, factors, ctx.daysUntilTrip),
  };
}

function getUrgencyDescription(urgency: TaskUrgency): string {
  const descriptions: Record<TaskUrgency, string> = {
    blocking: 'A viagem não pode acontecer sem isso',
    important: 'Impacto significativo se não completar',
    recommended: 'Recomendado para melhor experiência',
    optional: 'Opcional, bom ter',
  };
  return descriptions[urgency];
}

function generatePriorityExplanation(
  priority: TaskPriority,
  factors: PriorityFactor[],
  daysUntilTrip: number
): string {
  const highestFactor = factors.reduce((a, b) =>
    a.score * a.weight > b.score * b.weight ? a : b
  );

  const templates: Record<TaskPriority, string> = {
    critical: `Prioridade crítica. ${highestFactor.description}. Faltam ${daysUntilTrip} dias.`,
    high: `Alta prioridade. ${highestFactor.description}. Recomendamos ação imediata.`,
    medium: `Prioridade média. ${highestFactor.description}. Planeje para as próximas semanas.`,
    low: `Baixa prioridade. ${highestFactor.description}. Pode ser feito mais perto da viagem.`,
  };

  return templates[priority];
}

// =============================================================================
// Deadline Calculation Logic
// =============================================================================

/**
 * Calculate comprehensive deadline information for a task
 *
 * Considers:
 * 1. Processing time (visa, passport, etc.)
 * 2. Buffer for unexpected delays
 * 3. Business days vs calendar days
 * 4. Holidays (simplified)
 */
export function calculateTaskDeadline(
  task: GeneratedTask,
  ctx: TripVerificationContext
): DeadlineCalculation {
  const tripStart = ctx.startDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the absolute latest date (no buffer, just processing time)
  const latestDate = new Date(tripStart);
  latestDate.setDate(
    latestDate.getDate() - task.daysBeforeTrip - task.processingTimeDays
  );

  // Calculate the ideal date (with full buffer)
  const idealDate = new Date(tripStart);
  idealDate.setDate(
    idealDate.getDate() -
      task.daysBeforeTrip -
      task.processingTimeDays -
      task.bufferDays
  );

  // Suggested date is between ideal and latest, adjusted for urgency
  let suggestedDate: Date;
  if (task.urgency === 'blocking' || task.urgency === 'important') {
    // For critical tasks, suggest the ideal date
    suggestedDate = new Date(idealDate);
  } else {
    // For less critical, split the difference
    const midpoint =
      idealDate.getTime() +
      (latestDate.getTime() - idealDate.getTime()) * 0.3;
    suggestedDate = new Date(midpoint);
  }

  // Ensure suggested date is not in the past
  if (suggestedDate < today) {
    suggestedDate = today;
  }

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (suggestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine status
  const isOverdue = today > latestDate;
  const isUrgent = daysRemaining <= 7;

  return {
    suggestedDate,
    latestDate,
    idealDate,
    daysRemaining: Math.max(0, daysRemaining),
    isOverdue,
    isUrgent,
    breakdown: {
      processingTime: task.processingTimeDays,
      bufferDays: task.bufferDays,
      daysBeforeTrip: task.daysBeforeTrip,
    },
  };
}

// =============================================================================
// Service Implementation
// =============================================================================

class TaskVerificationServiceImpl implements TaskVerificationService {
  private engine: VerificationEngine;

  constructor(engine: VerificationEngine = verificationEngine) {
    this.engine = engine;
  }

  async generateTasksForTrip(
    trip: Trip,
    options: GenerateTasksOptions = {}
  ): Promise<VerificationResult> {
    const ctx = buildVerificationContext(trip, options);
    return this.engine.verify(ctx);
  }

  async refreshTasksForTrip(
    trip: Trip,
    options: GenerateTasksOptions = {}
  ): Promise<TaskRefreshResult> {
    const ctx = buildVerificationContext(trip, options);
    const result = await this.engine.handleTripModified(ctx);

    return {
      newTasks: result.newTasks,
      invalidatedTasks: result.invalidatedTasks,
      staleTasks: result.staleTasks,
      unchanged:
        result.newTasks.length === 0 &&
        result.invalidatedTasks.length === 0 &&
        result.staleTasks.length === 0,
    };
  }

  async handleTaskCompletion(
    tripId: string,
    taskId: string,
    _task: TaskItem
  ): Promise<void> {
    this.engine.handleTaskCompleted(tripId, taskId);
  }

  async checkAllUpcomingTrips(
    trips: Trip[]
  ): Promise<Map<string, VerificationResult>> {
    const results = new Map<string, VerificationResult>();

    // Filter to upcoming trips only (within next 90 days)
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + 90);

    const upcomingTrips = trips.filter((trip) => {
      const startDate = parseDate(trip.startDate);
      return startDate > today && startDate <= cutoffDate;
    });

    // Process in batches to avoid overwhelming
    const BATCH_SIZE = 5;
    for (let i = 0; i < upcomingTrips.length; i += BATCH_SIZE) {
      const batch = upcomingTrips.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((trip) => this.generateTasksForTrip(trip))
      );

      batch.forEach((trip, idx) => {
        results.set(trip.id, batchResults[idx]);
      });
    }

    return results;
  }

  calculateTaskPriority(
    task: GeneratedTask,
    ctx: TripVerificationContext
  ): PriorityCalculation {
    return calculateTaskPriority(task, ctx);
  }

  calculateTaskDeadline(
    task: GeneratedTask,
    ctx: TripVerificationContext
  ): DeadlineCalculation {
    return calculateTaskDeadline(task, ctx);
  }
}

function parseDate(dateStr: string): Date {
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  return new Date(dateStr);
}

// =============================================================================
// Export Singleton
// =============================================================================

export const taskVerificationService = new TaskVerificationServiceImpl();

// Re-export types and helpers
export { buildVerificationContext } from './VerificationEngine';
export type { GeneratedTask, VerificationResult, TripVerificationContext } from './types';
