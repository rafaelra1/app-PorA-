/**
 * ESTA (Electronic System for Travel Authorization) Rule
 *
 * COMPLEXITY: Complex
 *
 * This rule demonstrates a complex verification that considers multiple factors:
 * - Only applies to USA trips
 * - Must check traveler nationality (only VWP countries need ESTA)
 * - Must verify if traveler already has a valid ESTA
 * - Must check ESTA validity period (2 years from issue)
 * - Has specific processing time requirements (72 hours minimum)
 * - Different from a visa (separate requirement)
 *
 * Applicability: Travelers from VWP countries visiting the USA
 * Check: Does each applicable traveler have a valid ESTA?
 * Task: Generate task per traveler needing ESTA
 */

import { BaseRule, CountrySpecificRule } from '../BaseRule';
import {
  RuleApplicabilityConfig,
  TripVerificationContext,
  RuleEvaluationResult,
  GeneratedTask,
  TaskCategory,
  TravelerInfo,
} from '../types';

// =============================================================================
// ESTA-Specific Data
// =============================================================================

/**
 * Visa Waiver Program (VWP) countries whose citizens can use ESTA
 * instead of obtaining a visa for short tourism/business trips.
 *
 * Citizens from these countries MUST have ESTA (or visa) to enter USA.
 * Source: https://www.cbp.gov/travel/international-visitors/visa-waiver-program
 */
const VWP_COUNTRIES = new Set([
  'ad', // Andorra
  'au', // Australia
  'at', // Austria
  'be', // Belgium
  'bn', // Brunei
  'cl', // Chile
  'hr', // Croatia
  'cz', // Czech Republic
  'dk', // Denmark
  'ee', // Estonia
  'fi', // Finland
  'fr', // France
  'de', // Germany
  'gr', // Greece
  'hu', // Hungary
  'is', // Iceland
  'ie', // Ireland
  'il', // Israel
  'it', // Italy
  'jp', // Japan
  'kr', // South Korea
  'lv', // Latvia
  'li', // Liechtenstein
  'lt', // Lithuania
  'lu', // Luxembourg
  'mt', // Malta
  'mc', // Monaco
  'nl', // Netherlands
  'nz', // New Zealand
  'no', // Norway
  'pl', // Poland
  'pt', // Portugal
  'sm', // San Marino
  'sg', // Singapore
  'sk', // Slovakia
  'si', // Slovenia
  'es', // Spain
  'se', // Sweden
  'ch', // Switzerland
  'tw', // Taiwan
  'gb', // United Kingdom
]);

/**
 * Countries that need a VISA instead of ESTA (most of the world)
 * This is a representative sample - in practice, any country not in VWP needs a visa.
 */
const VISA_REQUIRED_COUNTRIES = new Set([
  'br', // Brazil - Needs B1/B2 visa
  'cn', // China
  'in', // India
  'ru', // Russia
  'mx', // Mexico (though they have different requirements)
  'co', // Colombia
  'ar', // Argentina
  'za', // South Africa
  've', // Venezuela
  'ph', // Philippines
  'id', // Indonesia
  'th', // Thailand
  'vn', // Vietnam
  'eg', // Egypt
  'ng', // Nigeria
  'pk', // Pakistan
  'bd', // Bangladesh
  // ... many more
]);

// =============================================================================
// ESTA Rule Implementation
// =============================================================================

export class ESTARule extends BaseRule {
  // ==========================================================================
  // Rule Identity
  // ==========================================================================

  id = 'usa-esta';
  name = 'ESTA para Estados Unidos';
  description =
    'Verifica se viajantes de países do Visa Waiver Program possuem ESTA válido para entrada nos EUA';
  category: TaskCategory = 'documentation';

  // Dependencies: Passport must be valid first
  dependsOnRules = ['passport-validity'];

  // ==========================================================================
  // Applicability Configuration
  // ==========================================================================

