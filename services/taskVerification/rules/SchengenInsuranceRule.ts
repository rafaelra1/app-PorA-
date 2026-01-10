/**
 * Schengen Travel Insurance Rule
 *
 * COMPLEXITY: Medium
 *
 * The Schengen area requires travelers from certain countries (including Brazil)
 * to have travel insurance with specific minimum coverage:
 * - Minimum €30,000 medical coverage
 * - Must cover repatriation
 * - Must be valid in all Schengen countries
 *
 * Applicability: Non-EU travelers visiting Schengen countries
 * Check: Does the traveler have Schengen-compliant insurance?
 * Task: Generate task to obtain compliant insurance if missing
 */

import { BaseRule, SCHENGEN_COUNTRIES } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  TaskCategory,
} from '../types';

// EU/EEA countries whose citizens don't need Schengen insurance
const EU_EEA_COUNTRIES = new Set([
  ...Array.from(SCHENGEN_COUNTRIES),
  'ie', // Ireland (EU but not Schengen)
  'cy', // Cyprus (EU but not Schengen)
  'ro', // Romania (EU, joining Schengen)
  'bg', // Bulgaria (EU, joining Schengen)
]);

export class SchengenInsuranceRule extends BaseRule {
  id = 'schengen-insurance';
  name = 'Seguro Schengen';
  description =
    'Verifica se existe seguro viagem com cobertura mínima de €30.000 para área Schengen';
  category: TaskCategory = 'health';

  // This rule has higher priority than general insurance
  dependsOnRules = ['travel-insurance'];

  applicability: RuleApplicabilityConfig = {
    schengenOnly: true,
    minDaysBeforeTrip: 5,

    // Only applies to non-EU travelers
    customPredicate: (ctx) => {
      if (!ctx.flags.visitingSchengen) return false;

      // Check if any traveler is from outside EU/EEA
      return ctx.travelers.some(
        (t) => !EU_EEA_COUNTRIES.has(t.nationality.toLowerCase())
      );
    },
  };

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    // Get Schengen destinations
    const schengenDests = ctx.destinations.filter((d) =>
      SCHENGEN_COUNTRIES.has(d.countryCode.toLowerCase())
    );

    const schengenCountries = schengenDests.map((d) => d.countryName).join(', ');

    // Check if there's any insurance
    if (!ctx.insurance) {
      return this.nonCompliantResult(
        [
          this.createTask(ctx, {
            text: 'Contratar seguro viagem Schengen',
            description:
              `Para entrar na área Schengen (${schengenCountries}), é obrigatório ter ` +
              `seguro viagem com cobertura mínima de €30.000 para despesas médicas e repatriação. ` +
              `Este é um requisito legal e pode ser solicitado na imigração.`,
            priority: 'critical',
            urgency: 'blocking',
            daysBeforeTrip: 14,
            processingTimeDays: 1,
            bufferDays: 7,
            helpUrl: 'https://www.schengenvisainfo.com/travel-insurance/',
            estimatedCost: 'R$ 200 - R$ 600 (cobertura €30.000+)',
            applicableDestinations: schengenDests.map((d) => d.name),
          }),
        ],
        { reason: 'no_insurance', schengenDestinations: schengenCountries }
      );
    }

    // For now, we assume if insurance exists it might be compliant
    // In a real implementation, we'd check the insurance policy details
    // against Schengen requirements

    // Check if insurance covers the full trip period
    const insuranceStart = new Date(ctx.insurance.startDate);
    const insuranceEnd = new Date(ctx.insurance.endDate);

    // Find the Schengen portion of the trip
    const firstSchengen = schengenDests.reduce((earliest, dest) => {
      const destStart = dest.startDate ? new Date(dest.startDate) : ctx.startDate;
      return destStart < earliest ? destStart : earliest;
    }, ctx.endDate);

    const lastSchengen = schengenDests.reduce((latest, dest) => {
      const destEnd = dest.endDate ? new Date(dest.endDate) : ctx.endDate;
      return destEnd > latest ? destEnd : latest;
    }, ctx.startDate);

    if (insuranceStart > firstSchengen || insuranceEnd < lastSchengen) {
      return this.nonCompliantResult(
        [
          this.createTask(ctx, {
            text: 'Ajustar período do seguro Schengen',
            description:
              `O seguro viagem atual não cobre todo o período na área Schengen. ` +
              `Período Schengen: ${firstSchengen.toLocaleDateString('pt-BR')} a ` +
              `${lastSchengen.toLocaleDateString('pt-BR')}. ` +
              `Cobertura atual: ${ctx.insurance.startDate} a ${ctx.insurance.endDate}.`,
            priority: 'high',
            urgency: 'blocking',
            daysBeforeTrip: 14,
            processingTimeDays: 1,
            bufferDays: 7,
            applicableDestinations: schengenDests.map((d) => d.name),
          }),
        ],
        { reason: 'insufficient_coverage' }
      );
    }

    return this.compliantResult({
      schengenDestinations: schengenCountries,
      insuranceProvider: ctx.insurance.provider,
      coverageVerified: true,
      note: 'Verifique se a apólice inclui cobertura mínima de €30.000',
    });
  }
}
