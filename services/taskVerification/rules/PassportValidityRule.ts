/**
 * Passport Validity Rule
 *
 * COMPLEXITY: Medium
 *
 * Most countries require passports to be valid for at least 6 months
 * beyond the travel dates. This rule checks each traveler's passport.
 *
 * Applicability: Any international trip
 * Check: Is each traveler's passport valid for 6+ months after trip end?
 * Task: Generate renewal task if passport expires too soon
 */

import { BaseRule } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  GeneratedTask,
  TaskCategory,
  TravelerInfo,
} from '../types';

// Countries with different validity requirements
const EXACT_VALIDITY_COUNTRIES = new Set(['us', 'ca', 'mx', 'gb']);
// These countries only require passport valid through travel dates

const THREE_MONTH_VALIDITY_COUNTRIES = new Set(['br', 'ar', 'cl', 'za']);
// These require 3 months beyond travel

export class PassportValidityRule extends BaseRule {
  id = 'passport-validity';
  name = 'Validade do Passaporte';
  description = 'Verifica se o passaporte é válido por pelo menos 6 meses após a viagem';
  category: TaskCategory = 'documentation';

  applicability: RuleApplicabilityConfig = {
    internationalOnly: true,
    minDaysBeforeTrip: 7, // Need time to renew
  };

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    const tasks: GeneratedTask[] = [];
    const evaluationDetails: Record<string, unknown> = {
      travelersEvaluated: [],
    };

    // Determine minimum validity period needed based on destinations
    const requiredMonths = this.getRequiredValidityMonths(ctx);
    const requiredDate = new Date(ctx.endDate);
    requiredDate.setMonth(requiredDate.getMonth() + requiredMonths);

    for (const traveler of ctx.travelers) {
      const result = this.evaluateTravelerPassport(
        ctx,
        traveler,
        requiredDate,
        requiredMonths
      );

      (evaluationDetails.travelersEvaluated as unknown[]).push(result.details);

      if (result.task) {
        tasks.push(result.task);
      }
    }

    if (tasks.length === 0) {
      return this.compliantResult({
        ...evaluationDetails,
        requiredValidityMonths: requiredMonths,
        requiredValidUntil: requiredDate.toISOString().split('T')[0],
      });
    }

    return this.nonCompliantResult(tasks, evaluationDetails);
  }

  private getRequiredValidityMonths(ctx: TripVerificationContext): number {
    // Check if any destination has relaxed requirements
    const hasExactValidityCountry = ctx.countryCodes.some((c) =>
      EXACT_VALIDITY_COUNTRIES.has(c.toLowerCase())
    );

    const hasThreeMonthCountry = ctx.countryCodes.some((c) =>
      THREE_MONTH_VALIDITY_COUNTRIES.has(c.toLowerCase())
    );

    // Use the most restrictive requirement
    // Default is 6 months (Schengen and most of the world)
    if (ctx.flags.visitingSchengen) {
      return 6;
    }

    if (hasExactValidityCountry && !ctx.flags.visitingSchengen) {
      return 0; // Just need to be valid through trip
    }

    if (hasThreeMonthCountry) {
      return 3;
    }

    return 6; // Default: 6 months
  }

  private evaluateTravelerPassport(
    ctx: TripVerificationContext,
    traveler: TravelerInfo,
    requiredDate: Date,
    requiredMonths: number
  ): { task: GeneratedTask | null; details: Record<string, unknown> } {
    const details: Record<string, unknown> = {
      name: traveler.name,
      passportExpiry: traveler.passportExpiry,
      requiredUntil: requiredDate.toISOString().split('T')[0],
    };

    // Check if passport info is available
    if (!traveler.passportExpiry) {
      details.status = 'passport_expiry_unknown';
      return {
        task: this.createTask(ctx, {
          text: `Verificar validade do passaporte de ${traveler.name || 'viajante'}`,
          description:
            `Não há informação sobre a validade do passaporte de ${traveler.name || 'viajante'}. ` +
            `A maioria dos países exige passaporte válido por pelo menos ${requiredMonths} meses ` +
            `após a data de retorno da viagem.`,
          priority: 'high',
          urgency: 'important',
          daysBeforeTrip: 90,
          processingTimeDays: 0,
          bufferDays: 14,
        }),
        details,
      };
    }

    const passportExpiry = new Date(traveler.passportExpiry);

    // Check if passport is already expired
    if (passportExpiry < new Date()) {
      details.status = 'passport_expired';
      return {
        task: this.createPassportRenewalTask(ctx, traveler, 'expired'),
        details,
      };
    }

    // Check if passport meets validity requirement
    if (passportExpiry < requiredDate) {
      const daysShort = Math.ceil(
        (requiredDate.getTime() - passportExpiry.getTime()) / (1000 * 60 * 60 * 24)
      );
      details.status = 'passport_insufficient_validity';
      details.daysShort = daysShort;

      return {
        task: this.createPassportRenewalTask(ctx, traveler, 'insufficient', {
          daysShort: String(daysShort),
          currentExpiry: traveler.passportExpiry,
        }),
        details,
      };
    }

    // Passport is valid
    details.status = 'passport_valid';
    return { task: null, details };
  }

  private createPassportRenewalTask(
    ctx: TripVerificationContext,
    traveler: TravelerInfo,
    reason: 'expired' | 'insufficient',
    details?: Record<string, string>
  ): GeneratedTask {
    const isExpired = reason === 'expired';

    return this.createTask(ctx, {
      text: isExpired
        ? `Renovar passaporte vencido de ${traveler.name || 'viajante'}`
        : `Renovar passaporte de ${traveler.name || 'viajante'}`,
      description: isExpired
        ? `O passaporte de ${traveler.name || 'viajante'} está vencido e precisa ser renovado ` +
          `antes da viagem. O processo de renovação pode levar de 6 a 15 dias úteis.`
        : `O passaporte de ${traveler.name || 'viajante'} vence em ${details?.currentExpiry} ` +
          `e não atende ao requisito de validade mínima para os destinos da viagem. ` +
          `Faltam ${details?.daysShort} dias de validade além do necessário.`,
      priority: 'critical',
      urgency: 'blocking',
      daysBeforeTrip: 45,
      processingTimeDays: 15, // PF standard processing time
      bufferDays: 14,
      helpUrl: 'https://www.gov.br/pf/pt-br/assuntos/passaporte',
      estimatedCost: 'R$ 257,25 (taxa padrão)',
    });
  }
}
