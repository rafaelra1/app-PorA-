// CurrencyConverter - Widget for quick currency conversion
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowUpDown, RefreshCw, Loader2 } from 'lucide-react';
import { useCurrency, useCurrencyList } from '../../hooks/useCurrency';

interface CurrencyConverterProps {
    defaultFrom?: string;
    defaultTo?: string;
    className?: string;
}

export function CurrencyConverter({
    defaultFrom = 'BRL',
    defaultTo = 'EUR',
    className = ''
}: CurrencyConverterProps) {
    const { rates, isLoading, lastUpdated, formatInCurrency, refreshRates, getCurrencyFlag } = useCurrency();
    const currencies = useCurrencyList();

    const [fromCurrency, setFromCurrency] = useState(defaultFrom);
    const [toCurrency, setToCurrency] = useState(defaultTo);
    const [fromAmount, setFromAmount] = useState<string>('1000');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Calculate converted amount
    const convertedAmount = useMemo(() => {
        const amount = parseFloat(fromAmount.replace(/\./g, '').replace(',', '.')) || 0;

        // Get rate from base to target
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;

        // Cross-rate calculation
        const result = amount * (toRate / fromRate);
        return result;
    }, [fromAmount, fromCurrency, toCurrency, rates]);

    // Format display values
    const formattedFrom = useMemo(() => {
        const amount = parseFloat(fromAmount.replace(/\./g, '').replace(',', '.')) || 0;
        return formatInCurrency(amount, fromCurrency);
    }, [fromAmount, fromCurrency, formatInCurrency]);

    const formattedTo = useMemo(() => {
        return formatInCurrency(convertedAmount, toCurrency);
    }, [convertedAmount, toCurrency, formatInCurrency]);

    // Get exchange rate for display
    const displayRate = useMemo(() => {
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;
        return toRate / fromRate;
    }, [rates, fromCurrency, toCurrency]);

    const inverseRate = useMemo(() => 1 / displayRate, [displayRate]);

    // Swap currencies
    const handleSwap = useCallback(() => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    }, [fromCurrency, toCurrency]);

    // Refresh rates
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refreshRates();
        setIsRefreshing(false);
    }, [refreshRates]);

    // Format input value
    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9,]/g, '');
        setFromAmount(value);
    }, []);

    // Last updated formatted
    const lastUpdatedText = useMemo(() => {
        if (!lastUpdated) return '';
        return lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }, [lastUpdated]);

    return (
        <div className={`bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    💱 Conversor de Moedas
                </h3>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    title="Atualizar cotações"
                >
                    {isRefreshing || isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                    )}
                </button>
            </div>

            {/* Converter Body */}
            <div className="p-5 space-y-4">
                {/* From Currency */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={fromAmount}
                                onChange={handleAmountChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                placeholder="0,00"
                            />
                        </div>
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[100px]"
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code} className="bg-gray-900">
                                    {c.flag} {c.code}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleSwap}
                        className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 hover:border-white/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowUpDown className="w-5 h-5 text-blue-400" />
                    </button>
                </div>

                {/* To Currency */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl px-4 py-3">
                                <span className="text-xl font-semibold text-white">{formattedTo}</span>
                            </div>
                        </div>
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[100px]"
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code} className="bg-gray-900">
                                    {c.flag} {c.code}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Rate Info */}
                <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                            Taxa: 1 {toCurrency} = {formatInCurrency(inverseRate, fromCurrency)}
                        </span>
                        {lastUpdatedText && (
                            <span className="text-gray-500">
                                Atualizado: {lastUpdatedText}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CurrencyConverter;
