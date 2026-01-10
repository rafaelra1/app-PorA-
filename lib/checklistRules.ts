/**
 * Regras de Checklist Inteligente - Fase 5
 * 
 * Este arquivo contém regras adicionais para o sistema de checklist:
 * - Vacinas por país
 * - Adaptadores de tomada
 * - Câmbio de moeda
 */

import { Trip, PreparationTask } from '../types';

export interface ChecklistRule {
    id: string;
    name: string;
    description: string;
    category: string;
    applies: (trip: Trip) => boolean;
    generateTasks: (trip: Trip) => Partial<PreparationTask>[];
    priority: 'low' | 'medium' | 'high';
}

/**
 * Países que exigem vacina de febre amarela
 */
const YELLOW_FEVER_COUNTRIES = [
    'angola', 'benin', 'burkina faso', 'burundi', 'camarões', 'república centro-africana',
    'chade', 'congo', 'costa do marfim', 'república democrática do congo', 'guiné equatorial',
    'etiópia', 'gabão', 'gâmbia', 'gana', 'guiné', 'guiné-bissau', 'quênia', 'libéria',
    'mali', 'mauritânia', 'níger', 'nigéria', 'senegal', 'serra leoa', 'sudão do sul',
    'sudão', 'togo', 'uganda', 'argentina', 'bolívia', 'brasil', 'colômbia', 'equador',
    'guiana francesa', 'guiana', 'panamá', 'paraguai', 'peru', 'suriname', 'trinidad e tobago',
    'venezuela'
];

/**
 * Regra: Vacina de Febre Amarela
 */
export const YellowFeverVaccineRule: ChecklistRule = {
    id: 'yellow-fever-vaccine',
    name: 'Vacina de Febre Amarela',
    description: 'Verifica se o destino exige vacina de febre amarela',
    category: 'health',
    priority: 'high',
    applies: (trip: Trip) => {
        const destinations = trip.detailedDestinations || [];
        return destinations.some(dest =>
            YELLOW_FEVER_COUNTRIES.some(country =>
                dest.country?.toLowerCase().includes(country) ||
                dest.name?.toLowerCase().includes(country)
            )
        );
    },
    generateTasks: (trip: Trip) => {
        const tripStart = new Date(trip.startDate.split('/').reverse().join('-'));
        const tenDaysBeforeTrip = new Date(tripStart);
        tenDaysBeforeTrip.setDate(tenDaysBeforeTrip.getDate() - 10);

        return [{
            title: 'Tomar vacina de febre amarela',
            description: 'A vacina deve ser tomada pelo menos 10 dias antes da viagem. Lembre-se de guardar o Certificado Internacional de Vacinação.',
            category: 'health' as any,
            priority: 'high',
            status: 'pending',
            deadline: tenDaysBeforeTrip.toISOString(),
        }];
    },
};

/**
 * Tipos de tomadas por país/região
 */
const PLUG_TYPES: Record<string, { type: string; voltage: string; countries: string[] }> = {
    'type-a-b': {
        type: 'Tipo A/B (Americano)',
        voltage: '110V',
        countries: ['estados unidos', 'canadá', 'méxico', 'japão', 'brasil']
    },
    'type-c': {
        type: 'Tipo C (Europeu)',
        voltage: '220V',
        countries: ['frança', 'alemanha', 'espanha', 'itália', 'portugal', 'holanda', 'bélgica', 'áustria', 'suíça']
    },
    'type-g': {
        type: 'Tipo G (Britânico)',
        voltage: '230V',
        countries: ['reino unido', 'inglaterra', 'escócia', 'irlanda', 'malta', 'chipre', 'singapura', 'malásia']
    },
    'type-i': {
        type: 'Tipo I (Australiano)',
        voltage: '230V',
        countries: ['austrália', 'nova zelândia', 'argentina', 'china']
    },
};

/**
 * Regra: Adaptador de Tomada
 */
export const PowerAdapterRule: ChecklistRule = {
    id: 'power-adapter',
    name: 'Adaptador de Tomada',
    description: 'Verifica se é necessário adaptador de tomada para o destino',
    category: 'packing',
    priority: 'medium',
    applies: (trip: Trip) => {
        const destinations = trip.detailedDestinations || [];
        // Verifica se algum destino usa tipo de tomada diferente do Brasil
        return destinations.some(dest => {
            const country = dest.country?.toLowerCase() || '';
            return Object.values(PLUG_TYPES).some(plug =>
                plug.countries.some(c => country.includes(c)) &&
                plug.type !== 'Tipo A/B (Americano)' // Brasil usa tipo A/B
            );
        });
    },
    generateTasks: (trip: Trip) => {
        const destinations = trip.detailedDestinations || [];
        const requiredAdapters = new Set<string>();

        destinations.forEach(dest => {
            const country = dest.country?.toLowerCase() || '';
            Object.values(PLUG_TYPES).forEach(plug => {
                if (plug.countries.some(c => country.includes(c)) && plug.type !== 'Tipo A/B (Americano)') {
                    requiredAdapters.add(plug.type);
                }
            });
        });

        if (requiredAdapters.size === 0) return [];

        const adaptersList = Array.from(requiredAdapters).join(', ');
        const tripStart = new Date(trip.startDate.split('/').reverse().join('-'));
        const oneWeekBefore = new Date(tripStart);
        oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

        return [{
            title: 'Comprar adaptador de tomada',
            description: `Você precisará de adaptador(es): ${adaptersList}. Considere comprar um adaptador universal se visitar múltiplos países.`,
            category: 'packing' as any,
            priority: 'medium',
            status: 'pending',
            deadline: oneWeekBefore.toISOString(),
        }];
    },
};

