import * as React from 'react';
import { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, ExpenseFilter } from '../../../types';
import ExchangeRateCard from '../ExchangeRateCard';

interface BudgetViewProps {
    expenses: Expense[];
    totalBudget: number;
    destination?: string;
    onAddExpense: () => void;
    onDeleteExpense?: (id: string) => void;
}

const BudgetView: React.FC<BudgetViewProps> = ({ expenses, totalBudget, destination, onAddExpense, onDeleteExpense }) => {
    const [expenseFilter, setExpenseFilter] = useState<ExpenseFilter>('todas');

    const categoryConfig: Record<ExpenseCategory, { label: string; icon: string; color: string; bg: string }> = {
        alimentacao: { label: 'Alimentação', icon: 'restaurant', color: 'text-amber-500', bg: 'bg-amber-100' },
        transporte: { label: 'Transporte', icon: 'directions_car', color: 'text-blue-500', bg: 'bg-blue-100' },
        hospedagem: { label: 'Hospedagem', icon: 'hotel', color: 'text-indigo-500', bg: 'bg-indigo-100' },
        lazer: { label: 'Lazer', icon: 'confirmation_number', color: 'text-green-500', bg: 'bg-green-100' },
        compras: { label: 'Compras', icon: 'shopping_bag', color: 'text-pink-500', bg: 'bg-pink-100' },
        outros: { label: 'Outros', icon: 'more_horiz', color: 'text-gray-500', bg: 'bg-gray-100' },
    };

    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Computations
    const totalSpent = useMemo(() =>
        expenses.filter(e => e.type === 'saida').reduce((sum, e) => sum + e.amount, 0),
        [expenses]
    );
    const totalIncome = useMemo(() =>
        expenses.filter(e => e.type === 'entrada').reduce((sum, e) => sum + e.amount, 0),
        [expenses]
    );
    const remainingBudget = totalBudget - totalSpent + totalIncome;
    const remainingPercent = Math.round((remainingBudget / totalBudget) * 100);

    const categoryTotals = useMemo(() => {
        const totals: Record<ExpenseCategory, number> = {
            alimentacao: 0, transporte: 0, hospedagem: 0, lazer: 0, compras: 0, outros: 0
        };
        expenses.filter(e => e.type === 'saida').forEach(e => {
            totals[e.category] += e.amount;
        });
        return totals;
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        if (expenseFilter === 'todas') return expenses;
        return expenses.filter(e =>
            expenseFilter === 'entradas' ? e.type === 'entrada' : e.type === 'saida'
        );
    }, [expenses, expenseFilter]);

    const dailyAverage = useMemo(() => {
        const days = new Set(expenses.map(e => e.date)).size || 1;
        return totalSpent / days;
    }, [expenses, totalSpent]);

    const maxExpense = useMemo(() =>
        Math.max(...expenses.filter(e => e.type === 'saida').map(e => e.amount), 0),
        [expenses]
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Gerenciamento de Orçamento</h2>
                    <p className="text-text-muted text-sm">Acompanhe seus gastos e mantenha-se dentro do orçamento da viagem.</p>
                </div>
                <button
                    onClick={onAddExpense}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-text-main rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-md"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Nova Despesa
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Budget Summary */}
                <div className="space-y-6">
                    {/* Budget Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-text-main">Resumo do Orçamento</h3>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${remainingPercent > 20 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                {remainingPercent > 20 ? 'Dentro da meta' : 'Atenção'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="relative size-32 mb-4">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-cyan-500" strokeDasharray={`${Math.max(0, Math.min(100, remainingPercent))}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xs text-text-muted">Restante</span>
                                    <span className="text-3xl font-extrabold text-text-main">{remainingPercent}%</span>
                                    <span className="text-xs text-text-muted">{formatCurrency(remainingBudget)}</span>
                                </div>
                            </div>
                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="text-xs text-text-muted uppercase tracking-wider">Total</p>
                                    <p className="font-bold text-text-main">{formatCurrency(totalBudget)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase tracking-wider">Gasto</p>
                                    <p className="font-bold text-cyan-600">{formatCurrency(totalSpent)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-text-main">Por Categoria</h4>
                        </div>
                        <div className="space-y-4">
                            {(Object.entries(categoryTotals) as [ExpenseCategory, number][]).filter(([_, amount]) => amount > 0).map(([cat, amount]) => {
                                const config = categoryConfig[cat];
                                const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2"><span className={`size-2 ${config.bg.replace('bg-', 'bg-').replace('100', '500')} rounded-full`}></span>{config.label}</span>
                                            <span className="font-bold">{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${config.bg.replace('100', '500')} rounded-full`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Exchange Rate Card */}
                    {destination && (
                        <ExchangeRateCard destination={destination} />
                    )}
                </div>

                {/* Right Column - Stats & Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 flex items-center gap-4">
                            <div className="size-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-500">calendar_today</span>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted">Média Diária</p>
                                <p className="font-bold text-lg text-text-main">{formatCurrency(dailyAverage)}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 flex items-center gap-4">
                            <div className="size-12 bg-rose-100 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-rose-500">trending_up</span>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted">Maior Gasto</p>
                                <p className="font-bold text-lg text-text-main">{formatCurrency(maxExpense)}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 flex items-center gap-4">
                            <div className="size-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-500">savings</span>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted">Economia</p>
                                <p className="font-bold text-lg text-green-600">{remainingPercent > 50 ? '+' : ''}{Math.round(remainingPercent - 50)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-text-main text-lg">Últimas Transações</h3>
                            <div className="flex gap-2">
                                {(['todas', 'entradas', 'saidas'] as ExpenseFilter[]).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setExpenseFilter(filter)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${expenseFilter === filter
                                            ? 'bg-text-main text-white'
                                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-3 font-bold">Despesa</th>
                                        <th className="pb-3 font-bold">Categoria</th>
                                        <th className="pb-3 font-bold">Data</th>
                                        <th className="pb-3 font-bold text-right">Valor</th>
                                        <th className="pb-3 font-bold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredExpenses.map((expense) => {
                                        const config = categoryConfig[expense.category];
                                        return (
                                            <tr key={expense.id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-10 ${config.bg} rounded-lg flex items-center justify-center`}>
                                                            <span className={`material-symbols-outlined ${config.color} text-lg`}>{config.icon}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-text-main text-sm">{expense.title}</p>
                                                            <p className="text-xs text-text-muted">{expense.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className={`px-3 py-1 ${config.bg} ${config.color.replace('text-', 'text-').replace('500', '700')} text-xs font-bold rounded-full`}>{config.label}</span></td>
                                                <td className="text-sm text-text-muted">{formatDate(expense.date)}</td>
                                                <td className={`text-right font-bold ${expense.type === 'saida' ? 'text-rose-600' : 'text-green-600'}`}>
                                                    {expense.type === 'saida' ? '-' : '+'} {formatCurrency(expense.amount)}
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        onClick={() => onDeleteExpense?.(expense.id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Excluir despesa"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-text-muted">Mostrando {Math.min(filteredExpenses.length)} de {filteredExpenses.length} transações</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetView;
