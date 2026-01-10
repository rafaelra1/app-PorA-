import { ChecklistRule, RuleContext, GeneratedTask } from '../types';

/**
 * Rule: Travel Insurance for International Trips
 * Triggers: Any international destination
 */
export class TravelInsuranceRule implements ChecklistRule {
    id = 'travel-insurance';
    name = 'Travel Insurance';
    description = 'Recommends travel insurance for international trips';

    applies(context: RuleContext): boolean {
        // Check if any destination is international (different country than Brazil)
        return context.destinations.some(dest =>
            dest.country && dest.country.toLowerCase() !== 'brazil' && dest.country.toLowerCase() !== 'brasil'
        );
    }

    generate(context: RuleContext): GeneratedTask[] {
        const daysBeforeDeparture = 30;
        const dueDate = new Date(context.departureDate);
        dueDate.setDate(dueDate.getDate() - daysBeforeDeparture);

        return [{
            ruleId: this.id,
            text: 'Contratar seguro viagem internacional',
            category: 'health',
            priority: 'important',
            dueDate,
            reasoning: 'International trip detected'
        }];
    }
}

/**
 * Rule: Passport Validity
 * Triggers: International trip requiring passport validity of 6+ months
 */
export class PassportValidityRule implements ChecklistRule {
    id = 'passport-validity';
    name = 'Passport Validity';
    description = 'Ensures passport is valid for 6 months after return';

    applies(context: RuleContext): boolean {
        return context.destinations.some(dest =>
            dest.country && dest.country.toLowerCase() !== 'brazil' && dest.country.toLowerCase() !== 'brasil'
        );
    }

    generate(context: RuleContext): GeneratedTask[] {
        const sixMonthsAfterReturn = new Date(context.returnDate);
        sixMonthsAfterReturn.setMonth(sixMonthsAfterReturn.getMonth() + 6);

        const dueDate = new Date(context.departureDate);
        dueDate.setDate(dueDate.getDate() - 60); // Check 60 days before

        return [{
            ruleId: this.id,
            text: `Verificar validade do passaporte (deve ser válido até ${sixMonthsAfterReturn.toLocaleDateString('pt-BR')})`,
            category: 'documentation',
            priority: 'blocking',
            dueDate,
            reasoning: 'Passport must be valid 6 months after return'
        }];
    }
}

/**
 * Rule: ESTA/Visa for USA
 * Triggers: Trip to United States for Brazilian nationals
 */
export class ESTARule implements ChecklistRule {
    id = 'esta-visa-usa';
    name = 'ESTA/Visa USA';
    description = 'Checks visa requirements for USA travel';

    applies(context: RuleContext): boolean {
        const nationality = context.userNationality || 'BR';
        const hasUSA = context.destinations.some(dest =>
            dest.country?.toLowerCase().includes('united states') ||
            dest.country?.toLowerCase().includes('usa') ||
            dest.country?.toLowerCase().includes('estados unidos')
        );

        return hasUSA && nationality === 'BR';
    }

    generate(context: RuleContext): GeneratedTask[] {
        const dueDate = new Date(context.departureDate);
        dueDate.setDate(dueDate.getDate() - 45); // Apply 45 days before

        return [{
            ruleId: this.id,
            text: 'Solicitar visto americano ou verificar elegibilidade para ESTA',
            category: 'documentation',
            priority: 'blocking',
            dueDate,
            reasoning: 'Brazilian nationals need visa for USA'
        }];
    }
}

/**
 * Rule: Schengen Insurance
 * Triggers: Trip to Schengen Area countries
 */
export class SchengenInsuranceRule implements ChecklistRule {
    id = 'schengen-insurance';
    name = 'Schengen Insurance';
    description = 'Requires €30,000 medical insurance for Schengen visa';

    private schengenCountries = [
        'austria', 'belgium', 'czech republic', 'denmark', 'estonia', 'finland',
        'france', 'germany', 'greece', 'hungary', 'iceland', 'italy', 'latvia',
        'liechtenstein', 'lithuania', 'luxembourg', 'malta', 'netherlands',
        'norway', 'poland', 'portugal', 'slovakia', 'slovenia', 'spain',
        'sweden', 'switzerland',
        // Portuguese names
        'áustria', 'bélgica', 'república tcheca', 'dinamarca', 'estônia', 'finlândia',
        'frança', 'alemanha', 'grécia', 'hungria', 'islândia', 'itália', 'letônia',
        'liechtenstein', 'lituânia', 'luxemburgo', 'malta', 'holanda', 'países baixos',
        'noruega', 'polônia', 'eslováquia', 'eslovênia', 'espanha',
        'suécia', 'suíça'
    ];

    applies(context: RuleContext): boolean {
        return context.destinations.some(dest => {
            const country = dest.country?.toLowerCase() || '';
            return this.schengenCountries.some(sc => country.includes(sc));
        });
    }

    generate(context: RuleContext): GeneratedTask[] {
        const dueDate = new Date(context.departureDate);
        dueDate.setDate(dueDate.getDate() - 30);

        return [{
            ruleId: this.id,
            text: 'Contratar seguro viagem com cobertura mínima de €30.000 (exigência Schengen)',
            category: 'health',
            priority: 'blocking',
            dueDate,
            reasoning: 'Schengen area requires €30k medical coverage'
        }];
    }
}
