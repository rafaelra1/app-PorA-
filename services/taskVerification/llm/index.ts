/**
 * LLM Analysis Module
 *
 * AI-powered contextual trip analysis that complements deterministic rules.
 *
 * @example
 * ```typescript
 * import { getLLMAnalysisService } from './services/taskVerification/llm';
 *
 * const service = getLLMAnalysisService();
 * const result = await service.analyzeTrip(trip, {
 *   trigger: 'manual',
 *   transports,
 *   existingTasks: trip.tasks,
 * });
 *
 * // Process insights
 * result.insights.forEach(insight => {
 *   console.log(`[${insight.severity}] ${insight.title}: ${insight.description}`);
 * });
 *
 * // Process suggested tasks (require user validation)
 * result.suggestedTasks.forEach(task => {
 *   console.log(`[AI] ${task.text} (confidence: ${task.confidence})`);
 * });
 * ```
 */

// Service
export {
  LLMAnalysisService,
  getLLMAnalysisService,
  resetLLMAnalysisService,
} from './LLMAnalysisService';

// Types
export type {
  AnalysisTrigger,
  ConfidenceLevel,
  SuggestionSource,
  InsightCategory,
  LLMInsight,
  LLMSuggestedTask,
  LLMAnalysisResult,
  SerializedTripForLLM,
  LLMAnalysisConfig,
  LLMAnalysisCacheEntry,
  TripChangeSignature,
  CachedPromptContext,
  ValidationResult,
  ValidationIssue,
  HallucinationCheck,
} from './types';

export { DEFAULT_LLM_CONFIG } from './types';

// Prompts (for advanced usage/testing)
export {
  PROMPT_VERSION,
  STATIC_TRAVEL_KNOWLEDGE,
  OUTPUT_FORMAT_INSTRUCTIONS,
  QUALITY_GUIDELINES,
  buildAnalysisPrompt,
  buildValidationPrompt,
  FOCUSED_PROMPTS,
} from './prompts';
