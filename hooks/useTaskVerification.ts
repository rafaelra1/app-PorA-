/**
 * useTaskVerification Hook
 *
 * React hook for integrating the task verification system with components.
 * Handles automatic task generation when trips change, with debouncing
 * and caching to avoid unnecessary re-evaluations.
 *
 * @example
 * ```tsx
 * function TripTasks({ trip }: { trip: Trip }) {
 *   const {
 *     tasks,
 *     isLoading,
 *     error,
 *     refresh,
 *     getTaskPriority,
 *   } = useTaskVerification(trip);
 *
 *   return (
 *     <ul>
 *       {tasks.map(task => (
 *         <li key={task.ruleId}>
 *           {task.text} - {getTaskPriority(task).priority}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Trip, Transport, Insurance, TaskItem } from '../types';
import {
  taskVerificationService,
  buildVerificationContext,
  calculateTaskPriority,
  calculateTaskDeadline,
  GeneratedTask,
  VerificationResult,
  TripVerificationContext,
  PriorityCalculation,
  DeadlineCalculation,
  TravelerInfo,
} from '../services/taskVerification';

// =============================================================================
// Types
// =============================================================================

export interface UseTaskVerificationOptions {
  /** Additional transport data */
  transports?: Transport[];
  /** Insurance data */
  insurance?: Insurance;
  /** Existing tasks to check for duplicates */
  existingTasks?: TaskItem[];
  /** Traveler information */
  travelers?: TravelerInfo[];
  /** Disable automatic verification */
  manual?: boolean;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Enable caching (default: true) */
  enableCache?: boolean;
}

export interface UseTaskVerificationResult {
  /** Generated tasks */
  tasks: GeneratedTask[];
  /** Full verification result */
  result: VerificationResult | null;
  /** Verification context (for priority calculations) */
  context: TripVerificationContext | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually trigger verification */
  refresh: () => Promise<void>;
  /** Calculate priority for a specific task */
  getTaskPriority: (task: GeneratedTask) => PriorityCalculation | null;
  /** Calculate deadline for a specific task */
  getTaskDeadline: (task: GeneratedTask) => DeadlineCalculation | null;
  /** Tasks grouped by category */
  tasksByCategory: Map<string, GeneratedTask[]>;
  /** Tasks sorted by priority */
  tasksByPriority: GeneratedTask[];
  /** Summary statistics */
  summary: {
    total: number;
    critical: number;
    high: number;
    overdue: number;
    dueThisWeek: number;
  };
}

// =============================================================================
// Cache Management
// =============================================================================

interface CacheEntry {
  result: VerificationResult;
  context: TripVerificationContext;
  timestamp: number;
  tripHash: string;
}

const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getTripHash(trip: Trip): string {
  return JSON.stringify({
    id: trip.id,
    startDate: trip.startDate,
    endDate: trip.endDate,
    destinations: trip.detailedDestinations?.map((d) => d.country),
  });
}

function getCachedResult(
  tripId: string,
  tripHash: string
): CacheEntry | null {
  const cached = resultCache.get(tripId);
  if (!cached) return null;

  // Check if cache is stale
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    resultCache.delete(tripId);
    return null;
  }

  // Check if trip changed
  if (cached.tripHash !== tripHash) {
    resultCache.delete(tripId);
    return null;
  }

  return cached;
}