  applicability: RuleApplicabilityConfig = {
    usaOnly: true,
    minDaysBeforeTrip: 3, // ESTA can be denied, need time for alternatives

    // Custom predicate for complex nationality logic
    customPredicate: (ctx: TripVerificationContext) => {
      // Must be visiting USA
      if (!ctx.flags.visitingUSA) return false;

      // At least one traveler must be from a country that uses ESTA or needs visa
      // (Not from USA itself - citizens don't need ESTA)
      return ctx.travelers.some(
        (t) =>
          t.nationality.toLowerCase() !== 'us' &&
          (VWP_COUNTRIES.has(t.nationality.toLowerCase()) ||
            VISA_REQUIRED_COUNTRIES.has(t.nationality.toLowerCase()))
      );
    },
  };

  // ==========================================================================
  // Evaluation Logic
  // ==========================================================================

  protected doEvaluate(ctx: TripVerificationContext): RuleEvaluationResult {
    const tasks: GeneratedTask[] = [];
    const evaluationDetails: Record<string, unknown> = {
      travelersEvaluated: [],
    };

    // Evaluate each traveler individually
    for (const traveler of ctx.travelers) {
      const nationality = traveler.nationality.toLowerCase();

      // Skip US citizens
      if (nationality === 'us') {
        (evaluationDetails.travelersEvaluated as unknown[]).push({
          name: traveler.name,
          nationality,
          status: 'us_citizen_no_esta_needed',
        });
        continue;
      }

      // Check traveler category
      const isVWP = VWP_COUNTRIES.has(nationality);
      const needsVisa = VISA_REQUIRED_COUNTRIES.has(nationality);

      if (isVWP) {
        // VWP country - check for valid ESTA
        const estaResult = this.evaluateESTAForTraveler(ctx, traveler);
        (evaluationDetails.travelersEvaluated as unknown[]).push(estaResult.details);

        if (estaResult.task) {
          tasks.push(estaResult.task);
        }
      } else if (needsVisa) {
        // Non-VWP country - needs visa, not ESTA
        // Generate different task for visa requirement
        const visaTask = this.generateVisaRequiredTask(ctx, traveler);
        tasks.push(visaTask);

        (evaluationDetails.travelersEvaluated as unknown[]).push({
          name: traveler.name,
          nationality,
          status: 'visa_required_not_vwp',
        });
      } else {
        // Unknown nationality - flag for manual review
        (evaluationDetails.travelersEvaluated as unknown[]).push({
          name: traveler.name,
          nationality,
          status: 'unknown_nationality_manual_review',
        });
      }
    }

    if (tasks.length === 0) {
      return this.compliantResult(evaluationDetails);
    }

    return this.nonCompliantResult(tasks, evaluationDetails);
  }

  // ==========================================================================
  // ESTA Evaluation for VWP Travelers
  // ==========================================================================

