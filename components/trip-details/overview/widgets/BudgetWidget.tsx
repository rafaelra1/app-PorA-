import * as React from 'react';
import { Card } from '../../../ui/Base';

// =============================================================================
// Types
// =============================================================================

interface BudgetWidgetProps {
    spent: number;
    total: number;
    currency?: string;
    onNavigate?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const formatCurrency = (value: number, currency: string = 'BRL'): string => {
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(value);
};

const getProgressColor = (percentage: number): { bg: string; text: string; gradient: string } => {
    if (percentage > 100) {
        return {
            bg: 'bg-rose-500',
            text: 'text-rose-600',
            gradient: 'from-rose-500 to-red-600'
        };
    }
    if (percentage > 80) {
        return {
            bg: 'bg-amber-500',
            text: 'text-amber-600',
            gradient: 'from-amber-400 to-orange-500'
        };
    }
    if (percentage > 50) {
        return {
            bg: 'bg-yellow-500',
            text: 'text-yellow-600',
            gradient: 'from-yellow-400 to-amber-500'
        };
    }
    return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600',
        gradient: 'from-emerald-400 to-green-500'
    };
};

// =============================================================================
// BudgetWidget Component
// =============================================================================

const BudgetWidget: React.FC<BudgetWidgetProps> = ({
    spent,
    total,
    currency = 'BRL',
    onNavigate
}) => {
    const percentage = Math.min(Math.round((spent / total) * 100), 150); // Cap at 150% for display
    const displayPercentage = Math.min(percentage, 100);
    const remaining = total - spent;
    const isOverBudget = spent > total;
    const colors = getProgressColor(percentage);

    return (
        <Card
            className="p-5 hover:shadow-lg transition-all cursor-pointer group"
            onClick={onNavigate}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-emerald-100 rounded-full">
                    Orçamento
                </span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${isOverBudget ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                    <span className="material-symbols-outlined text-sm">
                        {isOverBudget ? 'trending_up' : 'savings'}
                    </span>
                    {isOverBudget ? 'Acima' : 'Dentro'}
                </div>
            </div>

            {/* Main Values */}
            <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <p className="text-xs text-text-muted mb-1">Gasto</p>
                        <p className={`text-2xl font-black ${colors.text}`}>
                            {formatCurrency(spent, currency)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-muted mb-1">de</p>
                        <p className="text-lg font-bold text-text-main">
                            {formatCurrency(total, currency)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                        style={{ width: `${displayPercentage}%` }}
                    />
                </div>
                <p className="text-xs text-text-muted mt-1.5 text-right">{percentage}% utilizado</p>
            </div>

            {/* Footer Stats */}
            <div className={`p-3 rounded-xl ${isOverBudget ? 'bg-rose-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                        {isOverBudget ? 'Excedente' : 'Restante'}
                    </span>
                    <span className={`text-sm font-bold ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining), currency)}
                    </span>
                </div>
            </div>

            {/* Hover Indicator */}
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                Ver detalhes
            </div>
        </Card>
    );
};

export default BudgetWidget;
