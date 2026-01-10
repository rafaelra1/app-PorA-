/**
 * High Altitude Medication Rule
 *
 * COMPLEXITY: Simple
 *
 * Destinations above 2500m can cause altitude sickness.
 * Travelers should consider preventive medication (Diamox/Acetazolamide).
 *
 * Applicability: Trips to high altitude destinations
 * Check: Is traveler aware of altitude risks?
 * Task: Recommend medical consultation
 */

import { BaseRule, HIGH_ALTITUDE_DESTINATIONS } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  TaskCategory,
} from '../types';

export class HighAltitudeMedicationRule extends BaseRule {
  id = 'high-altitude-medication';
  name = 'Medicação para Altitude';
  description =
    'Recomenda consulta médica e medicação preventiva para destinos em alta altitude';
  category: TaskCategory = 'health';

  applicability: RuleApplicabilityConfig = {
    minDaysBeforeTrip: 7,
    customPredicate: (ctx) => ctx.flags.visitingHighAltitude,
  };

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    // Find high altitude destinations
    const highAltDests = ctx.destinations.filter((d) => {
      const cityName = d.name.toLowerCase();
      return HIGH_ALTITUDE_DESTINATIONS[cityName] !== undefined;
    });

    if (highAltDests.length === 0) {
      return this.compliantResult();
    }

    const destinations = highAltDests
      .map((d) => `${d.name} (${HIGH_ALTITUDE_DESTINATIONS[d.name.toLowerCase()]}m)`)
      .join(', ');

    return this.nonCompliantResult([
      this.createTask(ctx, {
        text: 'Consultar médico sobre altitude elevada',
        description:
          `Sua viagem inclui destinos em altitude elevada: ${destinations}. ` +
          `Altitudes acima de 2.500m podem causar mal da altitude (soroche). ` +
          `Consulte um médico sobre medicação preventiva como Acetazolamida (Diamox). ` +
          `Sintomas incluem dor de cabeça, náusea, falta de ar e fadiga.`,
        priority: 'medium',
        urgency: 'recommended',
        daysBeforeTrip: 14,
        processingTimeDays: 7, // Time for medical consultation
        bufferDays: 7,
        helpUrl: 'https://www.cdc.gov/altitude-sickness/',
        estimatedCost: 'R$ 150 - R$ 300 (consulta + medicação)',
        applicableDestinations: highAltDests.map((d) => d.name),
      }),
    ]);
  }
}
