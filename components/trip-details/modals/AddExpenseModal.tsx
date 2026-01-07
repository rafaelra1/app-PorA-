import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Select, SelectOption } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Base';
import { ExpenseCategory } from '../../../types';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: ExpenseFormData) => void;
}

interface ExpenseFormData {
    title: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    type: 'entrada' | 'saida';
    date: string;
    paymentMethod: string;
}

interface CategoryConfig {
    value: ExpenseCategory;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

// =============================================================================
// Constants
// =============================================================================

const EXPENSE_CATEGORIES: CategoryConfig[] = [
    { value: 'alimentacao', label: 'Alimentação', icon: 'restaurant', color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-500' },
    { value: 'transporte', label: 'Transporte', icon: 'directions_car', color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
    { value: 'hospedagem', label: 'Hospedagem', icon: 'hotel', color: 'text-indigo-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-500' },
    { value: 'lazer', label: 'Lazer', icon: 'confirmation_number', color: 'text-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
    { value: 'compras', label: 'Compras', icon: 'shopping_bag', color: 'text-pink-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-500' },
    { value: 'outros', label: 'Outros', icon: 'more_horiz', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-500' },
];

const PAYMENT_METHODS: SelectOption[] = [
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito' },
    { value: 'Dinheiro', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'Apple Pay', label: 'Apple Pay' },
    { value: 'Google Pay', label: 'Google Pay' },
];

const INITIAL_FORM_STATE: Omit<ExpenseFormData, 'amount'> & { amount: string } = {
    title: '',
    description: '',
    category: 'outros',
    amount: '',
    type: 'saida',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cartão de Crédito',
};

// =============================================================================
// Helper Components
// =============================================================================

interface TypeToggleProps {
    type: 'entrada' | 'saida';
    onChange: (type: 'entrada' | 'saida') => void;
}

const TypeToggle: React.FC<TypeToggleProps> = ({ type, onChange }) => (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
            type="button"
            onClick={() => onChange('saida')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1 ${type === 'saida' ? 'bg-white shadow-sm text-rose-600' : 'text-text-muted'
                }`}
        >
            <span className="material-symbols-outlined text-base">remove_circle</span>
            Saída
        </button>
        <button
            type="button"
            onClick={() => onChange('entrada')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1 ${type === 'entrada' ? 'bg-white shadow-sm text-green-600' : 'text-text-muted'
                }`}
        >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Entrada
        </button>
    </div>
);

interface CategorySelectorProps {
    selected: ExpenseCategory;
    onChange: (category: ExpenseCategory) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onChange }) => (
    <div>
        <label className="block text-sm font-bold text-text-main mb-2">Categoria</label>
        <div className="grid grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
                <button
                    key={cat.value}
                    type="button"
                    onClick={() => onChange(cat.value)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selected === cat.value
                            ? `${cat.borderColor} ${cat.bgColor}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                    <span className="text-xs font-bold text-text-main">{cat.label}</span>
                </button>
            ))}
        </div>
    </div>
);

// =============================================================================
// Main Component
// =============================================================================

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const updateField = useCallback(<K extends keyof typeof formData>(
        field: K,
        value: typeof formData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.amount) return;

        onAdd({
            ...formData,
            amount: parseFloat(formData.amount),
        });

        resetForm();
        onClose();
    }, [formData, onAdd, onClose, resetForm]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const footer = (
        <>
            <Button variant="outline" onClick={handleClose}>
                Cancelar
            </Button>
            <Button type="submit" form="expense-form">
                Adicionar
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Nova Despesa"
            size="sm"
            footer={footer}
        >
            <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Type Toggle */}
                <TypeToggle
                    type={formData.type}
                    onChange={(type) => updateField('type', type)}
                />

                {/* Title */}
                <Input
                    label="Título"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Ex: Jantar no restaurante"
                    required
                    fullWidth
                />

                {/* Amount */}
                <Input
                    label="Valor"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="0,00"
                    required
                    fullWidth
                    leftIcon={<span className="font-bold text-text-muted">R$</span>}
                />

                {/* Category */}
                <CategorySelector
                    selected={formData.category}
                    onChange={(category) => updateField('category', category)}
                />

                {/* Date */}
                <Input
                    label="Data"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    fullWidth
                />

                {/* Payment Method */}
                <Select
                    label="Método de Pagamento"
                    value={formData.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    options={PAYMENT_METHODS}
                    fullWidth
                />

                {/* Description */}
                <Textarea
                    label="Descrição (opcional)"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Adicione detalhes sobre esta despesa..."
                    rows={2}
                    fullWidth
                />
            </form>
        </Modal>
    );
};

export default AddExpenseModal;
