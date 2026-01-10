/**
 * Task Verification System
 *
 * Automatic task generation based on trip analysis.
 *
 * @example
 * ```typescript
 * import { taskVerificationService, buildVerificationContext } from './services/taskVerification';
 *
 * // Generate tasks for a trip
 * const result = await taskVerificationService.generateTasksForTrip(trip, {
 *   transports,
 *   insurance,
 *   existingTasks: trip.tasks,
 * });
 *
 * // Access generated tasks
 * result.generatedTasks.forEach(task => {
 *   console.log(task.text, task.priority, task.suggestedDeadline);
 * });
 * ```
 */

// Main service
export {
  taskVerificationService,
  calculateTaskPriority,
  calculateTaskDeadline,
  buildVerificationContext,
} from './taskVerificationService';

// Types
export type {
  GeneratedTask,
  VerificationResult,
  TripVerificationContext,
  TaskCategory,
  TaskPriority,
  TaskUrgency,
  TravelerInfo,
  EnrichedDestination,
  RuleEvaluationResult,
  PriorityCalculation,
  DeadlineCalculation,
} from './types';
export type {
  TaskVerificationService,
  GenerateTasksOptions,
  TaskRefreshResult,
} from './taskVerificationService';

// Engine (for advanced usage)
export { VerificationEngine, verificationEngine } from './VerificationEngine';

// Rules (for extending or testing)
export { BaseRule, DocumentRule, HealthRule, CountrySpecificRule } from './BaseRule';
export { ALL_RULES, getRuleById, getRulesByCategory } from './rules';

// Individual rules (for direct testing)
export { TravelInsuranceRule } from './rules/TravelInsuranceRule';
export { ESTARule } from './rules/ESTARule';
export { PassportValidityRule } from './rules/PassportValidityRule';
export { SchengenInsuranceRule } from './rules/SchengenInsuranceRule';
export { YellowFeverVaccineRule } from './rules/YellowFeverVaccineRule';
export { HighAltitudeMedicationRule } from './rules/HighAltitudeMedicationRule';
export { NotifyBankRule } from './rules/NotifyBankRule';
export { OfflineMapsRule } from './rules/OfflineMapsRule';

// =============================================================================
// LLM Analysis Module (AI-powered contextual insights)
// =============================================================================

export {
  LLMAnalysisService,
  getLLMAnalysisService,
} from './llm';

export type {
  LLMInsight,
  LLMSuggestedTask,
  LLMAnalysisResult,
  AnalysisTrigger,
  ConfidenceLevel,
  InsightCategory,
} from './llm';
