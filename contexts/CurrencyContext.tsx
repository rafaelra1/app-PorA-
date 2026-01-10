// Currency Context - Provides currency exchange rates and conversion across the app

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { DestinationCurrency } from '../types';
import { currencyService } from '../services/currencyService';

interface CurrencyContextType {
    baseCurrency: string;                    // "BRL" by default
    rates: Record<string, number>;           // { EUR: 0.18, USD: 0.20, ... }
    isLoading: boolean;
    lastUpdated: Date | null;
    error: string | null;

    // Actions
    setBaseCurrency: (code: string) => void;
    convert: (amount: number, to: string) => number;
    convertFrom: (amount: number, from: string) => number;
    formatInCurrency: (amount: number, currencyCode: string) => string;
    refreshRates: () => Promise<void>;

    // Helpers
    getDestinationCurrency: (destination: string) => Promise<DestinationCurrency | null>;
    getCurrencySymbol: (code: string) => string;
    getCurrencyName: (code: string) => string;
    getCurrencyFlag: (code: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
    children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
    const [baseCurrency, setBaseCurrencyState] = useState<string>('BRL');
    const [rates, setRates] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch rates on mount and when base currency changes
    const fetchRates = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const newRates = await currencyService.getRates(baseCurrency);
            setRates(newRates);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch rates:', err);
            setError('Não foi possível carregar as cotações. Usando valores aproximados.');
            // Use fallback rates
            const fallback = currencyService.getFallbackRates(baseCurrency);
            setRates(fallback);
        } finally {
            setIsLoading(false);
        }
    }, [baseCurrency]);

    useEffect(() => {
        fetchRates();
    }, [fetchRates]);

    // Set base currency
    const setBaseCurrency = useCallback((code: string) => {
        setBaseCurrencyState(code);
    }, []);

    // Convert from base currency to target
    const convert = useCallback((amount: number, to: string): number => {
        if (!rates[to]) return amount;
        return amount * rates[to];
    }, [rates]);

    // Convert from foreign currency to base
    const convertFrom = useCallback((amount: number, from: string): number => {
        if (!rates[from]) return amount;
        return amount / rates[from];
    }, [rates]);

    // Format with currency symbol
    const formatInCurrency = useCallback((amount: number, currencyCode: string): string => {
        return currencyService.formatCurrency(amount, currencyCode);
    }, []);

    // Refresh rates manually
    const refreshRates = useCallback(async (): Promise<void> => {
        currencyService.clearCache();
        await fetchRates();
    }, [fetchRates]);

    // Get destination currency with rates
    const getDestinationCurrency = useCallback(async (destination: string): Promise<DestinationCurrency | null> => {
        return currencyService.getDestinationCurrency(destination);
    }, []);

    // Helper methods (stable references)
    const getCurrencySymbol = useCallback((code: string): string => {
        return currencyService.getCurrencySymbol(code);
    }, []);

    const getCurrencyName = useCallback((code: string): string => {
        return currencyService.getCurrencyName(code);
    }, []);

    const getCurrencyFlag = useCallback((code: string): string => {
        return currencyService.getCurrencyFlag(code);
    }, []);

    const value = useMemo<CurrencyContextType>(() => ({
        baseCurrency,
        rates,
        isLoading,
        lastUpdated,
        error,
        setBaseCurrency,
        convert,
        convertFrom,
        formatInCurrency,
        refreshRates,
        getDestinationCurrency,
        getCurrencySymbol,
        getCurrencyName,
        getCurrencyFlag,
    }), [
        baseCurrency,
        rates,
        isLoading,
        lastUpdated,
        error,
        setBaseCurrency,
        convert,
        convertFrom,
        formatInCurrency,
        refreshRates,
        getDestinationCurrency,
        getCurrencySymbol,
        getCurrencyName,
        getCurrencyFlag,
    ]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrencyContext(): CurrencyContextType {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrencyContext must be used within a CurrencyProvider');
    }
    return context;
}

export { CurrencyContext };
