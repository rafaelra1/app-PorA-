import { Trip, Participant } from '../../types';
import { createTestTrip } from './tripFactory';
import { createTestParticipant } from './travelerFactory';

/**
 * Contexto completo de teste incluindo trip e participants
 */
export interface TestContext {
    trip: Trip;
    participants: Participant[];
    primaryParticipant: Participant;
}

/**
 * Cria um contexto de teste completo
 */
export const createTestContext = (
    tripOverrides?: Partial<Trip>,
    participantsOverrides?: Partial<Participant>[]
): TestContext => {
    const primaryParticipant = createTestParticipant({
        id: 'primary-participant',
        ...participantsOverrides?.[0],
    });

    const additionalParticipants = participantsOverrides?.slice(1).map((override, index) =>
        createTestParticipant({
            id: `participant-${index + 1}`,
            ...override,
        })
    ) || [];

    const participants = [primaryParticipant, ...additionalParticipants];

    const trip = createTestTrip({
        participants,
        ...tripOverrides,
    });

    return {
        trip,
        participants,
        primaryParticipant,
    };
};

/**
 * Cria um contexto para viagem aos EUA com viajante brasileiro
 */
export const createUSATripContext = (): TestContext => {
    return createTestContext(
        {
            destination: 'Estados Unidos',
            detailedDestinations: [
                {
                    id: 'nyc-1',
                    name: 'Nova York',
                    country: 'Estados Unidos',
                }
            ],
        },
        [
            {
                name: 'João Silva',
                email: 'joao@example.com',
            }
        ]
    );
};

/**
 * Cria um contexto para viagem à Europa com viajante brasileiro
 */
export const createSchengenTripContext = (): TestContext => {
    return createTestContext(
        {
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
                }
            ],
        },
        [
            {
                name: 'João Silva',
                email: 'joao@example.com',
            }
        ]
    );
};

/**
 * Cria um contexto para viagem em grupo
 */
export const createGroupTripContext = (): TestContext => {
    return createTestContext(
        {
            destination: 'Japão',
            detailedDestinations: [
                {
                    id: 'tokyo-1',
                    name: 'Tóquio',
                    country: 'Japão',
                }
            ],
        },
        [
            {
                name: 'João Silva',
                email: 'joao@example.com',
            },
            {
                name: 'Maria Santos',
                email: 'maria@example.com',
            },
            {
                name: 'Pedro Costa',
                email: 'pedro@example.com',
            }
        ]
    );
};
