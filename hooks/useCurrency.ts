// Currency Hooks - Convenient hooks for currency operations

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCurrencyContext } from '../contexts/CurrencyContext';
import { currencyService } from '../services/currencyService';
import type { DestinationCurrency } from '../types';

/**
 * Main currency hook - provides access to currency context
 */
export function useCurrency() {
    return useCurrencyContext();
}

/**
 * Hook for budget conversion in trip components
 * Provides easy-to-use conversion functions for a specific destination
 */
export function useBudgetConversion(tripDestination: string) {
    const { rates, formatInCurrency, isLoading, error } = useCurrency();
    const [destinationCurrency, setDestinationCurrency] = useState<DestinationCurrency | null>(null);
    const [currencyLoading, setCurrencyLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadDestinationCurrency() {
            setCurrencyLoading(true);
            const currency = await currencyService.getDestinationCurrency(tripDestination);
            if (!cancelled) {
                setDestinationCurrency(currency);
                setCurrencyLoading(false);
            }
        }

        if (tripDestination) {
            loadDestinationCurrency();
        }

        return () => {
            cancelled = true;
        };
    }, [tripDestination]);

    // Convert BRL to destination currency
    const convertToDestination = useCallback((amountBRL: number): number => {
        if (!destinationCurrency) return amountBRL;
        return amountBRL * destinationCurrency.rateFromBRL;
    }, [destinationCurrency]);

    // Convert destination currency to BRL
    const convertToBRL = useCallback((amountDestination: number): number => {
        if (!destinationCurrency) return amountDestination;
        return amountDestination * destinationCurrency.rateToBRL;
    }, [destinationCurrency]);

    // Format in BRL
    const formatBRL = useCallback((amount: number): string => {
        return formatInCurrency(amount, 'BRL');
    }, [formatInCurrency]);

    // Format in destination currency
    const formatDestination = useCallback((amount: number): string => {
        if (!destinationCurrency) return formatInCurrency(amount, 'USD');
        return formatInCurrency(amount, destinationCurrency.code);
    }, [destinationCurrency, formatInCurrency]);

    // Format with both currencies
    const formatDual = useCallback((amountBRL: number): { brl: string; destination: string } => {
        const converted = convertToDestination(amountBRL);
        return {
            brl: formatBRL(amountBRL),
            destination: formatDestination(converted),
        };
    }, [convertToDestination, formatBRL, formatDestination]);

    return useMemo(() => ({
        destinationCurrency,
        isLoading: isLoading || currencyLoading,
        error,
        convertToBRL,
        convertToDestination,
        formatBRL,
        formatDestination,
        formatDual,
        rate: destinationCurrency?.rateToBRL || 1,
        rateInverse: destinationCurrency?.rateFromBRL || 1,
    }), [
        destinationCurrency,
        isLoading,
        currencyLoading,
        error,
        convertToBRL,
        convertToDestination,
        formatBRL,
        formatDestination,
        formatDual,
    ]);
}

/**
 * Hook for quick reference table values
 * Returns common conversion amounts for display
 */
export function useQuickReferences(destinationCode: string) {
    const { rates, formatInCurrency } = useCurrency();

    const quickRefs = useMemo(() => {
        const amounts = [50, 100, 200, 500, 1000, 2000, 5000];
        const rate = rates[destinationCode] || 1;

        return amounts.map(brl => ({
            brl,
            brlFormatted: formatInCurrency(brl, 'BRL'),
            destination: brl * rate,
            destinationFormatted: formatInCurrency(brl * rate, destinationCode),
        }));
    }, [rates, destinationCode, formatInCurrency]);

    return quickRefs;
}

/**
 * Hook for currency selection dropdown
 */
export function useCurrencyList() {
    const currencies = useMemo(() => {
        return currencyService.getSupportedCurrencies();
    }, []);

    return currencies;
}

export default useCurrency;
