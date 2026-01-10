/**
 * Task Verification Engine
 *
 * The engine orchestrates rule evaluation, handles deduplication,
 * manages task state, and optimizes performance through batching.
 *
 * Key Responsibilities:
 * 1. Build verification context from trip data
 * 2. Determine which rules are applicable
 * 3. Execute rules in dependency order
 * 4. Handle task deduplication
 * 5. Track state changes for re-evaluation
 */

import {
  Trip,
  DetailedDestination,
  Transport,
  Insurance,
  TaskItem,
} from '../../types';
import { COUNTRY_CODES } from '../../lib/countryUtils';
import { parseDisplayDate, calculateDaysRemaining } from '../../lib/dateUtils';
import {
  TripVerificationContext,
  EnrichedDestination,
  TravelerInfo,
  VerificationRule,
  VerificationResult,
  RuleEvaluationResult,
  GeneratedTask,
  RuleEngineConfig,
  TaskRuleMapping,
  TripStateSnapshot,
} from './types';
import { SCHENGEN_COUNTRIES, HIGH_ALTITUDE_DESTINATIONS, MALARIA_RISK_COUNTRIES } from './BaseRule';
import { ALL_RULES } from './rules';

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: RuleEngineConfig = {
  maxRulesPerEvaluation: 50,
  parallelEvaluation: true,
  deduplicationStrategy: 'skip',
  defaultBufferDays: 7,
  cacheDurationMs: 5 * 60 * 1000, // 5 minutes
};

// =============================================================================
// Context Builder
// =============================================================================

/**
 * Builds a TripVerificationContext from raw trip data.
 * This is the main entry point for preparing data for rule evaluation.
 */
export function buildVerificationContext(
  trip: Trip,
  options: {
    transports?: Transport[];
    insurance?: Insurance;
    existingTasks?: TaskItem[];
    travelers?: TravelerInfo[];
  } = {}
): TripVerificationContext {
  const { transports = [], insurance, existingTasks = [], travelers = [] } = options;

  // Parse dates
  const startDate = parseDate(trip.startDate);
  const endDate = parseDate(trip.endDate);
  const daysUntilTrip = calculateDaysRemaining(trip.startDate);
  const tripDurationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Enrich destinations
  const destinations = enrichDestinations(trip.detailedDestinations || []);
  const countryCodes = [...new Set(destinations.map((d) => d.countryCode))];

  // Determine if international
  const isInternational = countryCodes.some((code) => code.toLowerCase() !== 'br');

  // Check for flights
  const hasFlights = transports.some((t) => t.type === 'flight');

  // Check insurance validity
  const hasValidInsurance = insurance
    ? parseDate(insurance.startDate) <= startDate &&
      parseDate(insurance.endDate) >= endDate
    : false;

  // Get completed task rule IDs
  const completedTaskRuleIds = existingTasks
    .filter((t) => t.completed)
    .map((t) => extractRuleId(t))
    .filter(Boolean) as string[];

  // Calculate flags
  const flags = calculateFlags(destinations, countryCodes, transports);

  // Use provided travelers or create default primary traveler
  const effectiveTravelers =
    travelers.length > 0
      ? travelers
      : [{ id: 'primary', name: 'Viajante Principal', nationality: 'br' }];

  return {
    trip,
    tripId: trip.id,
    startDate,
    endDate,
    daysUntilTrip,
    tripDurationDays,
    destinations,
    countryCodes,
    isInternational,
    travelers: effectiveTravelers,
    primaryTraveler: effectiveTravelers[0],
    transports,
    hasFlights,
    insurance,
    hasValidInsurance,
    existingTasks,
    completedTaskRuleIds,
    flags,
  };
}

// =============================================================================
// Rule Execution Engine
// =============================================================================

/**
 * Main engine class for running verifications
 */
export class VerificationEngine {
  private rules: VerificationRule[];
  private config: RuleEngineConfig;
  private taskMappings: Map<string, TaskRuleMapping[]> = new Map();
  private stateSnapshots: Map<string, TripStateSnapshot> = new Map();

