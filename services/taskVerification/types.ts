/**
 * Task Verification System - Types
 *
 * This module defines the type system for the automatic task generation engine.
 * Rules can declare applicability conditions, examine trip data, and generate
 * appropriate tasks with full metadata.
 */

import { Trip, DetailedDestination, Transport, Insurance, TaskItem } from '../../types';

// =============================================================================
// Core Rule Types
// =============================================================================

/**
 * Priority levels for generated tasks
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Categories for task organization
 */
export type TaskCategory =
  | 'documentation'  // Passports, visas, ESTA, etc.
  | 'health'         // Vaccines, medications, insurance
  | 'reservations'   // Hotels, flights, activities
  | 'financial'      // Currency, cards, bank notifications
  | 'packing'        // Luggage, essentials
  | 'connectivity'   // SIM cards, apps, offline maps
  | 'transport'      // Car rentals, transfers
  | 'legal'          // Entry requirements, customs
  | 'other';

/**
 * Urgency classification based on consequences of not completing
 */
export type TaskUrgency =
  | 'blocking'    // Trip cannot happen without this (visa, passport)
  | 'important'   // Significant negative impact (insurance, vaccines)
  | 'recommended' // Better experience with it (offline maps, apps)
  | 'optional';   // Nice to have (playlist, travel journal)

/**
 * Extended task with verification metadata
 */
export interface GeneratedTask extends Omit<TaskItem, 'id' | 'completed'> {
  // Rule metadata
  ruleId: string;
  ruleName: string;

  // Enhanced categorization
  category: TaskCategory;
  urgency: TaskUrgency;

  // Deadline calculation
  suggestedDeadline: string;           // ISO date
  daysBeforeTrip: number;              // Ideal completion window
  processingTimeDays: number;          // Typical time needed (e.g., visa = 15 days)
  bufferDays: number;                  // Safety margin

  // Dependencies
  dependsOn?: string[];                // Other rule IDs that must complete first
  blockedBy?: string[];                // Rules that block this one

  // Contextual info
  applicableDestinations?: string[];   // Which destinations triggered this
  description: string;                 // Detailed explanation
  helpUrl?: string;                    // Link for more information
  estimatedCost?: string;              // Cost estimate if applicable

  // Tracking
  relevantSince?: string;              // When this task became relevant
  expiresAt?: string;                  // When this task is no longer needed
}

/**
 * Result of a single rule evaluation
 */
export interface RuleEvaluationResult {
  ruleId: string;
  isApplicable: boolean;
  isCompliant: boolean;
  tasks: GeneratedTask[];
  metadata?: Record<string, unknown>;
  evaluatedAt: string;
}

// =============================================================================
// Trip Context for Rule Evaluation
// =============================================================================

/**
 * Traveler information for rule evaluation
 */
export interface TravelerInfo {
  id: string;
  name: string;
  nationality: string;          // ISO country code (e.g., 'BR')
  passportExpiry?: string;      // ISO date
  hasGlobalEntry?: boolean;
  hasESTA?: {
    isValid: boolean;
    expiryDate?: string;
  };
  existingVisas?: {
    country: string;
    type: string;
    expiryDate: string;
  }[];
  healthConditions?: string[];
  vaccinations?: {
    type: string;
    date: string;
    expiryDate?: string;
  }[];
}

/**
 * Enriched destination data for rule evaluation
 */
export interface EnrichedDestination extends DetailedDestination {
  // Resolved country data
  countryCode: string;           // ISO 2-letter code
  countryName: string;
  region?: string;               // e.g., 'europe', 'north_america'

  // Entry requirements
  isSchengenZone?: boolean;
  requiresVisa?: boolean;
  requiresESTA?: boolean;
  requiresETA?: boolean;

  // Health & Safety
  altitude?: number;             // meters
  malariaRisk?: boolean;
  yellowFeverRequired?: boolean;
  covidRestrictions?: string;

  // Practical info
  plugType?: string;
  currencyCode?: string;
  timezone?: string;
  drivingSide?: 'left' | 'right';
}

/**
 * Complete context passed to rules for evaluation
 * This aggregates all trip data in a queryable format
 */
export interface TripVerificationContext {
  // Core trip data
  trip: Trip;
  tripId: string;

