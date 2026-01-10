/**
 * Yellow Fever Vaccine Rule
 *
 * COMPLEXITY: Medium
 *
 * Some countries require proof of Yellow Fever vaccination for entry,
 * especially if arriving from or transiting through endemic areas.
 *
 * Applicability: Trips to/through Yellow Fever endemic areas
 * Check: Does each traveler have valid Yellow Fever vaccination?
 * Task: Generate vaccination task if needed
 */

import { BaseRule, YELLOW_FEVER_COUNTRIES } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  GeneratedTask,
  TaskCategory,
} from '../types';

// Countries that REQUIRE yellow fever certificate for entry
const REQUIRES_CERTIFICATE = new Set([
  'ao', 'bf', 'cd', 'cg', 'ga', 'gh', 'gn', 'lr', 'ml', 'ne',
  'rw', 'sl', 'tg',
]);

export class YellowFeverVaccineRule extends BaseRule {
  id = 'yellow-fever-vaccine';
  name = 'Vacina Febre Amarela';
  description =
    'Verifica se viajantes possuem vacinação contra febre amarela para países que exigem';
  category: TaskCategory = 'health';

  applicability: RuleApplicabilityConfig = {
    internationalOnly: true,
    minDaysBeforeTrip: 14, // Vaccine needs 10 days to be effective

    customPredicate: (ctx) => {
      // Check if visiting any yellow fever country
      return ctx.countryCodes.some(
        (c) =>
          YELLOW_FEVER_COUNTRIES.has(c.toLowerCase()) ||
          REQUIRES_CERTIFICATE.has(c.toLowerCase())
      );
    },
  };

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    const tasks: GeneratedTask[] = [];

    // Get yellow fever destinations
    const yfDestinations = ctx.destinations.filter(
      (d) =>
        YELLOW_FEVER_COUNTRIES.has(d.countryCode.toLowerCase()) ||
        REQUIRES_CERTIFICATE.has(d.countryCode.toLowerCase())
    );

    const requiresCertificate = yfDestinations.some((d) =>
      REQUIRES_CERTIFICATE.has(d.countryCode.toLowerCase())
    );

    // Check each traveler
    for (const traveler of ctx.travelers) {
      const yfVaccine = traveler.vaccinations?.find(
        (v) => v.type.toLowerCase().includes('febre amarela') ||
               v.type.toLowerCase().includes('yellow fever')
      );

      if (!yfVaccine) {
        tasks.push(
          this.createTask(ctx, {
            text: `Vacinar ${traveler.name || 'viajante'} contra febre amarela`,
            description:
              `A viagem inclui países com risco de febre amarela ou que exigem certificado. ` +
              `A vacina deve ser tomada pelo menos 10 dias antes da viagem para ter efeito. ` +
              `O Certificado Internacional de Vacinação (CIVP) é emitido pela Anvisa.`,
            priority: requiresCertificate ? 'critical' : 'high',
            urgency: requiresCertificate ? 'blocking' : 'important',
            daysBeforeTrip: 21,
            processingTimeDays: 10, // 10 days for vaccine to be effective
            bufferDays: 7,
            helpUrl: 'https://www.gov.br/anvisa/pt-br/assuntos/paf/certificado-internacional-de-vacinacao',
            estimatedCost: 'Gratuito no SUS',
            applicableDestinations: yfDestinations.map((d) => d.name),
          })
        );
      }
    }

    if (tasks.length === 0) {
      return this.compliantResult({
        yellowFeverDestinations: yfDestinations.map((d) => d.name),
        allTravelersVaccinated: true,
      });
    }

    return this.nonCompliantResult(tasks);
  }
}