  constructor(
    rules: VerificationRule[] = ALL_RULES,
    config: Partial<RuleEngineConfig> = {}
  ) {
    this.rules = rules;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all applicable verifications for a trip
   */
  async verify(ctx: TripVerificationContext): Promise<VerificationResult> {
    const startTime = Date.now();
    const errors: { ruleId: string; error: string }[] = [];
    const ruleResults: RuleEvaluationResult[] = [];
    let applicableCount = 0;

    // Sort rules by dependency order
    const sortedRules = this.topologicalSort(this.rules);

    // Track completed rules for dependency resolution
    const completedRules = new Set<string>();
    const failedRules = new Set<string>();

    for (const rule of sortedRules) {
      // Check dependencies
      if (rule.dependsOnRules) {
        const unmetDeps = rule.dependsOnRules.filter(
          (depId) => !completedRules.has(depId) && !failedRules.has(depId)
        );
        if (unmetDeps.length > 0) {
          // Skip rule with unmet dependencies
          continue;
        }
      }

      try {
        const result = rule.evaluate(ctx);
        ruleResults.push(result);

        if (result.isApplicable) {
          applicableCount++;
          completedRules.add(rule.id);
        }

        if (!result.isCompliant) {
          failedRules.add(rule.id);
        }
      } catch (error) {
        errors.push({
          ruleId: rule.id,
          error: error instanceof Error ? error.message : String(error),
        });
        failedRules.add(rule.id);
      }
    }

    // Collect and deduplicate tasks
    const allTasks = ruleResults.flatMap((r) => r.tasks);
    const { tasks: deduplicatedTasks, skipped } = this.deduplicateTasks(
      ctx,
      allTasks
    );

    // Update task mappings
    this.updateTaskMappings(ctx.tripId, deduplicatedTasks);

    // Update state snapshot
    this.updateStateSnapshot(ctx);

    return {
      tripId: ctx.tripId,
      evaluatedAt: new Date().toISOString(),
      totalRulesEvaluated: sortedRules.length,
      applicableRules: applicableCount,
      newTasksGenerated: deduplicatedTasks.length,
      skippedDuplicates: skipped,
      ruleResults,
      generatedTasks: deduplicatedTasks,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Re-verify a trip after changes
   * Detects what changed and only re-runs affected rules
   */
  async reverify(
    ctx: TripVerificationContext,
    previousCtx?: TripVerificationContext
  ): Promise<VerificationResult> {
    // Get previous snapshot
    const snapshot = this.stateSnapshots.get(ctx.tripId);

    if (!snapshot) {
      // No previous state, run full verification
      return this.verify(ctx);
    }

    // Calculate current hash
    const currentHash = this.calculateStateHash(ctx);

    if (currentHash === snapshot.hash) {
      // No changes, return cached result
      return {
        tripId: ctx.tripId,
        evaluatedAt: new Date().toISOString(),
        totalRulesEvaluated: 0,
        applicableRules: 0,
        newTasksGenerated: 0,
        skippedDuplicates: 0,
        ruleResults: [],
        generatedTasks: [],
      };
    }

    // Detect what changed
    const changes = this.detectChanges(snapshot, ctx);

    // Invalidate tasks affected by changes
    await this.invalidateAffectedTasks(ctx.tripId, changes);

    // Re-run verification
    return this.verify(ctx);
  }

  /**
   * Handle task completion
   * Checks if completing this task affects other tasks
   */
  handleTaskCompleted(tripId: string, taskId: string): void {
    const mappings = this.taskMappings.get(tripId) || [];
    const mapping = mappings.find((m) => m.taskId === taskId);

    if (mapping) {
      mapping.wasCompleted = true;
      mapping.completedAt = new Date().toISOString();
    }
  }

  /**
   * Handle trip modification
   * Checks which tasks are still relevant
   */
  async handleTripModified(
    ctx: TripVerificationContext
  ): Promise<{
    invalidatedTasks: string[];
    newTasks: GeneratedTask[];
    staleTasks: string[];
  }> {
    const snapshot = this.stateSnapshots.get(ctx.tripId);
    const mappings = this.taskMappings.get(ctx.tripId) || [];

    const invalidatedTasks: string[] = [];
    const staleTasks: string[] = [];

    // Check each existing task mapping
    for (const mapping of mappings) {
      const rule = this.rules.find((r) => r.id === mapping.ruleId);
      if (!rule) continue;

      // Re-evaluate rule to see if task is still needed
      const result = rule.evaluate(ctx);

      if (!result.isApplicable) {
        // Rule no longer applies - task is no longer needed
        invalidatedTasks.push(mapping.taskId);
        mapping.isStale = true;
        mapping.invalidatedAt = new Date().toISOString();
        mapping.invalidationReason = 'rule_no_longer_applicable';
      } else if (result.isCompliant && !mapping.wasCompleted) {
        // Rule is now compliant but task wasn't completed
        // This means something external satisfied the requirement
        staleTasks.push(mapping.taskId);
        mapping.isStale = true;
        mapping.invalidationReason = 'requirement_satisfied_externally';
      }
    }

    // Re-verify to find new tasks
    const verifyResult = await this.reverify(ctx);

    // Update snapshot
    this.updateStateSnapshot(ctx);

    return {
      invalidatedTasks,
      newTasks: verifyResult.generatedTasks,
      staleTasks,
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Topological sort of rules based on dependencies
   */
  private topologicalSort(rules: VerificationRule[]): VerificationRule[] {
    const sorted: VerificationRule[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (rule: VerificationRule) => {
      if (visited.has(rule.id)) return;
      if (visiting.has(rule.id)) {
        throw new Error(`Circular dependency detected: ${rule.id}`);
      }

      visiting.add(rule.id);

      // Visit dependencies first
      if (rule.dependsOnRules) {
        for (const depId of rule.dependsOnRules) {
          const depRule = rules.find((r) => r.id === depId);
          if (depRule) {
            visit(depRule);
          }
        }
      }

      visiting.delete(rule.id);
      visited.add(rule.id);
      sorted.push(rule);
    };

    for (const rule of rules) {
      visit(rule);
    }

    return sorted;
  }

  /**
   * Deduplicate tasks based on strategy
   */
  private deduplicateTasks(
    ctx: TripVerificationContext,
    tasks: GeneratedTask[]
  ): { tasks: GeneratedTask[]; skipped: number } {
    const existingMappings = this.taskMappings.get(ctx.tripId) || [];
    const existingRuleIds = new Set(existingMappings.map((m) => m.ruleId));

    let skipped = 0;
    const uniqueTasks: GeneratedTask[] = [];

    for (const task of tasks) {
      // Check if task for this rule already exists
      if (existingRuleIds.has(task.ruleId)) {
        if (this.config.deduplicationStrategy === 'skip') {
          skipped++;
          continue;
        }
        // For 'update' strategy, we'd update the existing task
        // For 'version' strategy, we'd create a new version
      }

      // Check if similar task already exists in trip's existing tasks
      const hasSimilar = ctx.existingTasks.some(
        (t) =>
          t.text.toLowerCase() === task.text.toLowerCase() ||
          (t.category === task.category &&
            t.text.toLowerCase().includes(task.ruleName.toLowerCase()))
      );

      if (hasSimilar) {
        skipped++;
        continue;
      }

      uniqueTasks.push(task);
    }

    return { tasks: uniqueTasks, skipped };
  }

  /**
   * Update task mappings for tracking
   */
  private updateTaskMappings(tripId: string, tasks: GeneratedTask[]): void {
    const existing = this.taskMappings.get(tripId) || [];
    const snapshot = this.stateSnapshots.get(tripId);

    const newMappings: TaskRuleMapping[] = tasks.map((task) => ({
      taskId: `task-${task.ruleId}-${Date.now()}`,
      ruleId: task.ruleId,
      tripId,
      generatedAt: new Date().toISOString(),
      tripVersion: snapshot?.version ?? 1,
      isStale: false,
      wasCompleted: false,
    }));

    this.taskMappings.set(tripId, [...existing, ...newMappings]);
  }

  /**
   * Update state snapshot for change detection
   */
  private updateStateSnapshot(ctx: TripVerificationContext): void {
    const existing = this.stateSnapshots.get(ctx.tripId);

    this.stateSnapshots.set(ctx.tripId, {
      tripId: ctx.tripId,
      version: (existing?.version ?? 0) + 1,
      hash: this.calculateStateHash(ctx),
      destinations: ctx.countryCodes,
      startDate: ctx.trip.startDate,
      endDate: ctx.trip.endDate,
      travelerCount: ctx.travelers.length,
      hasInsurance: ctx.hasValidInsurance,
      capturedAt: new Date().toISOString(),
    });
  }

  /**
   * Calculate a hash of relevant trip state for change detection
   */
  private calculateStateHash(ctx: TripVerificationContext): string {
    const stateString = JSON.stringify({
      destinations: ctx.countryCodes.sort(),
      startDate: ctx.trip.startDate,
      endDate: ctx.trip.endDate,
      travelers: ctx.travelers.map((t) => t.nationality).sort(),
      hasInsurance: ctx.hasValidInsurance,
      transportCount: ctx.transports.length,
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
      const char = stateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Detect what changed between snapshots
   */
  private detectChanges(
    snapshot: TripStateSnapshot,
    ctx: TripVerificationContext
  ): Set<string> {
    const changes = new Set<string>();

    if (snapshot.startDate !== ctx.trip.startDate) {
      changes.add('startDate');
    }
    if (snapshot.endDate !== ctx.trip.endDate) {
      changes.add('endDate');
    }
    if (snapshot.hasInsurance !== ctx.hasValidInsurance) {
      changes.add('insurance');
    }
    if (snapshot.travelerCount !== ctx.travelers.length) {
      changes.add('travelers');
    }

    const prevDests = new Set(snapshot.destinations);
    const currDests = new Set(ctx.countryCodes);

    for (const dest of currDests) {
      if (!prevDests.has(dest)) {
        changes.add('destinations');
        break;
      }
    }
    for (const dest of prevDests) {
      if (!currDests.has(dest)) {
        changes.add('destinations');
        break;
      }
    }

    return changes;
  }

  /**
   * Invalidate tasks affected by changes
   */
  private async invalidateAffectedTasks(
    tripId: string,
    changes: Set<string>
  ): Promise<void> {
    const mappings = this.taskMappings.get(tripId) || [];

    for (const mapping of mappings) {
      // For now, mark all tasks as potentially stale when destinations change
      if (changes.has('destinations')) {
        mapping.isStale = true;
        mapping.invalidationReason = 'destinations_changed';
      }
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function parseDate(dateStr: string): Date {
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const iso = parseDisplayDate(dateStr);
    return new Date(iso + 'T12:00:00');
  }
  return new Date(dateStr + 'T12:00:00');
}

function enrichDestinations(destinations: DetailedDestination[]): EnrichedDestination[] {
  return destinations.map((dest) => {
    const countryCode = resolveCountryCode(dest.country || '');
    const cityLower = dest.name.toLowerCase();

    return {
      ...dest,
      countryCode,
      countryName: dest.country || '',
      region: getRegion(countryCode),
      isSchengenZone: SCHENGEN_COUNTRIES.has(countryCode),
      altitude: HIGH_ALTITUDE_DESTINATIONS[cityLower],
      malariaRisk: MALARIA_RISK_COUNTRIES.has(countryCode),
    };
  });
}

function resolveCountryCode(country: string): string {
  const lower = country.toLowerCase();
  return COUNTRY_CODES[lower] || lower.slice(0, 2);
}

function getRegion(countryCode: string): string | undefined {
  const europeanCountries = new Set([
    'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr',
    'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl',
    'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'gb', 'ch', 'no', 'is',
  ]);

  const asianCountries = new Set([
    'jp', 'kr', 'cn', 'tw', 'hk', 'th', 'vn', 'sg', 'my', 'id',
    'ph', 'in', 'pk', 'bd', 'lk', 'np', 'mm', 'kh', 'la',
  ]);

  const northAmericanCountries = new Set(['us', 'ca', 'mx']);

  const southAmericanCountries = new Set([
    'br', 'ar', 'cl', 'co', 'pe', 've', 'ec', 'bo', 'py', 'uy',
  ]);

  const code = countryCode.toLowerCase();

  if (europeanCountries.has(code)) return 'europe';
  if (asianCountries.has(code)) return 'asia';
  if (northAmericanCountries.has(code)) return 'north_america';
  if (southAmericanCountries.has(code)) return 'south_america';

  return undefined;
}

function calculateFlags(
  destinations: EnrichedDestination[],
  countryCodes: string[],
  transports: Transport[]
): TripVerificationContext['flags'] {
  const hasLongFlight = transports.some((t) => {
    if (t.type !== 'flight') return false;
    // Estimate based on duration string if available
    if (t.duration) {
      const hours = parseDurationToHours(t.duration);
      return hours > 6;
    }
    return false;
  });

  return {
    visitingUSA: countryCodes.some((c) => c.toLowerCase() === 'us'),
    visitingSchengen: countryCodes.some((c) => SCHENGEN_COUNTRIES.has(c.toLowerCase())),
    visitingHighAltitude: destinations.some((d) => (d.altitude ?? 0) > 2500),
    visitingMalariaZone: destinations.some((d) => d.malariaRisk === true),
    needsAdapter: checkNeedsAdapter(destinations),
    longHaulFlight: hasLongFlight,
    multipleCountries: countryCodes.length > 1,
  };
}

function parseDurationToHours(duration: string): number {
  // Parse strings like "14h 30m" or "14:30" or "14 hours"
  const hourMatch = duration.match(/(\d+)\s*h/i);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10);
  }

  const colonMatch = duration.match(/(\d+):(\d+)/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10);
  }

  return 0;
}

function checkNeedsAdapter(destinations: EnrichedDestination[]): boolean {
  // Brazil uses type N plugs
  // Check if any destination has different plug type
  const differentPlugCountries = new Set([
    'gb', 'ie', 'cy', 'mt', // Type G
    'ch', 'li', // Type J
    'dk', // Type K
    'it', // Type L
    'il', // Type H
    'in', 'pk', 'np', 'lk', // Type D
    'au', 'nz', 'cn', 'ar', // Type I
    'us', 'ca', 'mx', 'jp', // Type A/B
  ]);

  return destinations.some((d) =>
    differentPlugCountries.has(d.countryCode.toLowerCase())
  );
}

function extractRuleId(task: TaskItem): string | undefined {
  // Try to extract rule ID from task metadata
  // This assumes tasks store the rule ID somehow
  // In practice, this would be stored in the task's metadata
  return undefined;
}

// =============================================================================
// Singleton Export
// =============================================================================

export const verificationEngine = new VerificationEngine();
