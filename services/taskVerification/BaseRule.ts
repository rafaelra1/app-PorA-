/**
 * Base Rule Class
 *
 * Abstract base class that provides common functionality for all verification rules.
 * Extend this class to create new rules with minimal boilerplate.
 */

import {
  VerificationRule,
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  GeneratedTask,
  TaskCategory,
  TaskPriority,
  TaskUrgency,
} from './types';
import { parseDisplayDate } from '../../lib/dateUtils';

// =============================================================================
// Country/Region Data for Applicability Checks
// =============================================================================

export const SCHENGEN_COUNTRIES = new Set([
  'at', 'be', 'ch', 'cz', 'de', 'dk', 'ee', 'es', 'fi', 'fr',
  'gr', 'hr', 'hu', 'is', 'it', 'li', 'lt', 'lu', 'lv', 'mt',
  'nl', 'no', 'pl', 'pt', 'se', 'si', 'sk',
]);

export const HIGH_ALTITUDE_DESTINATIONS: Record<string, number> = {
  // Cities with altitude > 2500m
  'cusco': 3400,
  'la paz': 3640,
  'quito': 2850,
  'bogota': 2640,
  'lhasa': 3650,
  'addis ababa': 2355,
};

export const MALARIA_RISK_COUNTRIES = new Set([
  'ao', 'bf', 'bi', 'bj', 'cd', 'cf', 'cg', 'ci', 'cm', 'et',
  'ga', 'gh', 'gm', 'gn', 'gq', 'gw', 'ke', 'lr', 'ls', 'mg',
  'ml', 'mz', 'na', 'ne', 'ng', 'rw', 'sl', 'sn', 'so', 'ss',
  'sz', 'td', 'tg', 'tz', 'ug', 'za', 'zm', 'zw',
  // Asia
  'in', 'bd', 'pk', 'mm', 'la', 'kh', 'id', 'pg',
  // Americas
  'br', 've', 'co', 'pe', 'ec', 'bo', 'py', 'gy', 'sr', 'gf',
]);

export const YELLOW_FEVER_COUNTRIES = new Set([
  // Africa
  'ao', 'bj', 'bf', 'bi', 'cm', 'cf', 'td', 'cg', 'cd', 'ci',
  'gq', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'lr', 'ml',
  'mr', 'ne', 'ng', 'rw', 'sn', 'sl', 'ss', 'tg', 'ug',
  // Americas
  'ar', 'bo', 'br', 'co', 'ec', 'gf', 'gy', 'pa', 'py', 'pe',
  'sr', 've', 'tt',
]);

// =============================================================================
// Abstract Base Rule
// =============================================================================

export abstract class BaseRule implements VerificationRule {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract category: TaskCategory;
  abstract applicability: RuleApplicabilityConfig;

  dependsOnRules?: string[];

  /**
   * Main entry point for rule evaluation.
   * Handles applicability check, then delegates to doEvaluate.
   */
  evaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    const isApplicable = this.checkApplicability(ctx);

    if (!isApplicable) {
      return {
        ruleId: this.id,
        isApplicable: false,
        isCompliant: true,
        tasks: [],
        evaluatedAt: new Date().toISOString(),
      };
    }

