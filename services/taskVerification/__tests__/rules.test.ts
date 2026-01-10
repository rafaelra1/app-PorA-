/**
 * Task Verification Rules - Unit Tests
 *
 * These tests demonstrate the testability of the rule system.
 * Each rule can be tested in isolation without database or full app context.
 *
 * Run with: npm test -- --testPathPattern=taskVerification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TravelInsuranceRule,
  ESTARule,
  PassportValidityRule,
  SchengenInsuranceRule,
  HighAltitudeMedicationRule,
} from '../rules';
import { TripVerificationContext, TravelerInfo, EnrichedDestination } from '../types';
import { Trip, Insurance } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a minimal test context with sensible defaults
 */
function createTestContext(
  overrides: Partial<TripVerificationContext> = {}
): TripVerificationContext {
  const defaultTrip: Trip = {
    id: 'test-trip-1',
    title: 'Test Trip',
    destination: 'Estados Unidos',
    startDate: '15/03/2026',
    endDate: '25/03/2026',
    status: 'planning',
    coverImage: '',
    participants: [],
  };

  const startDate = new Date('2026-03-15');
  const endDate = new Date('2026-03-25');
  const today = new Date();
  const daysUntilTrip = Math.ceil(
    (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    trip: defaultTrip,
    tripId: 'test-trip-1',
    startDate,
    endDate,
    daysUntilTrip,
    tripDurationDays: 10,
    destinations: [],
    countryCodes: [],
    isInternational: true,
    travelers: [
      { id: '1', name: 'João Silva', nationality: 'br' },
    ],
    primaryTraveler: { id: '1', name: 'João Silva', nationality: 'br' },
    transports: [],
    hasFlights: false,
    hasValidInsurance: false,
    existingTasks: [],
    completedTaskRuleIds: [],
    flags: {
      visitingUSA: false,
      visitingSchengen: false,
      visitingHighAltitude: false,
      visitingMalariaZone: false,
      needsAdapter: false,
      longHaulFlight: false,
      multipleCountries: false,
    },
    ...overrides,
  };
}

/**
 * Create a test destination
 */
function createDestination(
  name: string,
  countryCode: string,
  options: Partial<EnrichedDestination> = {}
): EnrichedDestination {
  return {
    id: `dest-${name.toLowerCase()}`,
    name,
    countryCode,
    countryName: name,
    startDate: '2026-03-15',
    endDate: '2026-03-25',
    ...options,
  };
}

/**
 * Create a test traveler
 */
function createTraveler(
  name: string,
  nationality: string,
  options: Partial<TravelerInfo> = {}
): TravelerInfo {
  return {
    id: `traveler-${name.toLowerCase()}`,
    name,
    nationality,
    ...options,
  };
}

// =============================================================================
// TravelInsuranceRule Tests
// =============================================================================

describe('TravelInsuranceRule', () => {
  let rule: TravelInsuranceRule;

  beforeEach(() => {
    rule = new TravelInsuranceRule();
  });

  it('should have correct metadata', () => {
    expect(rule.id).toBe('travel-insurance');
    expect(rule.name).toBe('Seguro Viagem');
    expect(rule.category).toBe('health');
  });

  it('should not apply to domestic trips', () => {
    const ctx = createTestContext({
      isInternational: false,
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(false);
    expect(result.tasks).toHaveLength(0);
  });

  it('should generate task when no insurance exists', () => {
    const ctx = createTestContext({
      isInternational: true,
      insurance: undefined,
      hasValidInsurance: false,
      destinations: [createDestination('Paris', 'fr')],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.isCompliant).toBe(false);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('Contratar seguro viagem');
  });

  it('should be compliant when valid insurance exists', () => {
    const insurance: Insurance = {
      id: 'ins-1',
      provider: 'Porto Seguro',
      policyNumber: '123456',
      startDate: '2026-03-10',
      endDate: '2026-03-30',
      contactPhone: '+5511999999999',
    };

    const ctx = createTestContext({
      isInternational: true,
      insurance,
      hasValidInsurance: true,
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.isCompliant).toBe(true);
    expect(result.tasks).toHaveLength(0);
  });

  it('should detect insufficient insurance coverage', () => {
    const insurance: Insurance = {
      id: 'ins-1',
      provider: 'Porto Seguro',
      policyNumber: '123456',
      startDate: '2026-03-15',
      endDate: '2026-03-20', // Ends before trip!
      contactPhone: '+5511999999999',
    };

    const ctx = createTestContext({
      isInternational: true,
      insurance,
      hasValidInsurance: false,
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.isCompliant).toBe(false);
    expect(result.tasks[0].text).toContain('Ajustar cobertura');
  });
});

// =============================================================================
// ESTARule Tests
// =============================================================================

describe('ESTARule', () => {
  let rule: ESTARule;

  beforeEach(() => {
    rule = new ESTARule();
  });

  it('should have correct metadata', () => {
    expect(rule.id).toBe('usa-esta');
    expect(rule.category).toBe('documentation');
    expect(rule.dependsOnRules).toContain('passport-validity');
  });

  it('should not apply to non-USA trips', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingUSA: false },
      countryCodes: ['fr'],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(false);
  });

  it('should not apply to US citizens', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingUSA: true },
      countryCodes: ['us'],
      travelers: [createTraveler('John Doe', 'us')],
    });

    const result = rule.evaluate(ctx);

    // Rule applies but US citizen doesn't need ESTA
    expect(result.tasks).toHaveLength(0);
  });

  it('should generate ESTA task for Brazilian traveler going to USA', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingUSA: true },
      countryCodes: ['us'],
      destinations: [createDestination('Nova York', 'us')],
      travelers: [createTraveler('João Silva', 'br')],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.isCompliant).toBe(false);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('visto americano');
    expect(result.tasks[0].urgency).toBe('blocking');
  });

  it('should generate ESTA task for VWP country traveler', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingUSA: true },
      countryCodes: ['us'],
      destinations: [createDestination('Nova York', 'us')],
      travelers: [createTraveler('Pierre Dupont', 'fr')], // French citizen (VWP)
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('ESTA');
    expect(result.tasks[0].estimatedCost).toContain('USD 21');
  });

  it('should be compliant when ESTA is valid', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingUSA: true },
      countryCodes: ['us'],
      destinations: [createDestination('Nova York', 'us')],
      travelers: [
        createTraveler('Pierre Dupont', 'fr', {
          hasESTA: {
            isValid: true,
            expiryDate: '2027-06-15', // Valid beyond trip
          },
        }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.isCompliant).toBe(true);
    expect(result.tasks).toHaveLength(0);
  });

  it('should detect expiring ESTA', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingUSA: true },
      countryCodes: ['us'],
      destinations: [createDestination('Nova York', 'us')],
      travelers: [
        createTraveler('Pierre Dupont', 'fr', {
          hasESTA: {
            isValid: true,
            expiryDate: '2026-03-20', // Expires during trip!
          },
        }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.isCompliant).toBe(false);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('Renovar ESTA');
  });
});

