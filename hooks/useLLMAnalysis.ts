/**
 * useLLMAnalysis Hook
 *
 * React hook for integrating LLM-powered trip analysis.
 * Provides contextual insights that complement deterministic rules.
 *
 * Features:
 * - On-demand analysis (not automatic to control costs)
 * - Caching to avoid redundant API calls
 * - Clear distinction between AI suggestions and verified rules
 *
 * @example
 * ```tsx
 * function TripInsights({ trip }: { trip: Trip }) {
 *   const {
 *     insights,
 *     suggestedTasks,
 *     analyze,
 *     isAnalyzing,
 *     cost,
 *   } = useLLMAnalysis(trip);
 *
 *   return (
 *     <div>
 *       <button onClick={() => analyze('manual')} disabled={isAnalyzing}>
 *         {isAnalyzing ? 'Analisando...' : 'Analisar Viagem'}
 *       </button>
 *
 *       {insights.map(insight => (
 *         <InsightCard key={insight.id} insight={insight} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Trip, Transport, Insurance, TaskItem, ItineraryActivity } from '../types';
import {
  LLMAnalysisResult,
  LLMInsight,
  LLMSuggestedTask,
  AnalysisTrigger,
  ConfidenceLevel,
} from '../services/taskVerification/llm/types';
import { getLLMAnalysisService } from '../services/taskVerification/llm/LLMAnalysisService';

// =============================================================================
// Types
// =============================================================================

export interface UseLLMAnalysisOptions {
  /** Transport bookings */
  transports?: Transport[];
  /** Insurance data */
  insurance?: Insurance;
  /** Existing tasks */
  existingTasks?: TaskItem[];
  /** Itinerary activities */
  activities?: ItineraryActivity[];
  /** Auto-analyze on approaching trip */
  autoAnalyzeOnApproaching?: boolean;
  /** Days before trip to auto-analyze */
  autoAnalyzeDays?: number;
}

export interface UseLLMAnalysisResult {
  // Results
  insights: LLMInsight[];
  suggestedTasks: LLMSuggestedTask[];
  summary: LLMAnalysisResult['summary'] | null;

  // Analysis state
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
  lastAnalyzedAt: string | null;
  error: Error | null;

  // Cost tracking
  tokenUsage: LLMAnalysisResult['tokenUsage'] | null;
  estimatedCostUSD: number;

  // Actions
  analyze: (trigger?: AnalysisTrigger) => Promise<void>;
  clearResults: () => void;

  // Task actions
  acceptTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  acceptedTasks: LLMSuggestedTask[];
  rejectedTaskIds: Set<string>;

  // Filtered views
  criticalInsights: LLMInsight[];
  warningInsights: LLMInsight[];
  tipInsights: LLMInsight[];
  highConfidenceTasks: LLMSuggestedTask[];

