import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import {
    Transaction,
    TripParticipant,
    DistributionMethod,
    Payer,
    SplitDetail,
    ExpenseCategory
} from '../../../types';
import { calculateSplitBreakdown, formatCurrency } from '../../../utils/finance';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
    participants: TripParticipant[];
    currentUserId: string;
    tripId: string;
    baseCurrency?: string;
}

const CURRENCIES = [
    { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧' },
];

const CATEGORIES: { id: string; label: string; icon: string }[] = [
    { id: 'alimentacao', label: 'Alimentação', icon: 'restaurant' },
    { id: 'transporte', label: 'Transporte', icon: 'directions_car' },
    { id: 'hospedagem', label: 'Hospedagem', icon: 'hotel' },
    { id: 'lazer', label: 'Lazer', icon: 'confirmation_number' },
    { id: 'compras', label: 'Compras', icon: 'shopping_bag' },
    { id: 'outros', label: 'Outros', icon: 'more_horiz' },
];

const ExpenseModal: React.FC<ExpenseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    participants,
    currentUserId,
    tripId,
    baseCurrency = 'BRL'
}) => {
    // Form State
    const [amount, setAmount] = useState<string>('');
    const [currency, setCurrency] = useState<string>(baseCurrency);
    const [description, setDescription] = useState<string>('');
    const [categoryId, setCategoryId] = useState<string>('outros');
    const [notes, setNotes] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Payer Selection
    const [selectedPayers, setSelectedPayers] = useState<string[]>([currentUserId]);
    const [payerAmounts, setPayerAmounts] = useState<Record<string, number>>({});
    const [showPayerDropdown, setShowPayerDropdown] = useState(false);

    // Split Selection
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>('EQUAL');
    const [involvedParticipants, setInvolvedParticipants] = useState<string[]>(
        participants.map(p => p.id)
    );
    const [customSplitValues, setCustomSplitValues] = useState<Record<string, number>>({});
    const [showSplitDropdown, setShowSplitDropdown] = useState(false);

    // Exchange rate (mock - in production, fetch from API)
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    useEffect(() => {
        // Mock exchange rates
        const rates: Record<string, number> = {
            BRL: 1,
            USD: 5.15,
            EUR: 5.56,
            GBP: 6.45
        };
        setExchangeRate(rates[currency] ?? 1);
    }, [currency]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedPayers([currentUserId]);
            setInvolvedParticipants(participants.map(p => p.id));
            setDistributionMethod('EQUAL');
            setCustomSplitValues({});
        }
    }, [isOpen, currentUserId, participants]);

    const numericAmount = parseFloat(amount) || 0;

    // Calculate split preview
    const splitPreview = useMemo(() => {
        const involvedParts = participants.filter(p => involvedParticipants.includes(p.id));
        return calculateSplitBreakdown(numericAmount, involvedParts, distributionMethod, customSplitValues);
    }, [numericAmount, participants, involvedParticipants, distributionMethod, customSplitValues]);

    // Get payer names for display
    const payerNames = useMemo(() => {
        if (selectedPayers.length === 1) {
            const payer = participants.find(p => p.id === selectedPayers[0]);
            return payer?.id === currentUserId ? 'Você' : payer?.name ?? 'Alguém';
        }
        return `${selectedPayers.length} pessoas`;
    }, [selectedPayers, participants, currentUserId]);

    // Get split summary for display
    const splitSummary = useMemo(() => {
        if (involvedParticipants.length === participants.length) {
            return 'Todos';
        }
        return `${involvedParticipants.length} pessoas`;
    }, [involvedParticipants, participants]);

    const handlePayerToggle = (userId: string) => {
        setSelectedPayers(prev => {
            if (prev.includes(userId)) {
                // Don't allow removing all payers
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== userId);
            }
            return [...prev, userId];
        });
    };

    const handleParticipantToggle = (userId: string) => {
        setInvolvedParticipants(prev => {
            if (prev.includes(userId)) {
                // Don't allow removing all participants
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== userId);
            }
            return [...prev, userId];
        });
    };

    const handleSave = () => {
        if (!numericAmount || !description.trim()) return;

        // Build payers array
        const payers: Payer[] = selectedPayers.map(userId => ({
            userId,
            amountPaid: selectedPayers.length === 1
                ? numericAmount
                : (payerAmounts[userId] ?? numericAmount / selectedPayers.length)
        }));

        // Build split breakdown
        const splitBreakdown: SplitDetail[] = splitPreview;

        const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
            tripId,
            type: 'EXPENSE',
            description: description.trim(),
            date: new Date(date).toISOString(),
            categoryId,
            amountOriginal: numericAmount,
            currencyOriginal: currency,
            exchangeRateToBase: currency !== baseCurrency ? exchangeRate : undefined,
            amountInBase: currency !== baseCurrency ? numericAmount * exchangeRate : numericAmount,
            distributionMethod,
            payers,
            splitBreakdown,
            notes: notes.trim() || undefined,
            createdBy: currentUserId
        };

        onSave(transaction);
        handleClose();
    };

    const handleClose = () => {
        setAmount('');
        setDescription('');
        setNotes('');
        setCategoryId('outros');
        setDate(new Date().toISOString().split('T')[0]);
        onClose();
    };

    if (!isOpen) return null;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Nova Despesa</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Amount & Currency Row */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Valor</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                    {CURRENCIES.find(c => c.code === currency)?.symbol}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div className="w-28">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Moeda</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full py-4 px-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                {CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Jantar no restaurante"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Natural Language Sentence Builder */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                        <p className="text-gray-700 font-medium">
                            Pago por{' '}
                            <button
                                onClick={() => setShowPayerDropdown(!showPayerDropdown)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-indigo-200 font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                {selectedPayers.length === 1 && (
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                        {getInitials(participants.find(p => p.id === selectedPayers[0])?.name ?? '')}
                                    </div>
                                )}
                                {payerNames}
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                            {' '}e dividido por{' '}
                            <button
                                onClick={() => setShowSplitDropdown(!showSplitDropdown)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-indigo-200 font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                {splitSummary}
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                            .
                        </p>

                        {/* Payer Dropdown */}
                        {showPayerDropdown && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 shadow-lg">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quem pagou?</p>
                                <div className="space-y-2">
                                    {participants.map(p => (
                                        <label
                                            key={p.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPayers.includes(p.id)}
                                                onChange={() => handlePayerToggle(p.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                {getInitials(p.name)}
                                            </div>
                                            <span className="font-medium text-gray-700">
                                                {p.id === currentUserId ? 'Você' : p.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Split Dropdown */}
                        {showSplitDropdown && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 shadow-lg">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dividido por</p>

                                {/* Distribution Method */}
                                <div className="flex gap-2 mb-3">
                                    {(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'] as DistributionMethod[]).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setDistributionMethod(method)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${distributionMethod === method
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {method === 'EQUAL' && 'Igual'}
                                            {method === 'EXACT' && 'Valor'}
                                            {method === 'PERCENTAGE' && '%'}
                                            {method === 'SHARES' && 'Cotas'}
                                        </button>
                                    ))}
                                </div>

                                {/* Participant Selection */}
                                <div className="space-y-2">
                                    {participants.map(p => (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={involvedParticipants.includes(p.id)}
                                                onChange={() => handleParticipantToggle(p.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                {getInitials(p.name)}
                                            </div>
                                            <span className="font-medium text-gray-700 flex-1">
                                                {p.id === currentUserId ? 'Você' : p.name}
                                            </span>

                                            {/* Custom value input for non-EQUAL methods */}
                                            {distributionMethod !== 'EQUAL' && involvedParticipants.includes(p.id) && (
                                                <input
                                                    type="number"
                                                    value={customSplitValues[p.id] ?? ''}
                                                    onChange={(e) => setCustomSplitValues(prev => ({
                                                        ...prev,
                                                        [p.id]: parseFloat(e.target.value) || 0
                                                    }))}
                                                    placeholder={distributionMethod === 'PERCENTAGE' ? '%' : distributionMethod === 'SHARES' ? 'cotas' : '0.00'}
                                                    className="w-20 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            )}

                                            {/* Show calculated share for EQUAL method */}
                                            {distributionMethod === 'EQUAL' && involvedParticipants.includes(p.id) && numericAmount > 0 && (
                                                <span className="text-sm font-medium text-gray-500">
                                                    {formatCurrency(numericAmount / involvedParticipants.length, currency)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Categoria</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${categoryId === cat.id
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">{cat.icon}</span>
                                    <span className="text-xs font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Notas (opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Adicione observações..."
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Split Preview */}
                    {numericAmount > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm font-bold text-gray-700 mb-3">Resumo da divisão</p>
                            <div className="space-y-2">
                                {splitPreview.filter(s => s.isInvolved).map(split => {
                                    const participant = participants.find(p => p.id === split.userId);
                                    return (
                                        <div key={split.userId} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                    {getInitials(participant?.name ?? '')}
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {split.userId === currentUserId ? 'Você' : participant?.name}
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {formatCurrency(split.owedShare, currency)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!numericAmount || !description.trim()}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">check</span>
                        Salvar Despesa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpenseModal;