function setCachedResult(
  tripId: string,
  tripHash: string,
  result: VerificationResult,
  context: TripVerificationContext
): void {
  resultCache.set(tripId, {
    result,
    context,
    timestamp: Date.now(),
    tripHash,
  });
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useTaskVerification(
  trip: Trip | null,
  options: UseTaskVerificationOptions = {}
): UseTaskVerificationResult {
  const {
    transports = [],
    insurance,
    existingTasks = [],
    travelers = [],
    manual = false,
    debounceMs = 500,
    enableCache = true,
  } = options;

  // State
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [context, setContext] = useState<TripVerificationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Memoize trip hash for change detection
  const tripHash = useMemo(
    () => (trip ? getTripHash(trip) : ''),
    [trip]
  );

  // Verification function
  const verify = useCallback(async () => {
    if (!trip) {
      setTasks([]);
      setResult(null);
      setContext(null);
      return;
    }

    // Check cache first
    if (enableCache) {
      const cached = getCachedResult(trip.id, tripHash);
      if (cached) {
        setTasks(cached.result.generatedTasks);
        setResult(cached.result);
        setContext(cached.context);
        return;
      }
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const ctx = buildVerificationContext(trip, {
        transports,
        insurance,
        existingTasks,
        travelers,
      });

      const verifyResult = await taskVerificationService.generateTasksForTrip(
        trip,
        {
          transports,
          insurance,
          existingTasks,
          travelers,
        }
      );

      // Check if aborted
      if (abortRef.current?.signal.aborted) {
        return;
      }

      setTasks(verifyResult.generatedTasks);
      setResult(verifyResult);
      setContext(ctx);

      // Cache result
      if (enableCache) {
        setCachedResult(trip.id, tripHash, verifyResult, ctx);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [trip, tripHash, transports, insurance, existingTasks, travelers, enableCache]);

  // Debounced verification
  const debouncedVerify = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      verify();
    }, debounceMs);
  }, [verify, debounceMs]);

  // Auto-verify on trip change (unless manual mode)
  useEffect(() => {
    if (!manual && trip) {
      debouncedVerify();
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [trip, manual, debouncedVerify]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Clear cache for this trip
    if (trip) {
      resultCache.delete(trip.id);
    }
    await verify();
  }, [trip, verify]);

  // Priority calculator
  const getTaskPriority = useCallback(
    (task: GeneratedTask): PriorityCalculation | null => {
      if (!context) return null;
      return calculateTaskPriority(task, context);
    },
    [context]
  );

  // Deadline calculator
  const getTaskDeadline = useCallback(
    (task: GeneratedTask): DeadlineCalculation | null => {
      if (!context) return null;
      return calculateTaskDeadline(task, context);
    },
    [context]
  );

  // Tasks grouped by category
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<string, GeneratedTask[]>();
    tasks.forEach((task) => {
      const existing = grouped.get(task.category) || [];
      grouped.set(task.category, [...existing, task]);
    });
    return grouped;
  }, [tasks]);

  // Tasks sorted by priority
  const tasksByPriority = useMemo(() => {
    if (!context) return tasks;

    return [...tasks].sort((a, b) => {
      const priorityA = calculateTaskPriority(a, context);
      const priorityB = calculateTaskPriority(b, context);
      return (priorityB?.score ?? 0) - (priorityA?.score ?? 0);
    });
  }, [tasks, context]);

  // Summary statistics
  const summary = useMemo(() => {
    if (!context) {
      return {
        total: tasks.length,
        critical: 0,
        high: 0,
        overdue: 0,
        dueThisWeek: 0,
      };
    }

    let critical = 0;
    let high = 0;
    let overdue = 0;
    let dueThisWeek = 0;

    tasks.forEach((task) => {
      const priority = calculateTaskPriority(task, context);
      const deadline = calculateTaskDeadline(task, context);

      if (priority?.priority === 'critical') critical++;
      if (priority?.priority === 'high') high++;
      if (deadline?.isOverdue) overdue++;
      if (deadline?.isUrgent) dueThisWeek++;
    });

    return {
      total: tasks.length,
      critical,
      high,
      overdue,
      dueThisWeek,
    };
  }, [tasks, context]);

  return {
    tasks,
    result,
    context,
    isLoading,
    error,
    refresh,
    getTaskPriority,
    getTaskDeadline,
    tasksByCategory,
    tasksByPriority,
    summary,
  };
}

// =============================================================================
// Utility Hook: Check Multiple Trips
// =============================================================================

/**
 * Hook for checking tasks across multiple trips
 * Useful for dashboard views showing all pending tasks
 */
export function useMultiTripVerification(trips: Trip[]) {
  const [results, setResults] = useState<Map<string, VerificationResult>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);

  const checkAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const newResults = await taskVerificationService.checkAllUpcomingTrips(trips);
      setResults(newResults);
    } finally {
      setIsLoading(false);
    }
  }, [trips]);

  // Auto-check on mount and when trips change
  useEffect(() => {
    if (trips.length > 0) {
      checkAll();
    }
  }, [trips, checkAll]);

  // Aggregate all tasks
  const allTasks = useMemo(() => {
    const tasks: Array<GeneratedTask & { tripId: string; tripTitle: string }> = [];
    results.forEach((result, tripId) => {
      const trip = trips.find((t) => t.id === tripId);
      result.generatedTasks.forEach((task) => {
        tasks.push({
          ...task,
          tripId,
          tripTitle: trip?.title ?? 'Unknown Trip',
        });
      });
    });
    return tasks;
  }, [results, trips]);

  return {
    results,
    allTasks,
    isLoading,
    refresh: checkAll,
    totalTasks: allTasks.length,
  };
}

export default useTaskVerification;