  // Timing
  startDate: Date;
  endDate: Date;
  daysUntilTrip: number;
  tripDurationDays: number;

  // Destinations (enriched)
  destinations: EnrichedDestination[];
  countryCodes: string[];        // Unique country codes
  isInternational: boolean;

  // Travelers
  travelers: TravelerInfo[];
  primaryTraveler?: TravelerInfo;

  // Existing bookings
  transports: Transport[];
  hasFlights: boolean;

  // Insurance
  insurance?: Insurance;
  hasValidInsurance: boolean;

  // Existing tasks (to avoid duplicates)
  existingTasks: TaskItem[];
  completedTaskRuleIds: string[];

  // Pre-calculated flags for common checks
  flags: {
    visitingUSA: boolean;
    visitingSchengen: boolean;
    visitingHighAltitude: boolean;    // > 2500m
    visitingMalariaZone: boolean;
    needsAdapter: boolean;            // Different plug types
    longHaulFlight: boolean;          // > 6 hours
    multipleCountries: boolean;
  };
}

// =============================================================================
// Rule Definition Interface
// =============================================================================

/**
 * Configuration for when a rule should be evaluated
 */
export interface RuleApplicabilityConfig {
  // Destination-based triggers
  countries?: string[];           // ISO codes, rule applies if visiting any
  regions?: string[];             // 'europe', 'asia', etc.
  schengenOnly?: boolean;
  usaOnly?: boolean;

  // Trip characteristics
  internationalOnly?: boolean;
  minDuration?: number;           // Minimum trip days
  minDaysBeforeTrip?: number;     // Only evaluate if trip is X+ days away

  // Traveler requirements
  nationalities?: string[];       // Rule applies for these traveler nationalities

  // Custom predicate for complex logic
  customPredicate?: (ctx: TripVerificationContext) => boolean;
}

/**
 * Base interface for all verification rules
 */
export interface VerificationRule {
  // Identity
  id: string;
  name: string;
  description: string;
  category: TaskCategory;

  // When does this rule apply?
  applicability: RuleApplicabilityConfig;

  // Dependencies on other rules
  dependsOnRules?: string[];

  // Core evaluation logic
  evaluate(ctx: TripVerificationContext): RuleEvaluationResult;

  // Optional: Deadline calculation override
  calculateDeadline?(ctx: TripVerificationContext): {
    suggestedDate: Date;
    daysBeforeTrip: number;
    processingTime: number;
    buffer: number;
  };
}

// =============================================================================
// Rule Registry Types
// =============================================================================

/**
 * Configuration for the rule execution engine
 */
export interface RuleEngineConfig {
  // Evaluation settings
  maxRulesPerEvaluation?: number;
  parallelEvaluation?: boolean;

  // Duplicate handling
  deduplicationStrategy: 'skip' | 'update' | 'version';

  // Task generation
  defaultBufferDays: number;

  // Caching
  cacheDurationMs?: number;
}

/**
 * Result of running all applicable rules
 */
export interface VerificationResult {
  tripId: string;
  evaluatedAt: string;

  // Summary
  totalRulesEvaluated: number;
  applicableRules: number;
  newTasksGenerated: number;
  skippedDuplicates: number;

  // Detailed results
  ruleResults: RuleEvaluationResult[];
  generatedTasks: GeneratedTask[];

  // Issues
  errors?: {
    ruleId: string;
    error: string;
  }[];
}

// =============================================================================
// Persistence Types (for tracking task state changes)
// =============================================================================

/**
 * Tracks the relationship between rules and generated tasks
 */
export interface TaskRuleMapping {
  taskId: string;
  ruleId: string;
  tripId: string;
  generatedAt: string;
  tripVersion: number;        // Trip modification count when task was generated
  isStale: boolean;           // Trip changed after task generation
  wasCompleted: boolean;
  completedAt?: string;
  invalidatedAt?: string;     // When task became irrelevant
  invalidationReason?: string;
}

/**
 * Snapshot of trip state for change detection
 */
export interface TripStateSnapshot {
  tripId: string;
  version: number;
  hash: string;               // Hash of relevant trip data for quick comparison
  destinations: string[];     // Country codes
  startDate: string;
  endDate: string;
  travelerCount: number;
  hasInsurance: boolean;
  capturedAt: string;
}
