/**
 * Task Verification Rules
 *
 * This module exports all verification rules.
 * Rules are organized by category and complexity.
 *
 * To add a new rule:
 * 1. Create a new file in this directory
 * 2. Extend BaseRule or a specialized base class
 * 3. Export it from this index file
 * 4. The rule will be automatically registered by the engine
 */

// =============================================================================
// Document Rules
// =============================================================================
export { TravelInsuranceRule } from './TravelInsuranceRule';
export { ESTARule } from './ESTARule';
export { PassportValidityRule } from './PassportValidityRule';
export { SchengenInsuranceRule } from './SchengenInsuranceRule';

// =============================================================================
// Health Rules
// =============================================================================
export { YellowFeverVaccineRule } from './YellowFeverVaccineRule';
export { HighAltitudeMedicationRule } from './HighAltitudeMedicationRule';

// =============================================================================
// Financial Rules
// =============================================================================
export { NotifyBankRule } from './NotifyBankRule';

// =============================================================================
// Connectivity Rules
// =============================================================================
export { OfflineMapsRule } from './OfflineMapsRule';

// =============================================================================
// Rule Registry (all rules in one array)
// =============================================================================
import { TravelInsuranceRule } from './TravelInsuranceRule';
import { ESTARule } from './ESTARule';
import { PassportValidityRule } from './PassportValidityRule';
import { SchengenInsuranceRule } from './SchengenInsuranceRule';
import { YellowFeverVaccineRule } from './YellowFeverVaccineRule';
import { HighAltitudeMedicationRule } from './HighAltitudeMedicationRule';
import { NotifyBankRule } from './NotifyBankRule';
import { OfflineMapsRule } from './OfflineMapsRule';
import { VerificationRule } from '../types';

/**
 * All registered rules.
 * The engine iterates through these and evaluates each applicable rule.
 */
export const ALL_RULES: VerificationRule[] = [
  // Critical document rules (highest priority)
  new PassportValidityRule(),
  new ESTARule(),
  new SchengenInsuranceRule(),

  // Important health rules
  new YellowFeverVaccineRule(),
  new HighAltitudeMedicationRule(),

  // General rules
  new TravelInsuranceRule(),
  new NotifyBankRule(),
  new OfflineMapsRule(),
];

/**
 * Get rules by category
 */
export const getRulesByCategory = (category: string): VerificationRule[] => {
  return ALL_RULES.filter(r => r.category === category);
};

/**
 * Get a specific rule by ID
 */
export const getRuleById = (id: string): VerificationRule | undefined => {
  return ALL_RULES.find(r => r.id === id);
};
