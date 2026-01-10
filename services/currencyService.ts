// Currency Exchange Service
// Uses Open Exchange Rates API (or similar) for real-time rates

import type { ExchangeRate, CurrencyConversion, DestinationCurrency } from '../types';
import { CURRENCY_INFO, DESTINATION_CURRENCIES, FALLBACK_RATES } from '../constants/currencies';

// Cache for exchange rates
const ratesCache = new Map<string, { rates: Record<string, number>; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// API configuration
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
// For Open Exchange Rates, use: https://openexchangerates.org/api/latest.json

export const currencyService = {
    /**
     * Fetch all exchange rates with base currency
     * Rates are relative to 1 unit of base currency
     */
    async getRates(base: string = 'BRL'): Promise<Record<string, number>> {
        const cacheKey = base;
        const cached = ratesCache.get(cacheKey);

        // Return cached if still valid
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.rates;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${base}`);

            if (!response.ok) {
                console.warn('Currency API failed, using fallback rates');
                return this.getFallbackRates(base);
            }

            const data = await response.json();
            const rates = data.rates as Record<string, number>;

            // Cache the result
            ratesCache.set(cacheKey, { rates, timestamp: Date.now() });

            return rates;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            return this.getFallbackRates(base);
        }
    },

    /**
     * Get fallback rates when API fails
     * Converts FALLBACK_RATES (which are X BRL per 1 foreign currency)
     * to rates from BRL perspective
     */
    getFallbackRates(base: string): Record<string, number> {
        if (base === 'BRL') {
            // FALLBACK_RATES are already in "how many BRL per 1 foreign"
            // We need to invert them to "how many foreign per 1 BRL"
            const rates: Record<string, number> = { BRL: 1 };
            for (const [currency, brlRate] of Object.entries(FALLBACK_RATES)) {
                rates[currency] = 1 / brlRate;
            }
            return rates;
        }

        // For other bases, calculate cross-rates
        const rates: Record<string, number> = { [base]: 1 };
        const baseToBRL = FALLBACK_RATES[base] || 1;

        for (const [currency, brlRate] of Object.entries(FALLBACK_RATES)) {
            rates[currency] = baseToBRL / brlRate;
        }
        rates['BRL'] = baseToBRL;

        return rates;
    },

    /**
     * Get specific exchange rate between two currencies
     */
    async getRate(from: string, to: string): Promise<ExchangeRate> {
        const rates = await this.getRates(from);
        const rate = rates[to] || 1;

        return {
            from,
            to,
            rate,
            inverseRate: 1 / rate,
            lastUpdated: new Date().toISOString(),
        };
    },

    /**
     * Convert an amount from one currency to another
     */
    convert(
        amount: number,
        from: string,
        to: string,
        rates: Record<string, number>
    ): CurrencyConversion {
        // If we have rates based on 'from' currency
        const rate = rates[to] || 1;
        const result = amount * rate;

        return {
            amount,
            from,
            to,
            result,
            rate,
            formattedResult: this.formatCurrency(result, to),
        };
    },

    /**
     * Format a value with the currency symbol
     */
    formatCurrency(amount: number, currencyCode: string): string {
        const info = CURRENCY_INFO[currencyCode];
        const symbol = info?.symbol || currencyCode;

        // Use Brazilian locale for number formatting
        const formatted = amount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        // Special handling for some currencies
        if (['EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'THB', 'PHP', 'VND', 'ILS', 'TRY', 'PLN', 'HUF', 'RUB'].includes(currencyCode)) {
            return `${symbol} ${formatted}`;
        }

        return `${symbol} ${formatted}`;
    },

    /**
     * Get currency symbol
     */
    getCurrencySymbol(code: string): string {
        return CURRENCY_INFO[code]?.symbol || code;
    },

    /**
     * Get currency name in Portuguese
     */
    getCurrencyName(code: string): string {
        return CURRENCY_INFO[code]?.name || code;
    },

    /**
     * Get currency flag emoji
     */
    getCurrencyFlag(code: string): string {
        return CURRENCY_INFO[code]?.flag || '🏳️';
    },

    /**
     * Get currency code for a destination
     */
    getDestinationCurrencyCode(destination: string): string {
        // Try exact match first
        if (DESTINATION_CURRENCIES[destination]) {
            return DESTINATION_CURRENCIES[destination];
        }

        // Try partial match (case-insensitive)
        const lower = destination.toLowerCase();
        for (const [dest, code] of Object.entries(DESTINATION_CURRENCIES)) {
            if (dest.toLowerCase().includes(lower) || lower.includes(dest.toLowerCase())) {
                return code;
            }
        }

        // Default to USD if not found
        return 'USD';
    },

    /**
     * Get full destination currency info including rates
     */
    async getDestinationCurrency(destination: string): Promise<DestinationCurrency | null> {
        const code = this.getDestinationCurrencyCode(destination);
        const info = CURRENCY_INFO[code];

        if (!info) return null;

        try {
            const rate = await this.getRate('BRL', code);

            return {
                code,
                symbol: info.symbol,
                name: info.name,
                flag: info.flag,
                rateToBRL: rate.inverseRate,  // How many BRL per 1 foreign
                rateFromBRL: rate.rate,        // How many foreign per 1 BRL
                lastUpdated: rate.lastUpdated,
            };
        } catch {
            // Fallback to static rates
            const rateToBRL = FALLBACK_RATES[code] || 1;
            return {
                code,
                symbol: info.symbol,
                name: info.name,
                flag: info.flag,
                rateToBRL,
                rateFromBRL: 1 / rateToBRL,
                lastUpdated: new Date().toISOString(),
            };
        }
    },

    /**
     * Get list of supported currencies
     */
    getSupportedCurrencies(): { code: string; name: string; symbol: string; flag: string }[] {
        return Object.entries(CURRENCY_INFO).map(([code, info]) => ({
            code,
            name: info.name,
            symbol: info.symbol,
            flag: info.flag,
        }));
    },

    /**
     * Clear the rates cache
     */
    clearCache(): void {
        ratesCache.clear();
    },
};

export default currencyService;