  // Status
  canAnalyze: boolean;
  analysisReason: string | null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useLLMAnalysis(
  trip: Trip | null,
  options: UseLLMAnalysisOptions = {}
): UseLLMAnalysisResult {
  const {
    transports = [],
    insurance,
    existingTasks = [],
    activities = [],
    autoAnalyzeOnApproaching = false,
    autoAnalyzeDays = 14,
  } = options;

  // State
  const [result, setResult] = useState<LLMAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [rejectedTaskIds, setRejectedTaskIds] = useState<Set<string>>(new Set());
  const [acceptedTaskIds, setAcceptedTaskIds] = useState<Set<string>>(new Set());

  // Refs
  const hasAutoAnalyzed = useRef(false);
  const service = getLLMAnalysisService();

  // Derived state
  const insights = result?.insights ?? [];
  const suggestedTasks = result?.suggestedTasks ?? [];

  // Filtered tasks (excluding rejected)
  const filteredTasks = useMemo(
    () => suggestedTasks.filter(t => !rejectedTaskIds.has(t.text)),
    [suggestedTasks, rejectedTaskIds]
  );

  // Accepted tasks
  const acceptedTasks = useMemo(
    () => filteredTasks.filter(t => acceptedTaskIds.has(t.text)),
    [filteredTasks, acceptedTaskIds]
  );

  // Filtered insights by severity
  const criticalInsights = useMemo(
    () => insights.filter(i => i.severity === 'critical'),
    [insights]
  );

  const warningInsights = useMemo(
    () => insights.filter(i => i.severity === 'warning'),
    [insights]
  );

  const tipInsights = useMemo(
    () => insights.filter(i => i.severity === 'tip' || i.severity === 'info'),
    [insights]
  );

  // High confidence tasks
  const highConfidenceTasks = useMemo(
    () => filteredTasks.filter(t => t.confidence === 'high'),
    [filteredTasks]
  );

  // Can analyze check
  const canAnalyze = useMemo(() => {
    if (!trip) return false;
    if (isAnalyzing) return false;
    return true;
  }, [trip, isAnalyzing]);

  // Analysis reason
  const analysisReason = useMemo(() => {
    if (!trip) return 'Nenhuma viagem selecionada';
    if (isAnalyzing) return 'Análise em andamento';
    if (result) {
      const hoursSince = (Date.now() - new Date(result.analyzedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 1) return 'Analisado há poucos minutos';
      if (hoursSince < 24) return `Analisado há ${Math.round(hoursSince)} horas`;
    }
    return 'Pronto para análise';
  }, [trip, isAnalyzing, result]);

  // Analyze function
  const analyze = useCallback(async (trigger: AnalysisTrigger = 'manual') => {
    if (!trip || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResult = await service.analyzeTrip(trip, {
        trigger,
        transports,
        insurance,
        existingTasks,
        activities,
      });

      setResult(analysisResult);
      // Reset task states on new analysis
      setRejectedTaskIds(new Set());
      setAcceptedTaskIds(new Set());

    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  }, [trip, isAnalyzing, transports, insurance, existingTasks, activities, service]);

  // Clear results
  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
    setRejectedTaskIds(new Set());
    setAcceptedTaskIds(new Set());
    if (trip) {
      service.clearCache(trip.id);
    }
  }, [trip, service]);

  // Accept task
  const acceptTask = useCallback((taskText: string) => {
    setAcceptedTaskIds(prev => new Set([...prev, taskText]));
    setRejectedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskText);
      return next;
    });
  }, []);

  // Reject task
  const rejectTask = useCallback((taskText: string) => {
    setRejectedTaskIds(prev => new Set([...prev, taskText]));
    setAcceptedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskText);
      return next;
    });
  }, []);

  // Auto-analyze when trip is approaching
  useEffect(() => {
    if (!autoAnalyzeOnApproaching || !trip || hasAutoAnalyzed.current) return;

    const daysUntil = calculateDaysUntil(trip.startDate);
    if (daysUntil <= autoAnalyzeDays && daysUntil > 0) {
      hasAutoAnalyzed.current = true;
      analyze('approaching_trip');
    }
  }, [trip, autoAnalyzeOnApproaching, autoAnalyzeDays, analyze]);

  // Reset auto-analyze flag when trip changes
  useEffect(() => {
    hasAutoAnalyzed.current = false;
  }, [trip?.id]);

  return {
    // Results
    insights,
    suggestedTasks: filteredTasks,
    summary: result?.summary ?? null,

    // Analysis state
    isAnalyzing,
    hasAnalyzed: result !== null,
    lastAnalyzedAt: result?.analyzedAt ?? null,
    error,

    // Cost tracking
    tokenUsage: result?.tokenUsage ?? null,
    estimatedCostUSD: result?.tokenUsage?.estimatedCostUSD ?? 0,

    // Actions
    analyze,
    clearResults,

    // Task actions
    acceptTask,
    rejectTask,
    acceptedTasks,
    rejectedTaskIds,

    // Filtered views
    criticalInsights,
    warningInsights,
    tipInsights,
    highConfidenceTasks,

    // Status
    canAnalyze,
    analysisReason,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function calculateDaysUntil(dateStr: string): number {
  let targetDate: Date;

  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    targetDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  } else {
    targetDate = new Date(dateStr);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// =============================================================================
// Utility Hook: Combined Verification + LLM Analysis
// =============================================================================

/**
 * Hook that combines deterministic rules with LLM analysis
 * Use this for a complete task verification experience
 */
export function useCombinedVerification(
  trip: Trip | null,
  options: UseLLMAnalysisOptions = {}
) {
  // Import the rule-based hook
  const { useTaskVerification } = require('./useTaskVerification');

  const ruleResults = useTaskVerification(trip, options);
  const llmResults = useLLMAnalysis(trip, options);

  // Combine tasks, clearly marking source
  const allTasks = useMemo(() => {
    const ruleTasks = ruleResults.tasks.map(t => ({
      ...t,
      source: 'deterministic_rule' as const,
      isVerified: true,
    }));

    const llmTasks = llmResults.acceptedTasks.map(t => ({
      ...t,
      source: 'llm_analysis' as const,
      isVerified: false,
    }));

    return [...ruleTasks, ...llmTasks];
  }, [ruleResults.tasks, llmResults.acceptedTasks]);

  // Combined summary
  const combinedSummary = useMemo(() => ({
    ruleBasedTasks: ruleResults.tasks.length,
    llmSuggestedTasks: llmResults.suggestedTasks.length,
    llmAcceptedTasks: llmResults.acceptedTasks.length,
    totalTasks: allTasks.length,
    criticalIssues: ruleResults.summary.critical + llmResults.criticalInsights.length,
    hasLLMAnalysis: llmResults.hasAnalyzed,
  }), [ruleResults, llmResults, allTasks]);

  return {
    // Rule-based results
    ruleTasks: ruleResults.tasks,
    ruleLoading: ruleResults.isLoading,
    refreshRules: ruleResults.refresh,

    // LLM results
    llmInsights: llmResults.insights,
    llmSuggestedTasks: llmResults.suggestedTasks,
    llmAcceptedTasks: llmResults.acceptedTasks,
    llmAnalyzing: llmResults.isAnalyzing,
    analyzeLLM: llmResults.analyze,
    acceptLLMTask: llmResults.acceptTask,
    rejectLLMTask: llmResults.rejectTask,

    // Combined
    allTasks,
    combinedSummary,

    // Cost tracking
    llmCost: llmResults.estimatedCostUSD,
  };
}

export default useLLMAnalysis;