// =============================================================================
// PassportValidityRule Tests
// =============================================================================

describe('PassportValidityRule', () => {
  let rule: PassportValidityRule;

  beforeEach(() => {
    rule = new PassportValidityRule();
  });

  it('should not apply to domestic trips', () => {
    const ctx = createTestContext({ isInternational: false });
    const result = rule.evaluate(ctx);
    expect(result.isApplicable).toBe(false);
  });

  it('should generate task when passport expiry is unknown', () => {
    const ctx = createTestContext({
      isInternational: true,
      travelers: [createTraveler('João Silva', 'br')], // No passportExpiry
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('Verificar validade');
  });

  it('should generate task for expired passport', () => {
    const ctx = createTestContext({
      isInternational: true,
      travelers: [
        createTraveler('João Silva', 'br', {
          passportExpiry: '2024-01-01', // Already expired
        }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('Renovar passaporte vencido');
    expect(result.tasks[0].urgency).toBe('blocking');
  });

  it('should generate task when passport has insufficient validity', () => {
    const ctx = createTestContext({
      isInternational: true,
      flags: { ...createTestContext().flags, visitingSchengen: true },
      travelers: [
        createTraveler('João Silva', 'br', {
          passportExpiry: '2026-05-01', // Less than 6 months after trip
        }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('Renovar passaporte');
  });

  it('should be compliant with sufficient validity', () => {
    const ctx = createTestContext({
      isInternational: true,
      travelers: [
        createTraveler('João Silva', 'br', {
          passportExpiry: '2027-12-31', // Well beyond required
        }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.isCompliant).toBe(true);
    expect(result.tasks).toHaveLength(0);
  });
});

// =============================================================================
// HighAltitudeMedicationRule Tests
// =============================================================================

describe('HighAltitudeMedicationRule', () => {
  let rule: HighAltitudeMedicationRule;

  beforeEach(() => {
    rule = new HighAltitudeMedicationRule();
  });

  it('should not apply to low altitude destinations', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingHighAltitude: false },
      destinations: [createDestination('Paris', 'fr')],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(false);
  });

  it('should generate task for high altitude destinations', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingHighAltitude: true },
      destinations: [
        createDestination('Cusco', 'pe', { altitude: 3400 }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('altitude');
    expect(result.tasks[0].urgency).toBe('recommended');
  });
});

// =============================================================================
// SchengenInsuranceRule Tests
// =============================================================================

describe('SchengenInsuranceRule', () => {
  let rule: SchengenInsuranceRule;

  beforeEach(() => {
    rule = new SchengenInsuranceRule();
  });

  it('should not apply to non-Schengen trips', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingSchengen: false },
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(false);
  });

  it('should not apply to EU citizens', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingSchengen: true },
      travelers: [createTraveler('Pierre Dupont', 'fr')], // French citizen
      destinations: [createDestination('Alemanha', 'de')],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(false);
  });

  it('should generate task for non-EU traveler to Schengen', () => {
    const ctx = createTestContext({
      flags: { ...createTestContext().flags, visitingSchengen: true },
      travelers: [createTraveler('João Silva', 'br')], // Brazilian
      destinations: [
        createDestination('Paris', 'fr', { isSchengenZone: true }),
      ],
    });

    const result = rule.evaluate(ctx);

    expect(result.isApplicable).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].text).toContain('Schengen');
    expect(result.tasks[0].description).toContain('€30.000');
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Rule Integration', () => {
  it('should handle complex multi-country trip', () => {
    const ctx = createTestContext({
      isInternational: true,
      flags: {
        visitingUSA: true,
        visitingSchengen: true,
        visitingHighAltitude: false,
        visitingMalariaZone: false,
        needsAdapter: true,
        longHaulFlight: true,
        multipleCountries: true,
      },
      countryCodes: ['us', 'fr', 'de'],
      destinations: [
        createDestination('Nova York', 'us'),
        createDestination('Paris', 'fr', { isSchengenZone: true }),
        createDestination('Berlim', 'de', { isSchengenZone: true }),
      ],
      travelers: [createTraveler('João Silva', 'br')],
    });

    // Test individual rules
    const estaRule = new ESTARule();
    const schengenRule = new SchengenInsuranceRule();
    const insuranceRule = new TravelInsuranceRule();

    const estaResult = estaRule.evaluate(ctx);
    const schengenResult = schengenRule.evaluate(ctx);
    const insuranceResult = insuranceRule.evaluate(ctx);

    // Should need visa for USA (Brazilian not in VWP)
    expect(estaResult.tasks.length).toBeGreaterThan(0);

    // Should need Schengen insurance
    expect(schengenResult.tasks.length).toBeGreaterThan(0);

    // Should need general insurance
    expect(insuranceResult.tasks.length).toBeGreaterThan(0);
  });

  it('should correctly handle rule dependencies', () => {
    const estaRule = new ESTARule();

    // ESTA depends on passport validity
    expect(estaRule.dependsOnRules).toContain('passport-validity');
  });
});
