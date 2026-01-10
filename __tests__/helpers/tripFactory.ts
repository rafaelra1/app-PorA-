import { Trip } from '../../types';

/**
 * Factory para criar trips de teste com valores padrão
 */
export const createTestTrip = (overrides?: Partial<Trip>): Trip => ({
    id: `test-trip-${Date.now()}`,
    title: 'Viagem de Teste',
    destination: 'Paris',
    startDate: '15/03/2026',
    endDate: '25/03/2026',
    status: 'planning',
    coverImage: 'https://example.com/paris.jpg',
    participants: [],
    ...overrides,
});

/**
 * Cria uma viagem para os Estados Unidos (útil para testar regras de ESTA/visto)
 */
export const createUSATrip = (overrides?: Partial<Trip>): Trip => createTestTrip({
    destination: 'Estados Unidos',
    detailedDestinations: [
        {
            id: 'nyc-1',
            name: 'Nova York',
            country: 'Estados Unidos',
        },
        {
            id: 'la-1',
            name: 'Los Angeles',
            country: 'Estados Unidos',
        }
    ],
    ...overrides,
});

/**
 * Cria uma viagem para a zona Schengen (útil para testar regras de visto Schengen)
 */
export const createSchengenTrip = (overrides?: Partial<Trip>): Trip => createTestTrip({
    destination: 'Europa',
    detailedDestinations: [
        {
            id: 'paris-1',
            name: 'Paris',
            country: 'França',
        },
        {
            id: 'berlin-1',
            name: 'Berlim',
            country: 'Alemanha',
        },
        {
            id: 'rome-1',
            name: 'Roma',
            country: 'Itália',
        }
    ],
    ...overrides,
});

/**
 * Cria uma viagem para países que exigem vacinas (ex: febre amarela)
 */
export const createYellowFeverTrip = (overrides?: Partial<Trip>): Trip => createTestTrip({
    destination: 'África',
    detailedDestinations: [
        {
            id: 'nairobi-1',
            name: 'Nairobi',
            country: 'Quênia',
        },
        {
            id: 'dar-1',
            name: 'Dar es Salaam',
            country: 'Tanzânia',
        }
    ],
    ...overrides,
});

/**
 * Cria uma viagem para o Brasil (útil para testar regras domésticas)
 */
export const createBrazilTrip = (overrides?: Partial<Trip>): Trip => createTestTrip({
    destination: 'Brasil',
    detailedDestinations: [
        {
            id: 'rio-1',
            name: 'Rio de Janeiro',
            country: 'Brasil',
        },
        {
            id: 'sp-1',
            name: 'São Paulo',
            country: 'Brasil',
        }
    ],
    ...overrides,
});

/**
 * Cria uma viagem de última hora (útil para testar priorização de tarefas urgentes)
 */
export const createLastMinuteTrip = (overrides?: Partial<Trip>): Trip => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return createTestTrip({
        startDate: tomorrow.toLocaleDateString('pt-BR'),
        endDate: nextWeek.toLocaleDateString('pt-BR'),
        ...overrides,
    });
};

/**
 * Cria uma viagem de longo prazo (útil para testar tarefas com prazos longos)
 */
export const createLongTermTrip = (overrides?: Partial<Trip>): Trip => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    const sevenMonthsFromNow = new Date();
    sevenMonthsFromNow.setMonth(sevenMonthsFromNow.getMonth() + 7);

    return createTestTrip({
        startDate: sixMonthsFromNow.toLocaleDateString('pt-BR'),
        endDate: sevenMonthsFromNow.toLocaleDateString('pt-BR'),
        ...overrides,
    });
};