/**
 * Moedas principais por país
 */
const CURRENCIES: Record<string, { code: string; name: string; countries: string[] }> = {
    'USD': {
        code: 'USD',
        name: 'Dólar Americano',
        countries: ['estados unidos', 'equador', 'panamá']
    },
    'EUR': {
        code: 'EUR',
        name: 'Euro',
        countries: ['frança', 'alemanha', 'espanha', 'itália', 'portugal', 'holanda', 'bélgica', 'áustria', 'grécia', 'irlanda']
    },
    'GBP': {
        code: 'GBP',
        name: 'Libra Esterlina',
        countries: ['reino unido', 'inglaterra', 'escócia', 'irlanda do norte', 'país de gales']
    },
    'JPY': {
        code: 'JPY',
        name: 'Iene Japonês',
        countries: ['japão']
    },
    'AUD': {
        code: 'AUD',
        name: 'Dólar Australiano',
        countries: ['austrália']
    },
    'CAD': {
        code: 'CAD',
        name: 'Dólar Canadense',
        countries: ['canadá']
    },
    'CHF': {
        code: 'CHF',
        name: 'Franco Suíço',
        countries: ['suíça']
    },
};

/**
 * Regra: Câmbio de Moeda
 */
export const CurrencyExchangeRule: ChecklistRule = {
    id: 'currency-exchange',
    name: 'Câmbio de Moeda',
    description: 'Lembra de fazer câmbio da moeda local do destino',
    category: 'financial',
    priority: 'medium',
    applies: (trip: Trip) => {
        const destinations = trip.detailedDestinations || [];
        // Verifica se algum destino usa moeda diferente do Real
        return destinations.some(dest => {
            const country = dest.country?.toLowerCase() || '';
            return country !== 'brasil' && country !== '';
        });
    },
    generateTasks: (trip: Trip) => {
        const destinations = trip.detailedDestinations || [];
        const requiredCurrencies = new Set<string>();

        destinations.forEach(dest => {
            const country = dest.country?.toLowerCase() || '';
            if (country === 'brasil' || country === '') return;

            Object.entries(CURRENCIES).forEach(([code, currency]) => {
                if (currency.countries.some(c => country.includes(c))) {
                    requiredCurrencies.add(`${currency.name} (${code})`);
                }
            });
        });

        if (requiredCurrencies.size === 0) {
            // Se não encontrou moeda específica, sugere dólar como backup
            requiredCurrencies.add('Dólar Americano (USD)');
        }

        const currenciesList = Array.from(requiredCurrencies).join(', ');
        const tripStart = new Date(trip.startDate.split('/').reverse().join('-'));
        const threeDaysBefore = new Date(tripStart);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

        return [
            {
                title: 'Fazer câmbio de moeda',
                description: `Você precisará de: ${currenciesList}. Compare taxas em diferentes casas de câmbio e considere usar cartões internacionais.`,
                category: 'financial' as any,
                priority: 'medium',
                status: 'pending',
                deadline: threeDaysBefore.toISOString(),
            },
            {
                title: 'Avisar banco sobre viagem',
                description: 'Notifique seu banco sobre a viagem para evitar bloqueio de cartões no exterior.',
                category: 'financial' as any,
                priority: 'medium',
                status: 'pending',
                deadline: threeDaysBefore.toISOString(),
            }
        ];
    },
};

/**
 * Regra: Seguro Viagem (obrigatório para Schengen)
 */
export const TravelInsuranceRule: ChecklistRule = {
    id: 'travel-insurance',
    name: 'Seguro Viagem',
    description: 'Verifica se o destino exige seguro viagem obrigatório',
    category: 'documentation',
    priority: 'high',
    applies: (trip: Trip) => {
        const destinations = trip.detailedDestinations || [];
        const schengenCountries = ['frança', 'alemanha', 'espanha', 'itália', 'portugal', 'holanda',
            'bélgica', 'áustria', 'grécia', 'suécia', 'noruega', 'dinamarca'];

        return destinations.some(dest =>
            schengenCountries.some(country =>
                dest.country?.toLowerCase().includes(country)
            )
        );
    },
    generateTasks: (trip: Trip) => {
        const tripStart = new Date(trip.startDate.split('/').reverse().join('-'));
        const oneWeekBefore = new Date(tripStart);
        oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

        return [{
            title: 'Contratar seguro viagem',
            description: 'Seguro viagem é OBRIGATÓRIO para países da zona Schengen. Cobertura mínima de €30.000 para despesas médicas.',
            category: 'documentation' as any,
            priority: 'high',
            status: 'pending',
            deadline: oneWeekBefore.toISOString(),
        }];
    },
};

/**
 * Lista de todas as regras disponíveis
 */
export const ALL_CHECKLIST_RULES: ChecklistRule[] = [
    YellowFeverVaccineRule,
    PowerAdapterRule,
    CurrencyExchangeRule,
    TravelInsuranceRule,
];

/**
 * Aplica todas as regras a uma viagem e retorna as tarefas geradas
 */
export const applyAllRules = (trip: Trip): Partial<PreparationTask>[] => {
    const tasks: Partial<PreparationTask>[] = [];

    ALL_CHECKLIST_RULES.forEach(rule => {
        if (rule.applies(trip)) {
            const generatedTasks = rule.generateTasks(trip);
            tasks.push(...generatedTasks);
        }
    });

    return tasks;
};
