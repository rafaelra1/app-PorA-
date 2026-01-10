import { Participant, TravelerProfile } from '../../types';

/**
 * Factory para criar participantes de teste
 */
export const createTestParticipant = (overrides?: Partial<Participant>): Participant => ({
    id: `participant-${Date.now()}`,
    name: 'João Silva',
    email: 'joao@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'Viajante',
    ...overrides,
});

/**
 * Factory para criar perfis de viajantes (para AI V2)
 */
export const createTestTravelerProfile = (overrides?: Partial<TravelerProfile>): TravelerProfile => ({
    id: `traveler-${Date.now()}`,
    ageGroup: 'adult',
    ...overrides,
});

/**
 * Cria um participante brasileiro
 */
export const createBrazilianParticipant = (overrides?: Partial<Participant>): Participant =>
    createTestParticipant({
        name: 'João Silva',
        email: 'joao@example.com',
        ...overrides,
    });

/**
 * Cria um participante americano
 */
export const createAmericanParticipant = (overrides?: Partial<Participant>): Participant =>
    createTestParticipant({
        name: 'John Smith',
        email: 'john@example.com',
        avatar: 'https://i.pravatar.cc/150?img=12',
        ...overrides,
    });

/**
 * Cria um participante europeu
 */
export const createEuropeanParticipant = (overrides?: Partial<Participant>): Participant =>
    createTestParticipant({
        name: 'Marie Dubois',
        email: 'marie@example.com',
        avatar: 'https://i.pravatar.cc/150?img=5',
        ...overrides,
    });

/**
 * Cria um perfil de viajante criança
 */
export const createChildTravelerProfile = (overrides?: Partial<TravelerProfile>): TravelerProfile =>
    createTestTravelerProfile({
        name: 'Pedro Silva',
        ageGroup: 'child',
        age: 8,
        ...overrides,
    });

/**
 * Cria um perfil de viajante idoso
 */
export const createSeniorTravelerProfile = (overrides?: Partial<TravelerProfile>): TravelerProfile =>
    createTestTravelerProfile({
        name: 'Maria Santos',
        ageGroup: 'senior',
        age: 65,
        ...overrides,
    });
