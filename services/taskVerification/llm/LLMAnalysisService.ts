/**
 * LLM Analysis Service
 *
 * Service for AI-powered contextual trip analysis.
 * Complements the deterministic rule-based verification system.
 *
 * Key Features:
 * - Smart caching to minimize API costs
 * - Trigger-based execution (manual, major changes, periodic)
 * - Response validation and hallucination detection
 * - Integration with existing GeminiService patterns
 */

import { Trip, Transport, Insurance, TaskItem, ItineraryActivity } from '../../../types';
import { TripVerificationContext } from '../types';
import { buildVerificationContext } from '../VerificationEngine';
import {
  LLMAnalysisResult,
  LLMInsight,
  LLMSuggestedTask,
  SerializedTripForLLM,
  AnalysisTrigger,
  LLMAnalysisConfig,
  LLMAnalysisCacheEntry,
  TripChangeSignature,
  ValidationResult,
  DEFAULT_LLM_CONFIG,
  ConfidenceLevel,
} from './types';
import { buildAnalysisPrompt, buildValidationPrompt, PROMPT_VERSION } from './prompts';
import { parseDisplayDate } from '../../../lib/dateUtils';

// =============================================================================
// Constants
// =============================================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Approximate token costs for Gemini 2.5 Flash (USD per 1M tokens)
const TOKEN_COSTS = {
  input: 0.075,   // $0.075 per 1M input tokens
  output: 0.30,   // $0.30 per 1M output tokens
  cached: 0.01875, // 75% discount for cached
};

// =============================================================================
// LLM Analysis Service
// =============================================================================

export class LLMAnalysisService {
  private apiKey: string;
  private config: LLMAnalysisConfig;
  private cache: Map<string, LLMAnalysisCacheEntry> = new Map();
  private changeSignatures: Map<string, TripChangeSignature> = new Map();

  constructor(apiKey: string, config: Partial<LLMAnalysisConfig> = {}) {
    this.apiKey = apiKey;
    this.config = { ...DEFAULT_LLM_CONFIG, ...config };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Analyze a trip using LLM
   * Main entry point for contextual analysis
   */
  async analyzeTrip(
    trip: Trip,
    options: {
      trigger: AnalysisTrigger;
      transports?: Transport[];
      insurance?: Insurance;
      existingTasks?: TaskItem[];
      activities?: ItineraryActivity[];
      forceRefresh?: boolean;
    }
  ): Promise<LLMAnalysisResult> {
    const startTime = Date.now();

    // Check if we should even run analysis
    const shouldAnalyze = this.shouldRunAnalysis(trip, options.trigger, options.forceRefresh);
    if (!shouldAnalyze.run) {
      // Return cached result if available
      const cached = this.getCachedResult(trip.id);
      if (cached) {
        return cached.result;
      }
      // Return empty result if no cache and shouldn't analyze
      return this.createEmptyResult(trip.id, options.trigger, shouldAnalyze.reason);
    }

    // Build serialized trip data
    const serializedTrip = this.serializeTripForLLM(trip, options);

    // Build prompt
    const { fullPrompt } = buildAnalysisPrompt(serializedTrip);

    try {
      // Call Gemini API
      const rawResponse = await this.callGeminiAPI(fullPrompt);

      // Parse response
      const parsed = this.parseResponse(rawResponse);

      // Validate response if enabled
      let validatedInsights = parsed.insights;
      let validatedTasks = parsed.suggestedTasks;

      if (this.config.enableHallucinationDetection) {
        const validation = await this.validateResponse(serializedTrip, parsed);
        if (!validation.isValid) {
          // Filter out invalid suggestions
          validatedInsights = this.filterByValidation(parsed.insights, validation);
          validatedTasks = this.filterByValidation(parsed.suggestedTasks, validation);
        }
      }

      // Calculate token usage and cost
      const tokenUsage = this.estimateTokenUsage(fullPrompt, rawResponse);

      // Build result
      const result: LLMAnalysisResult = {
        tripId: trip.id,
        analyzedAt: new Date().toISOString(),
        trigger: options.trigger,
        processingTimeMs: Date.now() - startTime,
        tokenUsage,
        insights: validatedInsights,
        suggestedTasks: validatedTasks.map(task => ({
          ...task,
          source: 'llm_analysis' as const,
          validationStatus: 'pending' as const,
          requiresUserValidation: this.config.requireValidation,
          llmModel: this.config.model,
          generatedAt: new Date().toISOString(),
          promptVersion: PROMPT_VERSION,
        })),
        summary: parsed.summary,
        rawResponse: process.env.NODE_ENV === 'development' ? rawResponse : undefined,
      };

      // Cache result
      this.cacheResult(trip.id, this.computeTripHash(trip), result);

      // Update change signature
      this.updateChangeSignature(trip.id, this.computeChangeSignature(trip, options));

      return result;

    } catch (error) {
      console.error('LLM Analysis failed:', error);
      return this.createErrorResult(trip.id, options.trigger, error);
    }
  }

  /**
   * Check if analysis should run based on triggers
   */
  shouldRunAnalysis(
    trip: Trip,
    trigger: AnalysisTrigger,
    forceRefresh?: boolean
  ): { run: boolean; reason?: string } {
    // Force refresh always runs
    if (forceRefresh) {
      return { run: true };
    }

    // Manual trigger always runs
    if (trigger === 'manual') {
      return { run: true };
    }

    // Check cache freshness
    const cached = this.getCachedResult(trip.id);
    if (cached) {
      const ageHours = (Date.now() - cached.cachedAt) / (1000 * 60 * 60);
      if (ageHours < this.config.cacheExpirationHours) {
        // Check if trip has changed significantly
        const currentHash = this.computeTripHash(trip);
        if (currentHash === cached.tripHash) {
          return { run: false, reason: 'cached_result_valid' };
        }
      }
    }

    // Check trigger-specific conditions
    switch (trigger) {
      case 'new_trip':
        return { run: true };

      case 'major_change':
        return this.detectMajorChange(trip);

      case 'approaching_trip':
        const daysUntil = this.calculateDaysUntilTrip(trip);
        if (daysUntil <= this.config.autoTriggerDaysBeforeTrip && daysUntil > 0) {
          return { run: true };
        }
        return { run: false, reason: 'trip_not_approaching' };

      case 'periodic':
        // Only run if no recent analysis
        if (!cached) return { run: true };
        const hoursSinceLast = (Date.now() - cached.cachedAt) / (1000 * 60 * 60);
        return {
          run: hoursSinceLast >= this.config.cacheExpirationHours,
          reason: 'periodic_check',
        };

      default:
        return { run: false, reason: 'unknown_trigger' };
    }
  }

  /**
   * Get cached analysis result
   */
  getCachedResult(tripId: string): LLMAnalysisCacheEntry | null {
    const entry = this.cache.get(tripId);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(tripId);
      return null;
    }

    return entry;
  }

