/**
 * Notify Bank Rule
 *
 * COMPLEXITY: Simple
 *
 * Banks may block international transactions as fraud prevention.
 * Travelers should notify their bank before international trips.
 *
 * Applicability: Any international trip
 * Check: N/A (always recommend for international travel)
 * Task: Remind to notify bank
 */

import { BaseRule } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  TaskCategory,
} from '../types';

export class NotifyBankRule extends BaseRule {
  id = 'notify-bank';
  name = 'Avisar Banco';
  description = 'Lembra de avisar o banco sobre viagem internacional para evitar bloqueios';
  category: TaskCategory = 'financial';

  applicability: RuleApplicabilityConfig = {
    internationalOnly: true,
    minDaysBeforeTrip: 3,
  };

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    // This is always a recommendation for international travel
    // We can't really check if the user has already notified their bank

    const countries = ctx.destinations.map((d) => d.countryName).join(', ');

    return this.nonCompliantResult([
      this.createTask(ctx, {
        text: 'Avisar banco sobre viagem internacional',
        description:
          `Informe seu banco sobre a viagem para ${countries} para evitar que transações ` +
          `sejam bloqueadas por suspeita de fraude. A maioria dos bancos permite fazer isso ` +
          `pelo aplicativo ou internet banking. Inclua todos os países que visitará e as datas.`,
        priority: 'medium',
        urgency: 'recommended',
        daysBeforeTrip: 7,
        processingTimeDays: 0,
        bufferDays: 3,
        applicableDestinations: ctx.destinations.map((d) => d.name),
      }),
    ]);
  }
}
