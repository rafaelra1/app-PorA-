/**
 * Gap Analysis Service
 *
 * Performs deterministic checks on trip data to identify critical missing items
 * before sending to AI for validation and enrichment.
 */

import { Trip, HotelReservation, Transport, PlanningGap } from '../../types';
import { Task } from '../../types/checklist';

// =============================================================================
// Reference Data
// =============================================================================

/**
 * Countries that require Yellow Fever vaccination for entry
 */
const YELLOW_FEVER_COUNTRIES = new Set([
    'angola', 'benin', 'burkina faso', 'burundi', 'cameroon', 'central african republic',
    'chad', 'congo', 'democratic republic of congo', 'ivory coast', 'equatorial guinea',
    'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea', 'guinea-bissau', 'kenya', 'liberia',
    'mali', 'mauritania', 'niger', 'nigeria', 'senegal', 'sierra leone', 'south sudan',
    'sudan', 'togo', 'uganda', 'argentina', 'bolivia', 'brazil', 'colombia', 'ecuador',
    'french guiana', 'guyana', 'panama', 'paraguay', 'peru', 'suriname', 'venezuela',
    // Portuguese names
    'camarões', 'república centro-africana', 'república democrática do congo',
    'costa do marfim', 'guiné equatorial', 'etiópia', 'gâmbia', 'gana', 'guiné',
    'guiné-bissau', 'quênia', 'libéria', 'mauritânia', 'nigéria', 'sudão do sul',
    'sudão', 'trinidad e tobago', 'bolívia', 'colômbia', 'equador', 'guiana francesa',
    'guiana', 'panamá', 'paraguai'
]);

/**
 * Schengen countries (require €30k health insurance)
 */
const SCHENGEN_COUNTRIES = new Set([
    'austria', 'belgium', 'czech republic', 'denmark', 'estonia', 'finland',
    'france', 'germany', 'greece', 'hungary', 'iceland', 'italy', 'latvia',
    'liechtenstein', 'lithuania', 'luxembourg', 'malta', 'netherlands',
    'norway', 'poland', 'portugal', 'slovakia', 'slovenia', 'spain',
    'sweden', 'switzerland',
    // Portuguese names
    'áustria', 'bélgica', 'república tcheca', 'dinamarca', 'estônia', 'finlândia',
    'frança', 'alemanha', 'grécia', 'hungria', 'islândia', 'itália', 'letônia',
    'lituânia', 'luxemburgo', 'holanda', 'países baixos', 'noruega', 'polônia',
    'eslováquia', 'eslovênia', 'espanha', 'suécia', 'suíça'
]);

/**
 * Countries that require visa for Brazilian citizens
 */
const VISA_REQUIRED_COUNTRIES = new Set([
    'united states', 'usa', 'estados unidos', 'eua',
    'canada', 'canadá',
    'australia', 'austrália',
    'china',
    'india', 'índia',
    'russia', 'rússia',
    'japan', 'japão',
    'vietnam', 'vietnã',
    'cuba'
]);

// =============================================================================
// Gap Detection Functions
// =============================================================================

export interface GapAnalysisContext {
    trip: Trip;
    accommodations: HotelReservation[];
    transports: Transport[];
    tasks: Task[];
}

export interface ExtendedPlanningGap extends PlanningGap {
    category: 'logistics' | 'documentation' | 'health' | 'financial';
    suggestedAction?: string;
    urgencyDays?: number;
}

/**
 * Check if the trip is international (destination country is not Brazil)
 */
function isInternationalTrip(trip: Trip): boolean {
    const destinations = trip.detailedDestinations || [];
    return destinations.some(dest => {
        const country = dest.country?.toLowerCase() || '';
        return country !== '' && country !== 'brazil' && country !== 'brasil';
    });
}

/**
 * Get all destination countries from a trip
 */
function getDestinationCountries(trip: Trip): string[] {
    const destinations = trip.detailedDestinations || [];
    return destinations
        .map(dest => dest.country?.toLowerCase() || '')
        .filter(Boolean);
}