  /**
   * Clear cache for a trip
   */
  clearCache(tripId: string): void {
    this.cache.delete(tripId);
    this.changeSignatures.delete(tripId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.changeSignatures.clear();
  }

  // ===========================================================================
  // Private Methods - API Interaction
  // ===========================================================================

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${GEMINI_API_URL}?key=${this.apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Empty response from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Parse LLM response
   */
  private parseResponse(rawResponse: string): {
    summary: LLMAnalysisResult['summary'];
    insights: LLMInsight[];
    suggestedTasks: Omit<LLMSuggestedTask, 'source' | 'validationStatus' | 'requiresUserValidation' | 'llmModel' | 'generatedAt' | 'promptVersion'>[];
  } {
    try {
      // Clean markdown if present
      const cleanText = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanText);

      return {
        summary: parsed.summary || this.defaultSummary(),
        insights: (parsed.insights || []).slice(0, this.config.maxInsights),
        suggestedTasks: (parsed.suggestedTasks || []).slice(0, this.config.maxSuggestedTasks),
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return {
        summary: this.defaultSummary(),
        insights: [],
        suggestedTasks: [],
      };
    }
  }

  /**
   * Validate LLM response for hallucinations
   */
  private async validateResponse(
    trip: SerializedTripForLLM,
    response: { insights: LLMInsight[]; suggestedTasks: unknown[] }
  ): Promise<ValidationResult> {
    // Quick local validation first
    const issues: ValidationResult['issues'] = [];

    // Check date ranges
    const tripStart = trip.destinations[0]?.arrivalDate;
    const tripEnd = trip.destinations[trip.destinations.length - 1]?.departureDate;

    for (const insight of response.insights) {
      if (insight.affectedDates) {
        for (const date of insight.affectedDates) {
          if (date < tripStart || date > tripEnd) {
            issues.push({
              type: 'hallucination',
              description: `Date ${date} is outside trip period`,
              severity: 'warning',
              field: 'affectedDates',
            });
          }
        }
      }

      // Check destinations
      const tripDestinations = trip.destinations.map(d => d.name.toLowerCase());
      if (insight.affectedDestinations) {
        for (const dest of insight.affectedDestinations) {
          if (!tripDestinations.includes(dest.toLowerCase())) {
            issues.push({
              type: 'hallucination',
              description: `Destination "${dest}" not in trip`,
              severity: 'warning',
              field: 'affectedDestinations',
            });
          }
        }
      }
    }

    // Calculate confidence
    const blockingIssues = issues.filter(i => i.severity === 'blocking').length;
    const warningIssues = issues.filter(i => i.severity === 'warning').length;
    const confidence = Math.max(0, 1 - (blockingIssues * 0.3) - (warningIssues * 0.1));

    return {
      isValid: blockingIssues === 0,
      confidence,
      issues,
    };
  }

  /**
   * Filter insights/tasks by validation results
   */
  private filterByValidation<T extends { confidence?: ConfidenceLevel }>(
    items: T[],
    validation: ValidationResult
  ): T[] {
    if (validation.confidence > 0.7) {
      return items; // High confidence, keep all
    }

    // Lower confidence on all items
    return items.map(item => ({
      ...item,
      confidence: 'low' as ConfidenceLevel,
    }));
  }

  // ===========================================================================
  // Private Methods - Serialization
  // ===========================================================================

  /**
   * Serialize trip data for LLM comprehension
   */
  private serializeTripForLLM(
    trip: Trip,
    options: {
      transports?: Transport[];
      insurance?: Insurance;
      existingTasks?: TaskItem[];
      activities?: ItineraryActivity[];
    }
  ): SerializedTripForLLM {
    const startDate = this.parseDate(trip.startDate);
    const endDate = this.parseDate(trip.endDate);
    const today = new Date();
    const daysUntilDeparture = Math.ceil(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Extract traveler info from participants
    const nationalities = new Set<string>();
    let hasChildren = false;
    let hasElderly = false;

    // Default to Brazilian traveler if no participants
    nationalities.add('BR');

    return {
      tripId: trip.id,
      title: trip.title,
      totalDays,
      daysUntilDeparture,

      travelers: {
        count: trip.participants.length || 1,
        nationalities: Array.from(nationalities),
        hasChildren,
        hasElderly,
      },

      destinations: (trip.detailedDestinations || []).map(dest => ({
        name: dest.name,
        country: dest.country || '',
        countryCode: this.getCountryCode(dest.country || ''),
        arrivalDate: dest.startDate || trip.startDate,
        departureDate: dest.endDate || trip.endDate,
        nights: this.calculateNights(dest.startDate, dest.endDate),
      })),

      bookings: {
        flights: (options.transports || [])
          .filter(t => t.type === 'flight')
          .map(t => ({
            from: t.departureLocation,
            to: t.arrivalLocation,
            date: t.departureDate,
            time: t.departureTime,
            airline: t.operator,
            duration: t.duration,
          })),

        hotels: [], // Would come from accommodation context

        activities: (options.activities || []).map(a => ({
          name: a.title,
          city: a.location || '',
          date: a.date,
          time: a.time,
          duration: a.duration ? `${a.duration} min` : undefined,
          isBooked: false, // Would need booking status
        })),
      },

      existingTasks: (options.existingTasks || []).map(t => ({
        text: t.text,
        completed: t.completed,
        category: t.category || 'other',
      })),
    };
  }

  // ===========================================================================
  // Private Methods - Caching & Change Detection
  // ===========================================================================

  /**
   * Cache analysis result
   */
  private cacheResult(
    tripId: string,
    tripHash: string,
    result: LLMAnalysisResult
  ): void {
    if (!this.config.enableCaching) return;

    const entry: LLMAnalysisCacheEntry = {
      tripId,
      tripHash,
      result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (this.config.cacheExpirationHours * 60 * 60 * 1000),
      promptVersion: PROMPT_VERSION,
    };

    this.cache.set(tripId, entry);
  }

  /**
   * Compute hash of trip data for change detection
   */
  private computeTripHash(trip: Trip): string {
    const significant = {
      destinations: trip.detailedDestinations?.map(d => d.country),
      startDate: trip.startDate,
      endDate: trip.endDate,
      participants: trip.participants.length,
    };
    return this.simpleHash(JSON.stringify(significant));
  }

  /**
   * Compute change signature for detailed comparison
   */
  private computeChangeSignature(
    trip: Trip,
    options: { transports?: Transport[]; existingTasks?: TaskItem[] }
  ): TripChangeSignature {
    return {
      destinationHash: this.simpleHash(
        JSON.stringify(trip.detailedDestinations?.map(d => d.country))
      ),
      dateRange: `${trip.startDate}-${trip.endDate}`,
      travelerCount: trip.participants.length || 1,
      bookingCount: (options.transports || []).length,
      taskCount: (options.existingTasks || []).length,
    };
  }

  /**
   * Detect if trip has changed significantly
   */
  private detectMajorChange(trip: Trip): { run: boolean; reason?: string } {
    const previousSig = this.changeSignatures.get(trip.id);
    if (!previousSig) {
      return { run: true, reason: 'no_previous_signature' };
    }

    const currentSig = this.computeChangeSignature(trip, {});
    const threshold = this.config.majorChangeThreshold;

    // Check destinations
    if (threshold.destinationsChanged && previousSig.destinationHash !== currentSig.destinationHash) {
      return { run: true, reason: 'destinations_changed' };
    }

    // Check dates
    if (threshold.datesChanged && previousSig.dateRange !== currentSig.dateRange) {
      return { run: true, reason: 'dates_changed' };
    }

    return { run: false, reason: 'no_major_changes' };
  }

  /**
   * Update stored change signature
   */
  private updateChangeSignature(tripId: string, signature: TripChangeSignature): void {
    this.changeSignatures.set(tripId, signature);
  }

  // ===========================================================================
  // Private Methods - Utilities
  // ===========================================================================

  /**
   * Estimate token usage and cost
   */
  private estimateTokenUsage(input: string, output: string): LLMAnalysisResult['tokenUsage'] {
    // Rough estimation: ~4 chars per token for English/Portuguese
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);

    const inputCost = (inputTokens / 1_000_000) * TOKEN_COSTS.input;
    const outputCost = (outputTokens / 1_000_000) * TOKEN_COSTS.output;

    return {
      inputTokens,
      outputTokens,
      estimatedCostUSD: Number((inputCost + outputCost).toFixed(6)),
    };
  }

  /**
   * Simple string hash
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string): Date {
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    return new Date(dateStr);
  }

  /**
   * Calculate days until trip
   */
  private calculateDaysUntilTrip(trip: Trip): number {
    const startDate = this.parseDate(trip.startDate);
    const today = new Date();
    return Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate nights between dates
   */
  private calculateNights(start?: string, end?: string): number {
    if (!start || !end) return 0;
    const startDate = this.parseDate(start);
    const endDate = this.parseDate(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get country code from name
   */
  private getCountryCode(country: string): string {
    const codes: Record<string, string> = {
      'estados unidos': 'US', 'eua': 'US', 'usa': 'US',
      'brasil': 'BR', 'brazil': 'BR',
      'japão': 'JP', 'japan': 'JP',
      'frança': 'FR', 'france': 'FR',
      'alemanha': 'DE', 'germany': 'DE',
      'itália': 'IT', 'italy': 'IT',
      'espanha': 'ES', 'spain': 'ES',
      'portugal': 'PT',
      'reino unido': 'GB', 'uk': 'GB', 'england': 'GB',
      // Add more as needed
    };
    return codes[country.toLowerCase()] || country.slice(0, 2).toUpperCase();
  }

  /**
   * Default summary for empty/error results
   */
  private defaultSummary(): LLMAnalysisResult['summary'] {
    return {
      overallAssessment: 'good',
      keyHighlights: [],
      criticalIssues: 0,
      warnings: 0,
      tips: 0,
    };
  }

  /**
   * Create empty result
   */
  private createEmptyResult(
    tripId: string,
    trigger: AnalysisTrigger,
    reason?: string
  ): LLMAnalysisResult {
    return {
      tripId,
      analyzedAt: new Date().toISOString(),
      trigger,
      processingTimeMs: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0 },
      insights: [],
      suggestedTasks: [],
      summary: {
        ...this.defaultSummary(),
        keyHighlights: reason ? [`Análise não executada: ${reason}`] : [],
      },
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(
    tripId: string,
    trigger: AnalysisTrigger,
    error: unknown
  ): LLMAnalysisResult {
    return {
      tripId,
      analyzedAt: new Date().toISOString(),
      trigger,
      processingTimeMs: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0 },
      insights: [{
        id: 'error-insight',
        category: 'preparation',
        title: 'Análise indisponível',
        description: 'Não foi possível completar a análise contextual',
        confidence: 'low',
        severity: 'info',
        reasoning: error instanceof Error ? error.message : 'Erro desconhecido',
      }],
      suggestedTasks: [],
      summary: this.defaultSummary(),
    };
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

let llmAnalysisServiceInstance: LLMAnalysisService | null = null;

/**
 * Get singleton instance of LLMAnalysisService
 */
export const getLLMAnalysisService = (): LLMAnalysisService => {
  if (!llmAnalysisServiceInstance) {
    let apiKey = '';

    // Check Vite environment variable
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
      apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      console.warn('Gemini API Key not configured for LLM Analysis Service');
    }

    llmAnalysisServiceInstance = new LLMAnalysisService(apiKey);
  }
  return llmAnalysisServiceInstance;
};

/**
 * Reset singleton (for testing)
 */
export const resetLLMAnalysisService = (): void => {
  llmAnalysisServiceInstance = null;
};