    try {
      return this.doEvaluate(ctx);
    } catch (error) {
      console.error(`Rule ${this.id} evaluation failed:`, error);
      return {
        ruleId: this.id,
        isApplicable: true,
        isCompliant: true, // Don't block on error
        tasks: [],
        metadata: { error: String(error) },
        evaluatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Override this method in concrete rules to implement evaluation logic.
   */
  protected abstract doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult;

  /**
   * Check if this rule should be evaluated for the given context.
   */
  protected checkApplicability(ctx: TripVerificationContext): boolean {
    const config = this.applicability;

    // International only check
    if (config.internationalOnly && !ctx.isInternational) {
      return false;
    }

    // USA only check
    if (config.usaOnly && !ctx.flags.visitingUSA) {
      return false;
    }

    // Schengen only check
    if (config.schengenOnly && !ctx.flags.visitingSchengen) {
      return false;
    }

    // Minimum duration check
    if (config.minDuration && ctx.tripDurationDays < config.minDuration) {
      return false;
    }

    // Minimum days before trip check
    if (config.minDaysBeforeTrip && ctx.daysUntilTrip < config.minDaysBeforeTrip) {
      return false;
    }

    // Country filter
    if (config.countries && config.countries.length > 0) {
      const hasMatchingCountry = ctx.countryCodes.some(code =>
        config.countries!.includes(code.toLowerCase())
      );
      if (!hasMatchingCountry) {
        return false;
      }
    }

    // Region filter
    if (config.regions && config.regions.length > 0) {
      const hasMatchingRegion = ctx.destinations.some(dest =>
        dest.region && config.regions!.includes(dest.region)
      );
      if (!hasMatchingRegion) {
        return false;
      }
    }

    // Nationality filter
    if (config.nationalities && config.nationalities.length > 0) {
      const hasMatchingTraveler = ctx.travelers.some(t =>
        config.nationalities!.includes(t.nationality.toLowerCase())
      );
      if (!hasMatchingTraveler) {
        return false;
      }
    }

    // Custom predicate (most flexible)
    if (config.customPredicate) {
      return config.customPredicate(ctx);
    }

    return true;
  }

  /**
   * Helper to create a task with common defaults
   */
  protected createTask(
    ctx: TripVerificationContext,
    options: {
      text: string;
      description: string;
      priority: TaskPriority;
      urgency: TaskUrgency;
      daysBeforeTrip: number;
      processingTimeDays?: number;
      bufferDays?: number;
      helpUrl?: string;
      estimatedCost?: string;
      applicableDestinations?: string[];
      dependsOn?: string[];
    }
  ): GeneratedTask {
    const processingTime = options.processingTimeDays ?? 0;
    const buffer = options.bufferDays ?? 7;
    const totalDaysNeeded = options.daysBeforeTrip + processingTime + buffer;

    // Calculate suggested deadline
    const deadlineDate = new Date(ctx.startDate);
    deadlineDate.setDate(deadlineDate.getDate() - totalDaysNeeded);

    // Map urgency to priority
    const mappedPriority: 'high' | 'medium' | 'low' =
      options.urgency === 'blocking' || options.priority === 'critical' ? 'high' :
      options.urgency === 'important' || options.priority === 'high' ? 'high' :
      options.priority === 'medium' ? 'medium' : 'low';

    return {
      text: options.text,
      priority: mappedPriority,
      isCritical: options.urgency === 'blocking',
      deadline: deadlineDate.toISOString().split('T')[0],
      category: this.category,

      // Extended fields
      ruleId: this.id,
      ruleName: this.name,
      urgency: options.urgency,
      suggestedDeadline: deadlineDate.toISOString().split('T')[0],
      daysBeforeTrip: options.daysBeforeTrip,
      processingTimeDays: processingTime,
      bufferDays: buffer,
      description: options.description,
      helpUrl: options.helpUrl,
      estimatedCost: options.estimatedCost,
      applicableDestinations: options.applicableDestinations,
      dependsOn: options.dependsOn,
    };
  }

  /**
   * Create a compliant (no tasks needed) result
   */
  protected compliantResult(metadata?: Record<string, unknown>): RuleEvaluationResult {
    return {
      ruleId: this.id,
      isApplicable: true,
      isCompliant: true,
      tasks: [],
      metadata,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a non-compliant result with tasks
   */
  protected nonCompliantResult(
    tasks: GeneratedTask[],
    metadata?: Record<string, unknown>
  ): RuleEvaluationResult {
    return {
      ruleId: this.id,
      isApplicable: true,
      isCompliant: false,
      tasks,
      metadata,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if a task for this rule already exists
   */
  protected hasExistingTask(ctx: TripVerificationContext): boolean {
    return ctx.completedTaskRuleIds.includes(this.id) ||
      ctx.existingTasks.some(t =>
        t.text.toLowerCase().includes(this.name.toLowerCase())
      );
  }

  /**
   * Get destinations matching specific criteria
   */
  protected getMatchingDestinations(
    ctx: TripVerificationContext,
    predicate: (dest: typeof ctx.destinations[0]) => boolean
  ): typeof ctx.destinations {
    return ctx.destinations.filter(predicate);
  }
}

// =============================================================================
// Specialized Base Classes for Common Patterns
// =============================================================================

/**
 * Base class for document-related rules (visa, passport, ESTA, etc.)
 */
export abstract class DocumentRule extends BaseRule {
  category: TaskCategory = 'documentation';

  protected abstract getRequiredDocument(): string;
  protected abstract checkDocumentValidity(ctx: TripVerificationContext): boolean;
}

/**
 * Base class for health-related rules (vaccines, medications, insurance)
 */
export abstract class HealthRule extends BaseRule {
  category: TaskCategory = 'health';
}

/**
 * Base class for country-specific rules
 */
export abstract class CountrySpecificRule extends BaseRule {
  abstract targetCountries: string[];

  applicability: RuleApplicabilityConfig = {
    internationalOnly: true,
    customPredicate: (ctx) =>
      ctx.countryCodes.some(code =>
        this.targetCountries.includes(code.toLowerCase())
      ),
  };

  protected getTargetDestinations(ctx: TripVerificationContext) {
    return ctx.destinations.filter(d =>
      this.targetCountries.includes(d.countryCode.toLowerCase())
    );
  }
}
