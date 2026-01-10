import * as React from 'react';
import { Expense } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface CategoryBreakdownProps {
    expenses: Expense[];
    totalBudget: number;
}

interface CategoryData {
    category: string;
    label: string;
    amount: number;
    percentage: number;
    icon: string;
    color: string;
}

// =============================================================================
// Config
// =============================================================================

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
    accommodation: { label: 'Hospedagem', icon: 'hotel', color: '#8B5CF6' },
    transport: { label: 'Transporte', icon: 'flight', color: '#3B82F6' },
    food: { label: 'Alimentação', icon: 'restaurant', color: '#F59E0B' },
    activities: { label: 'Atividades', icon: 'local_activity', color: '#10B981' },
    shopping: { label: 'Compras', icon: 'shopping_bag', color: '#EC4899' },
    other: { label: 'Outros', icon: 'receipt', color: '#6B7280' },
};

// =============================================================================
// Circular Chart Component
// =============================================================================

interface DonutChartProps {
    categories: CategoryData[];
    centerValue: string;
    centerLabel: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ categories, centerValue, centerLabel }) => {
    const size = 180;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                />

                {/* Category Segments */}
                {categories.map((cat, index) => {
                    const segmentLength = (cat.percentage / 100) * circumference;
                    const offset = currentOffset;
                    currentOffset += segmentLength;

                    return (
                        <circle
                            key={cat.category}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={cat.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                            style={{
                                animationDelay: `${index * 100}ms`
                            }}
                        />
                    );
                })}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-text-main">{centerValue}</span>
                <span className="text-xs text-text-muted">{centerLabel}</span>
            </div>
        </div>
    );
};

// =============================================================================
// CategoryBreakdown Component
// =============================================================================

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ expenses, totalBudget }) => {
    // Calculate totals by category
    const categoryTotals = React.useMemo(() => {
        const totals: Record<string, number> = {};

        expenses.forEach(expense => {
            const cat = expense.category || 'other';
            totals[cat] = (totals[cat] || 0) + expense.amount;
        });

        return totals;
    }, [expenses]);

    const totalSpent = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    // Build category data
    const categories: CategoryData[] = Object.entries(categoryTotals)
        .map(([key, amount]) => {
            const config = categoryConfig[key] || categoryConfig.other;
            return {
                category: key,
                label: config.label,
                amount,
                percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
                icon: config.icon,
                color: config.color,
            };
        })
        .sort((a, b) => b.amount - a.amount);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text-main">Gastos por Categoria</h3>
                <span className="text-xs text-text-muted">
                    {expenses.length} transações
                </span>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Donut Chart */}
                <div className="shrink-0">
                    <DonutChart
                        categories={categories}
                        centerValue={formatCurrency(totalSpent)}
                        centerLabel="Total Gasto"
                    />
                </div>

                {/* Legend */}
                <div className="flex-1 w-full space-y-3">
                    {categories.map((cat) => (
                        <div key={cat.category} className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                                className="size-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}20` }}
                            >
                                <span
                                    className="material-symbols-outlined text-lg"
                                    style={{ color: cat.color }}
                                >
                                    {cat.icon}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-text-main">{cat.label}</span>
                                    <span className="text-sm font-bold text-text-main">{formatCurrency(cat.amount)}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${cat.percentage}%`,
                                            backgroundColor: cat.color
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Percentage */}
                            <span className="text-xs font-bold text-text-muted w-12 text-right">
                                {cat.percentage.toFixed(1)}%
                            </span>
                        </div>
                    ))}

                    {categories.length === 0 && (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">account_balance_wallet</span>
                            <p className="text-sm text-text-muted">Nenhuma despesa registrada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryBreakdown;
