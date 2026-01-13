/**
 * Finance Utilities for Bill Splitting
 * Handles net balance calculations and expense splitting logic
 */

import { Transaction, TripParticipant, SplitDetail, Payer, DistributionMethod } from '../types';

/**
 * Calculate the net balance for each participant based on transactions.
 * Net Balance = (Total Paid by User) - (Total Consumed/Owed by User)
 * 
 * Positive balance = User is owed money (creditor)
 * Negative balance = User owes money (debtor)
 */
export function calculateNetBalances(
    transactions: Transaction[],
    participants: TripParticipant[]
): TripParticipant[] {
    // Initialize balances
    const balances: Record<string, number> = {};
    participants.forEach(p => {
        balances[p.id] = 0;
    });

    // Process each transaction
    transactions.forEach(tx => {
        const amount = tx.amountInBase ?? tx.amountOriginal;

        // Add to balance for payers (they paid, so they are owed)
        tx.payers.forEach(payer => {
            if (balances[payer.userId] !== undefined) {
                balances[payer.userId] += payer.amountPaid;
            }
        });

        // Subtract from balance for participants in the split (they consumed, so they owe)
        tx.splitBreakdown.forEach(split => {
            if (split.isInvolved && balances[split.userId] !== undefined) {
                balances[split.userId] -= split.owedShare;
            }
        });
    });

    // Return updated participants with new balances
    return participants.map(p => ({
        ...p,
        netBalance: Math.round(balances[p.id] * 100) / 100 // Round to 2 decimals
    }));
}

/**
 * Calculate split breakdown based on the distribution method.
 */
export function calculateSplitBreakdown(
    totalAmount: number,
    participants: TripParticipant[],
    method: DistributionMethod,
    customValues?: Record<string, number> // For EXACT, PERCENTAGE, or SHARES
): SplitDetail[] {
    const involvedParticipants = participants.filter(p =>
        customValues ? customValues[p.id] !== undefined : true
    );

    switch (method) {
        case 'EQUAL': {
            const share = totalAmount / involvedParticipants.length;
            return involvedParticipants.map(p => ({
                userId: p.id,
                owedShare: Math.round(share * 100) / 100,
                isInvolved: true
            }));
        }

        case 'EXACT': {
            return involvedParticipants.map(p => ({
                userId: p.id,
                owedShare: customValues?.[p.id] ?? 0,
                isInvolved: (customValues?.[p.id] ?? 0) > 0
            }));
        }

        case 'PERCENTAGE': {
            return involvedParticipants.map(p => {
                const percentage = customValues?.[p.id] ?? 0;
                return {
                    userId: p.id,
                    owedShare: Math.round((totalAmount * percentage / 100) * 100) / 100,
                    percentage,
                    isInvolved: percentage > 0
                };
            });
        }

        case 'SHARES': {
            const totalShares = Object.values(customValues ?? {}).reduce((sum, v) => sum + v, 0);
            const perShare = totalShares > 0 ? totalAmount / totalShares : 0;

            return involvedParticipants.map(p => {
                const shares = customValues?.[p.id] ?? 0;
                return {
                    userId: p.id,
                    owedShare: Math.round((perShare * shares) * 100) / 100,
                    shares,
                    isInvolved: shares > 0
                };
            });
        }

        default:
            return [];
    }
}

/**
 * Determine if a user lent or borrowed money in a transaction.
 */
export function getUserTransactionRole(
    transaction: Transaction,
    userId: string
): { role: 'lent' | 'borrowed' | 'none'; amount: number } {
    const amount = transaction.amountInBase ?? transaction.amountOriginal;

    // How much did this user pay?
    const paidByUser = transaction.payers
        .filter(p => p.userId === userId)
        .reduce((sum, p) => sum + p.amountPaid, 0);

    // How much does this user owe?
    const owedByUser = transaction.splitBreakdown
        .filter(s => s.userId === userId && s.isInvolved)
        .reduce((sum, s) => sum + s.owedShare, 0);

    const netContribution = paidByUser - owedByUser;

    if (netContribution > 0) {
        return { role: 'lent', amount: netContribution };
    } else if (netContribution < 0) {
        return { role: 'borrowed', amount: Math.abs(netContribution) };
    }
    return { role: 'none', amount: 0 };
}

/**
 * Format currency value with proper locale
 */
export function formatCurrency(value: number, currency = 'BRL'): string {
    const locales: Record<string, string> = {
        BRL: 'pt-BR',
        USD: 'en-US',
        EUR: 'de-DE'
    };

    return new Intl.NumberFormat(locales[currency] ?? 'en-US', {
        style: 'currency',
        currency
    }).format(value);
}

/**
 * Get user's position (creditor/debtor/settled) from net balance
 */
export function getUserPosition(netBalance: number): 'CREDITOR' | 'DEBTOR' | 'SETTLED' {
    if (netBalance > 0.01) return 'CREDITOR';
    if (netBalance < -0.01) return 'DEBTOR';
    return 'SETTLED';
}