/**
 * Check if a task with a matching keyword exists (case-insensitive)
 */
function hasTaskWithKeyword(tasks: Task[], keywords: string[]): boolean {
    const normalizedTitles = tasks.map(t => t.title.toLowerCase());
    return keywords.some(keyword =>
        normalizedTitles.some(title => title.includes(keyword.toLowerCase()))
    );
}

/**
 * Detect logistic gaps (missing accommodations and transports)
 */
export function detectLogisticGaps(
    trip: Trip,
    accommodations: HotelReservation[],
    transports: Transport[]
): ExtendedPlanningGap[] {
    const gaps: ExtendedPlanningGap[] = [];

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('[GapAnalysis] Invalid trip dates, skipping logistic gap detection');
        return gaps;
    }

    const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Check for Accommodation Gaps
    const daysWithoutHotel: string[] = [];

    for (let i = 0; i < tripDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Check if this date is covered by any hotel stay
        const hasHotel = accommodations.some(hotel => {
            const checkIn = new Date(hotel.checkIn);
            const checkOut = new Date(hotel.checkOut);
            // Covered if date >= checkIn AND date < checkOut (you sleep there on the night of 'date')
            return currentDate >= checkIn && currentDate < checkOut;
        });

        if (!hasHotel) {
            daysWithoutHotel.push(dateStr);
        }
    }

    if (daysWithoutHotel.length > 0) {
        if (daysWithoutHotel.length === tripDays) {
            gaps.push({
                type: 'accommodation',
                category: 'logistics',
                severity: 'critical',
                description: 'Nenhuma hospedagem reservada para a viagem inteira.',
                suggestedAction: 'Reservar hospedagem para todas as noites da viagem.',
                date: trip.startDate
            });
        } else {
            gaps.push({
                type: 'accommodation',
                category: 'logistics',
                severity: 'critical',
                description: `Falta hospedagem para ${daysWithoutHotel.length} noite(s) (ex: ${daysWithoutHotel[0]}).`,
                suggestedAction: `Reservar hotel para as noites sem cobertura.`,
                date: daysWithoutHotel[0]
            });
        }
    }

    // 2. Check for Transport Gaps
    if (transports.length === 0) {
        gaps.push({
            type: 'transport',
            category: 'logistics',
            severity: 'critical',
            description: 'Nenhum meio de transporte reservado para a viagem.',
            suggestedAction: 'Comprar passagens aéreas ou reservar transporte para o destino.',
            date: trip.startDate
        });
    } else {
        // Check for departure transport (near start date)
        const hasDepartureTransport = transports.some(t => {
            const depDate = new Date(t.departureDate);
            const daysDiff = Math.abs((depDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 1; // Within 1 day of trip start
        });

        if (!hasDepartureTransport) {
            gaps.push({
                type: 'transport',
                category: 'logistics',
                severity: 'warning',
                description: 'Nenhum transporte encontrado para a data de início da viagem.',
                suggestedAction: 'Verificar se há passagem de ida para o destino.',
                date: trip.startDate
            });
        }

        // Check for return transport (near end date)
        const hasReturnTransport = transports.some(t => {
            const depDate = new Date(t.departureDate);
            const daysDiff = Math.abs((depDate.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 1; // Within 1 day of trip end
        });

        if (!hasReturnTransport) {
            gaps.push({
                type: 'transport',
                category: 'logistics',
                severity: 'warning',
                description: 'Nenhum transporte encontrado para a data de retorno da viagem.',
                suggestedAction: 'Verificar se há passagem de volta.',
                date: trip.endDate
            });
        }
    }

    return gaps;
}

/**
 * Detect essential gaps (missing documents, health, and financial items)
 */
export function detectEssentialGaps(
    trip: Trip,
    tasks: Task[]
): ExtendedPlanningGap[] {
    const gaps: ExtendedPlanningGap[] = [];
    const countries = getDestinationCountries(trip);
    const international = isInternationalTrip(trip);

    // Calculate days until trip
    const today = new Date();
    const tripStart = new Date(trip.startDate);
    const daysUntilTrip = Math.ceil((tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Passport Check (for international trips)
    if (international && !hasTaskWithKeyword(tasks, ['passaporte', 'passport'])) {
        gaps.push({
            type: 'transport', // Using transport as closest match, ideally would be 'documentation'
            category: 'documentation',
            severity: daysUntilTrip < 60 ? 'critical' : 'warning',
            description: 'Verificar validade do passaporte (mínimo 6 meses após retorno).',
            suggestedAction: 'Verificar se passaporte está válido e renovar se necessário.',
            urgencyDays: 60
        });
    }

    // 2. Visa Check
    const countriesNeedingVisa = countries.filter(country =>
        VISA_REQUIRED_COUNTRIES.has(country)
    );

    if (countriesNeedingVisa.length > 0 && !hasTaskWithKeyword(tasks, ['visto', 'visa', 'esta'])) {
        gaps.push({
            type: 'transport', // Placeholder - ideally 'documentation'
            category: 'documentation',
            severity: 'critical',
            description: `Visto pode ser necessário para: ${countriesNeedingVisa.join(', ')}.`,
            suggestedAction: 'Verificar requisitos de visto e iniciar processo se aplicável.',
            urgencyDays: 90
        });
    }

    // 3. Health Insurance Check (especially for Schengen)
    const schengenDestinations = countries.filter(country =>
        SCHENGEN_COUNTRIES.has(country)
    );

    if (schengenDestinations.length > 0 && !hasTaskWithKeyword(tasks, ['seguro', 'insurance'])) {
        gaps.push({
            type: 'transport', // Placeholder - ideally 'health'
            category: 'health',
            severity: 'critical',
            description: 'Seguro viagem obrigatório para países Schengen (cobertura mín. €30.000).',
            suggestedAction: 'Contratar seguro viagem com cobertura adequada.',
            urgencyDays: 14
        });
    } else if (international && !hasTaskWithKeyword(tasks, ['seguro', 'insurance'])) {
        gaps.push({
            type: 'transport',
            category: 'health',
            severity: 'warning',
            description: 'Recomendado contratar seguro viagem internacional.',
            suggestedAction: 'Pesquisar e contratar seguro viagem.',
            urgencyDays: 7
        });
    }

    // 4. Yellow Fever Vaccine Check
    const yellowFeverDestinations = countries.filter(country =>
        YELLOW_FEVER_COUNTRIES.has(country)
    );

    if (yellowFeverDestinations.length > 0 && !hasTaskWithKeyword(tasks, ['vacina', 'vaccine', 'febre amarela', 'yellow fever'])) {
        gaps.push({
            type: 'transport',
            category: 'health',
            severity: 'critical',
            description: `Vacina de Febre Amarela pode ser exigida para: ${yellowFeverDestinations.join(', ')}.`,
            suggestedAction: 'Verificar requisitos e tomar vacina com antecedência (mín. 10 dias).',
            urgencyDays: 30
        });
    }

    return gaps;
}

/**
 * Main function: Analyze the full trip context and return all detected gaps
 */
export function analyzeGaps(context: GapAnalysisContext): ExtendedPlanningGap[] {
    const { trip, accommodations, transports, tasks } = context;

    const logisticGaps = detectLogisticGaps(trip, accommodations, transports);
    const essentialGaps = detectEssentialGaps(trip, tasks);

    // Combine and sort by severity (critical first)
    const allGaps = [...logisticGaps, ...essentialGaps];
    allGaps.sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (a.severity !== 'critical' && b.severity === 'critical') return 1;
        return 0;
    });

    return allGaps;
}

/**
 * Convert extended gaps to standard PlanningGap format for AI prompt
 */
export function toStandardGaps(gaps: ExtendedPlanningGap[]): PlanningGap[] {
    return gaps.map(gap => ({
        type: gap.type,
        severity: gap.severity,
        description: gap.description,
        date: gap.date
    }));
}
