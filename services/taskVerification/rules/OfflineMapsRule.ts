/**
 * Offline Maps Rule
 *
 * COMPLEXITY: Simple
 *
 * Downloading offline maps before travel ensures navigation even without
 * data connection. Especially important for areas with poor connectivity.
 *
 * Applicability: Any international trip
 * Check: N/A (always recommend)
 * Task: Remind to download offline maps
 */

import { BaseRule } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  TaskCategory,
} from '../types';

export class OfflineMapsRule extends BaseRule {
  id = 'offline-maps';
  name = 'Mapas Offline';
  description = 'Lembra de baixar mapas offline dos destinos para navegação sem internet';
  category: TaskCategory = 'connectivity';

  applicability: RuleApplicabilityConfig = {
    internationalOnly: true,
    minDaysBeforeTrip: 1,
  };

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    const cities = ctx.destinations.map((d) => d.name).join(', ');

    return this.nonCompliantResult([
      this.createTask(ctx, {
        text: 'Baixar mapas offline dos destinos',
        description:
          `Baixe os mapas de ${cities} no Google Maps ou Maps.me para usar mesmo sem conexão. ` +
          `No Google Maps: toque no seu perfil > Mapas offline > Selecionar mapa próprio. ` +
          `Mapas offline são essenciais para navegação em áreas sem cobertura de dados.`,
        priority: 'low',
        urgency: 'recommended',
        daysBeforeTrip: 3,
        processingTimeDays: 0,
        bufferDays: 1,
        helpUrl: 'https://support.google.com/maps/answer/6291838',
        applicableDestinations: ctx.destinations.map((d) => d.name),
      }),
    ]);
  }
}
