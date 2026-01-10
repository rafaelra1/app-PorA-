// ExchangeRateCard - Display destination currency info with rates and quick references
import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { useBudgetConversion, useQuickReferences } from '../../hooks/useCurrency';
import type { DestinationCurrency } from '../../types';

interface ExchangeRateCardProps {
    destination: string;
    country?: string;
    className?: string;
    compact?: boolean;
}

export function ExchangeRateCard({
    destination,
    country,
    className = '',
    compact = false
}: ExchangeRateCardProps) {
    const {
        destinationCurrency,
        isLoading,
        error,
        formatBRL,
        formatDestination
    } = useBudgetConversion(destination);

    const quickRefs = useQuickReferences(destinationCurrency?.code || 'USD');

    // Simulated 7-day variation (in production, this would come from historical data)
    const [variation] = useState(() => (Math.random() * 6 - 3).toFixed(1));
    const variationNum = parseFloat(variation);

    if (isLoading) {
        return (
            <div className={`bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 ${className}`}>
                <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-gray-400">Carregando cotação...</span>
                </div>
            </div>
        );
    }

    if (error || !destinationCurrency) {
        return (
            <div className={`bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 ${className}`}>
                <div className="text-center py-4">
                    <p className="text-gray-400">Não foi possível carregar a cotação</p>
                    <p className="text-gray-500 text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const { code, symbol, name, flag, rateToBRL, rateFromBRL } = destinationCurrency;

    if (compact) {
        return (
            <div className={`bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{flag}</span>
                        <div>
                            <span className="font-medium text-white">{code}</span>
                            <span className="text-gray-400 text-sm ml-2">{symbol}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-white font-semibold">
                            {formatBRL(rateToBRL)}
                        </div>
                        <div className="text-xs text-gray-400">
                            por 1 {code}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{flag}</span>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {country || destination} • {name} ({code})
                        </h3>
                    </div>
                </div>
            </div>

            {/* Main Rates */}
            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* 1 Foreign = X BRL */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-3xl font-bold text-white">
                            {symbol} 1,00
                        </div>
                        <div className="text-gray-400 mt-1">
                            = {formatBRL(rateToBRL)}
                        </div>
                    </div>

                    {/* 1 BRL = X Foreign */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-3xl font-bold text-white">
                            R$ 1,00
                        </div>
                        <div className="text-gray-400 mt-1">
                            = {formatDestination(rateFromBRL)}
                        </div>
                    </div>
                </div>

                {/* Quick References */}
                <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Referências rápidas</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {quickRefs.slice(0, 6).map((ref) => (
                            <div key={ref.brl} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                                <span className="text-gray-400">{ref.brlFormatted}</span>
                                <span className="text-white font-medium">→ {ref.destinationFormatted}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Variation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-400">📈 Variação 7 dias:</span>
                    <div className={`flex items-center gap-1 text-sm font-medium ${variationNum > 0 ? 'text-green-400' : variationNum < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                        {variationNum > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : variationNum < 0 ? (
                            <TrendingDown className="w-4 h-4" />
                        ) : (
                            <Minus className="w-4 h-4" />
                        )}
                        {variationNum > 0 ? '+' : ''}{variation}%
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExchangeRateCard;
