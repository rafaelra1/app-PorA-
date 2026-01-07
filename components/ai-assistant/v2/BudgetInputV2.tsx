import React, { useState } from 'react';
import { BudgetBreakdown, TravelBudget } from '../../../types';

interface BudgetInputV2Props {
    value: BudgetBreakdown | null;
    onChange: (budget: BudgetBreakdown) => void;
}

const budgetLevels: { value: TravelBudget; label: string; icon: string; range: string; multiplier: number }[] = [
    { value: 'economic', label: 'Econômico', icon: '💰', range: 'R$ 150-300/dia', multiplier: 225 },
    { value: 'balanced', label: 'Equilibrado', icon: '💰💰', range: 'R$ 400-700/dia', multiplier: 550 },
    { value: 'luxury', label: 'Luxo', icon: '💰💰💰', range: 'R$ 1.000+/dia', multiplier: 1500 },
];

const priorityOptions: { id: string; label: string; icon: string }[] = [
    { id: 'accommodation', label: 'Hospedagem', icon: 'hotel' },
    { id: 'food', label: 'Gastronomia', icon: 'restaurant' },
    { id: 'activities', label: 'Atividades', icon: 'confirmation_number' },
    { id: 'transport', label: 'Transporte', icon: 'directions_car' },
];

const BudgetInputV2: React.FC<BudgetInputV2Props> = ({ value, onChange }) => {
    const [selectedLevel, setSelectedLevel] = useState<TravelBudget>('balanced');
    const [days, setDays] = useState(7);
    const [priorities, setPriorities] = useState<string[]>(['food', 'activities']);
    const [customTotal, setCustomTotal] = useState<number | null>(null);

    const calculateBudget = (level: TravelBudget, numDays: number, custom?: number | null): BudgetBreakdown => {
        const multiplier = budgetLevels.find(b => b.value === level)?.multiplier || 550;
        const total = custom || multiplier * numDays;

        // Distribute based on priorities
        const hasPriority = (id: string) => priorities.includes(id);
        const priorityBonus = 0.1; // 10% bonus for priorities

        const baseDistribution = {
            accommodation: 0.35,
            food: 0.25,
            transport: 0.15,
            activities: 0.15,
            shopping: 0.05,
            emergency: 0.05,
        };

        // Adjust based on priorities
        let adjustedDistribution = { ...baseDistribution };
        priorities.forEach(p => {
            if (p in adjustedDistribution) {
                (adjustedDistribution as any)[p] += priorityBonus;
            }
        });

        // Normalize
        const sumAdjusted = Object.values(adjustedDistribution).reduce((a, b) => a + b, 0);
        Object.keys(adjustedDistribution).forEach(k => {
            (adjustedDistribution as any)[k] = (adjustedDistribution as any)[k] / sumAdjusted;
        });

        return {
            total: Math.round(total),
            accommodation: Math.round(total * adjustedDistribution.accommodation),
            food: Math.round(total * adjustedDistribution.food),
            transport: Math.round(total * adjustedDistribution.transport),
            activities: Math.round(total * adjustedDistribution.activities),
            shopping: Math.round(total * adjustedDistribution.shopping),
            emergency: Math.round(total * adjustedDistribution.emergency),
        };
    };

    const handleLevelChange = (level: TravelBudget) => {
        setSelectedLevel(level);
        setCustomTotal(null);
        onChange(calculateBudget(level, days));
    };

    const handleDaysChange = (numDays: number) => {
        setDays(numDays);
        onChange(calculateBudget(selectedLevel, numDays, customTotal));
    };

    const handleCustomTotalChange = (val: number) => {
        setCustomTotal(val);
        onChange(calculateBudget(selectedLevel, days, val));
    };

    const togglePriority = (id: string) => {
        const updated = priorities.includes(id)
            ? priorities.filter(p => p !== id)
            : [...priorities, id];
        setPriorities(updated);
        onChange(calculateBudget(selectedLevel, days, customTotal));
    };

    const currentBudget = calculateBudget(selectedLevel, days, customTotal);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B68FF]">payments</span>
                    Quanto você quer gastar?
                </h3>
                <p className="text-sm text-[#9F9FB1] mt-1">
                    Defina seu orçamento para otimizarmos as sugestões.
                </p>
            </div>

            {/* Budget Level Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {budgetLevels.map((level) => (
                    <button
                        key={level.value}
                        onClick={() => handleLevelChange(level.value)}
                        className={`p-4 rounded-2xl border-2 transition-all text-center ${selectedLevel === level.value
                                ? 'border-[#6B68FF] bg-[#6B68FF]/5'
                                : 'border-[#EDEFF3] hover:border-[#6B68FF]/30'
                            }`}
                    >
                        <span className="text-2xl block mb-2">{level.icon}</span>
                        <span className="font-semibold text-[#1F1F1F] block">{level.label}</span>
                        <span className="text-xs text-[#9F9FB1]">{level.range}</span>
                    </button>
                ))}
            </div>

            {/* Days and Custom Total */}
            <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                            Dias de Viagem
                        </label>
                        <select
                            value={days}
                            onChange={(e) => handleDaysChange(parseInt(e.target.value))}
                            className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                        >
                            {[3, 5, 7, 10, 14, 21, 30].map((d) => (
                                <option key={d} value={d}>{d} dias</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                            Orçamento Total (opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9F9FB1]">R$</span>
                            <input
                                type="number"
                                value={customTotal || ''}
                                onChange={(e) => handleCustomTotalChange(parseInt(e.target.value) || 0)}
                                placeholder={currentBudget.total.toString()}
                                className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 pl-10 pr-4 text-[#1F1F1F]"
                            />
                        </div>
                    </div>
                </div>

                {/* Estimated Total Display */}
                <div className="bg-[#6B68FF]/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#6B68FF]">savings</span>
                        <span className="text-[#6B68FF] font-medium">Orçamento Estimado</span>
                    </div>
                    <span className="text-xl font-bold text-[#6B68FF]">
                        R$ {currentBudget.total.toLocaleString('pt-BR')}
                    </span>
                </div>
            </div>

            {/* Priorities */}
            <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3]">
                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                    Prioridades de Gasto (selecione até 2)
                </label>
                <p className="text-sm text-[#9F9FB1] mb-4">
                    Vamos direcionar mais orçamento para essas categorias.
                </p>
                <div className="flex flex-wrap gap-3">
                    {priorityOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => togglePriority(option.id)}
                            disabled={priorities.length >= 2 && !priorities.includes(option.id)}
                            className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${priorities.includes(option.id)
                                    ? 'bg-[#6B68FF] text-white shadow-md'
                                    : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{option.icon}</span>
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Budget Breakdown Preview */}
                <div className="mt-6 pt-6 border-t border-[#EDEFF3]">
                    <h4 className="text-sm font-semibold text-[#1F1F1F] mb-3">Distribuição Sugerida</h4>
                    <div className="space-y-2">
                        {[
                            { label: 'Hospedagem', value: currentBudget.accommodation, color: '#6B68FF' },
                            { label: 'Alimentação', value: currentBudget.food, color: '#FF6B6B' },
                            { label: 'Transporte', value: currentBudget.transport, color: '#4ECDC4' },
                            { label: 'Atividades', value: currentBudget.activities, color: '#FFE66D' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className="w-24 text-sm text-[#9F9FB1]">{item.label}</div>
                                <div className="flex-1 h-2 bg-[#EDEFF3] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${(item.value! / currentBudget.total) * 100}%`,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                </div>
                                <div className="w-20 text-right text-sm font-medium text-[#1F1F1F]">
                                    R$ {item.value?.toLocaleString('pt-BR')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetInputV2;