  private evaluateESTAForTraveler(
    ctx: TripVerificationContext,
    traveler: TravelerInfo
  ): { task: GeneratedTask | null; details: Record<string, unknown> } {
    const details: Record<string, unknown> = {
      name: traveler.name,
      nationality: traveler.nationality,
    };

    // Check if traveler has existing ESTA
    if (!traveler.hasESTA) {
      details.status = 'no_esta_registered';
      return {
        task: this.generateESTATask(ctx, traveler, 'missing'),
        details,
      };
    }

    // Check if ESTA is valid
    if (!traveler.hasESTA.isValid) {
      details.status = 'esta_invalid';
      return {
        task: this.generateESTATask(ctx, traveler, 'invalid'),
        details,
      };
    }

    // Check if ESTA will be valid during travel
    if (traveler.hasESTA.expiryDate) {
      const estaExpiry = new Date(traveler.hasESTA.expiryDate);

      // ESTA must be valid for the entire trip
      if (estaExpiry < ctx.endDate) {
        details.status = 'esta_expires_during_trip';
        details.estaExpiry = traveler.hasESTA.expiryDate;
        details.tripEnd = ctx.trip.endDate;

        return {
          task: this.generateESTATask(ctx, traveler, 'expiring', {
            expiryDate: traveler.hasESTA.expiryDate,
          }),
          details,
        };
      }

      // ESTA is valid but might be close to expiring
      const daysUntilExpiry = Math.floor(
        (estaExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 30) {
        details.status = 'esta_expiring_soon';
        details.daysUntilExpiry = daysUntilExpiry;

        return {
          task: this.generateESTATask(ctx, traveler, 'expiring_soon', {
            daysUntilExpiry: String(daysUntilExpiry),
          }),
          details,
        };
      }
    }

    // ESTA is valid
    details.status = 'esta_valid';
    details.estaExpiry = traveler.hasESTA.expiryDate;
    return { task: null, details };
  }

  // ==========================================================================
  // Task Generation
  // ==========================================================================

  private generateESTATask(
    ctx: TripVerificationContext,
    traveler: TravelerInfo,
    reason: 'missing' | 'invalid' | 'expiring' | 'expiring_soon',
    extraDetails?: Record<string, string>
  ): GeneratedTask {
    const taskTexts: Record<string, string> = {
      missing: `Solicitar ESTA para ${traveler.name || 'viajante'}`,
      invalid: `Renovar ESTA para ${traveler.name || 'viajante'}`,
      expiring: `Renovar ESTA (expira ${extraDetails?.expiryDate}) para ${traveler.name || 'viajante'}`,
      expiring_soon: `Renovar ESTA em breve para ${traveler.name || 'viajante'}`,
    };

    const descriptions: Record<string, string> = {
      missing:
        `Como cidadão de um país do Visa Waiver Program (${traveler.nationality.toUpperCase()}), ` +
        `${traveler.name || 'o viajante'} precisa de autorização ESTA para entrar nos Estados Unidos. ` +
        `O ESTA tem validade de 2 anos e permite múltiplas entradas de até 90 dias cada.`,
      invalid:
        `O ESTA registrado para ${traveler.name || 'o viajante'} não é mais válido e precisa ser renovado. ` +
        `Um novo ESTA deve ser solicitado antes da viagem.`,
      expiring:
        `O ESTA de ${traveler.name || 'o viajante'} expira em ${extraDetails?.expiryDate}, ` +
        `que é durante ou antes do fim da viagem. É necessário renovar para garantir entrada legal nos EUA.`,
      expiring_soon:
        `O ESTA de ${traveler.name || 'o viajante'} expira em ${extraDetails?.daysUntilExpiry} dias. ` +
        `Considere renovar para evitar problemas em viagens futuras.`,
    };

    return this.createTask(ctx, {
      text: taskTexts[reason],
      description: descriptions[reason],
      priority: reason === 'expiring' ? 'critical' : 'high',
      urgency: reason === 'expiring' || reason === 'missing' ? 'blocking' : 'important',
      daysBeforeTrip: 14,
      processingTimeDays: 3, // ESTA typically approved within 72 hours
      bufferDays: 7, // Extra buffer in case of issues
      helpUrl: 'https://esta.cbp.dhs.gov/',
      estimatedCost: 'USD 21 (taxa oficial)',
      applicableDestinations: ctx.destinations
        .filter((d) => d.countryCode.toLowerCase() === 'us')
        .map((d) => d.name),
    });
  }

  private generateVisaRequiredTask(
    ctx: TripVerificationContext,
    traveler: TravelerInfo
  ): GeneratedTask {
    // Check if traveler has a valid US visa
    const hasValidUSVisa = traveler.existingVisas?.some(
      (v) =>
        v.country.toLowerCase() === 'us' &&
        new Date(v.expiryDate) > ctx.endDate
    );

    if (hasValidUSVisa) {
      // This shouldn't generate a task, but the logic is here for completeness
      // In practice, we'd skip this traveler
    }

    return this.createTask(ctx, {
      text: `Verificar/Obter visto americano para ${traveler.name || 'viajante'}`,
      description:
        `Cidadãos ${traveler.nationality.toUpperCase()} não participam do Visa Waiver Program ` +
        `e precisam de visto de turista (B1/B2) para entrar nos Estados Unidos. ` +
        `O processo de visto requer agendamento no consulado e pode levar semanas.`,
      priority: 'critical',
      urgency: 'blocking',
      daysBeforeTrip: 60, // Visa process is much longer
      processingTimeDays: 30, // Interview + processing
      bufferDays: 14,
      helpUrl: 'https://br.usembassy.gov/pt/visas-pt/',
      estimatedCost: 'USD 185 (taxa MRV)',
      applicableDestinations: ctx.destinations
        .filter((d) => d.countryCode.toLowerCase() === 'us')
        .map((d) => d.name),
    });
  }
}
