import * as React from 'react';
import { Expense } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface ExpenseListProps {
    expenses: Expense[];
    onEdit?: (expense: Expense) => void;
    onDelete?: (id: string) => void;
}

// =============================================================================
// Config
// =============================================================================

const categoryConfig: Record<string, { icon: string; color: string }> = {
    accommodation: { icon: 'hotel', color: 'bg-purple-100 text-purple-600' },
    transport: { icon: 'flight', color: 'bg-blue-100 text-blue-600' },
    food: { icon: 'restaurant', color: 'bg-orange-100 text-orange-600' },
    activities: { icon: 'local_activity', color: 'bg-emerald-100 text-emerald-600' },
    shopping: { icon: 'shopping_bag', color: 'bg-pink-100 text-pink-600' },
    other: { icon: 'receipt', color: 'bg-gray-100 text-gray-600' },
};

// =============================================================================
// ExpenseList Component
// =============================================================================

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete }) => {
    const [filter, setFilter] = React.useState<string>('all');

    const filteredExpenses = filter === 'all'
        ? expenses
        : expenses.filter(e => e.category === filter);

    // Sort by date (newest first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
    });

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const categories = ['all', ...Object.keys(categoryConfig)];
    const categoryLabels: Record<string, string> = {
        all: 'Todas',
        accommodation: 'Hospedagem',
        transport: 'Transporte',
        food: 'Alimentação',
        activities: 'Atividades',
        shopping: 'Compras',
        other: 'Outros',
    };

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100/50 overflow-hidden">
            {/* Header with Filters */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-text-main">Transações</h3>
                    <span className="text-xs text-text-muted bg-gray-100 px-2.5 py-1 rounded-full">
                        {sortedExpenses.length} itens
                    </span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                ${filter === cat
                                    ? 'bg-text-main text-white'
                                    : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                                }
                            `}
                        >
                            {categoryLabels[cat]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Expense Items */}
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {sortedExpenses.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">receipt_long</span>
                        <p className="text-sm text-text-muted">Nenhuma despesa encontrada</p>
                    </div>
                ) : (
                    sortedExpenses.map((expense) => {
                        const config = categoryConfig[expense.category || 'other'] || categoryConfig.other;

                        return (
                            <div
                                key={expense.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                            >
                                {/* Icon */}
                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                                    <span className="material-symbols-outlined text-lg">{config.icon}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-text-main truncate">
                                        {expense.description}
                                    </p>
                                    <p className="text-xs text-text-muted">{expense.date}</p>
                                </div>

                                {/* Amount */}
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-text-main">{formatCurrency(expense.amount)}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="size-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-text-muted"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(expense.id)}
                                            className="size-8 rounded-lg hover:bg-rose-100 flex items-center justify-center text-text-muted hover:text-rose-500"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ExpenseList;
