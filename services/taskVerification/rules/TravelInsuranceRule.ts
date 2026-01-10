/**
 * Travel Insurance Rule
 *
 * COMPLEXITY: Simple
 *
 * This is a basic rule that checks if any international trip has travel insurance.
 * It demonstrates the simplest form of a verification rule.
 *
 * Applicability: Any international trip
 * Check: Does the trip have valid insurance covering the trip dates?
 * Task: If no insurance, generate task to purchase one
 */

import { BaseRule } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  TaskCategory,
} from '../types';

export class TravelInsuranceRule extends BaseRule {
  // ==========================================================================
  // Rule Identity
  // ==========================================================================

  id = 'travel-insurance';
  name = 'Seguro Viagem';
  description = 'Verifica se existe seguro viagem válido para viagens internacionais';
  category: TaskCategory = 'health';

  // ==========================================================================
  // Applicability Configuration
  // ==========================================================================

  applicability: RuleApplicabilityConfig = {
    internationalOnly: true,
    minDaysBeforeTrip: 3, // No point generating this task if trip is very soon
  };

  // ==========================================================================
  // Evaluation Logic
  // ==========================================================================

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    // Check 1: Is there any insurance associated with the trip?
    if (!ctx.insurance) {
      return this.generateInsuranceTask(ctx, 'missing');
    }

    // Check 2: Does the insurance cover the full trip duration?
    const insuranceStart = new Date(ctx.insurance.startDate);
    const insuranceEnd = new Date(ctx.insurance.endDate);

    const coversTripStart = insuranceStart <= ctx.startDate;
    const coversTripEnd = insuranceEnd >= ctx.endDate;

    if (!coversTripStart || !coversTripEnd) {
      return this.generateInsuranceTask(ctx, 'insufficient_coverage', {
        insuranceStart: ctx.insurance.startDate,
        insuranceEnd: ctx.insurance.endDate,
        tripStart: ctx.trip.startDate,
        tripEnd: ctx.trip.endDate,
      });
    }

    // All checks passed - trip has valid insurance
    return this.compliantResult({
      provider: ctx.insurance.provider,
      policyNumber: ctx.insurance.policyNumber,
      coverageValidated: true,
    });
  }

  // ==========================================================================
  // Task Generation
  // ==========================================================================

  private generateInsuranceTask(
    ctx: TripVerificationContext,
    reason: 'missing' | 'insufficient_coverage',
    details?: Record<string, string>
  ): RuleEvaluationResult {
    const countries = ctx.destinations.map(d => d.countryName).join(', ');

    const description = reason === 'missing'
      ? `Sua viagem para ${countries} não possui seguro viagem cadastrado. ` +
        `O seguro viagem cobre despesas médicas, cancelamentos e imprevistos no exterior.`
      : `O seguro viagem atual não cobre todo o período da viagem. ` +
        `Período da viagem: ${details?.tripStart} a ${details?.tripEnd}. ` +
        `Cobertura do seguro: ${details?.insuranceStart} a ${details?.insuranceEnd}.`;

    const task = this.createTask(ctx, {
      text: reason === 'missing'
        ? 'Contratar seguro viagem'
        : 'Ajustar cobertura do seguro viagem',
      description,
      priority: 'high',
      urgency: 'important',
      daysBeforeTrip: 14,       // Ideally done 2 weeks before
      processingTimeDays: 1,    // Online purchase is immediate
      bufferDays: 7,            // Some buffer for research/comparison
      helpUrl: 'https://www.seguroviagem.srv.br/comparar',
      estimatedCost: 'R$ 150 - R$ 500 dependendo da cobertura',
      applicableDestinations: ctx.destinations.map(d => d.name),
    });

    return this.nonCompliantResult([task], {
      reason,
      ...details,
    });
  }
}
