import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Base';
import { ExpenseCategory } from '../../../types';
import { expenseSchema } from '../../../lib/validations/schemas';
import { useToast } from '../../../contexts/ToastContext';
import { useAutosaveDraft } from '../../../hooks/useAutosaveDraft';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../../config/constants';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: any) => void;
}

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
    const { showToast } = useToast();
    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            title: '',
            description: '',
            category: 'outros',
            amount: 0,
            type: 'saida' as 'entrada' | 'saida',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cartão de Crédito',
        }
    });

    const formData = watch();

    // Autosave Integration
    const { saveDraft, clearDraft, loadDraft, hasDraft, lastSaved } = useAutosaveDraft({
        key: 'new_expense',
        onRestore: (data: any) => {
            reset(data);
            showToast("Rascunho de despesa restaurado!", "info");
        }
    });

    // Debounced Save
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            if (formData.title || (formData.amount as number) > 0) {
                saveDraft(formData);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [formData, isOpen, saveDraft]);

    // Restore Prompt
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    useEffect(() => {
        if (isOpen && hasDraft && !formData.title) {
            setShowRestorePrompt(true);
        }
    }, [isOpen, hasDraft, formData.title]);

    const handleClose = useCallback(() => {
        reset();
        onClose();
        setShowRestorePrompt(false);
    }, [onClose, reset]);

    const onSubmit = (data: any) => {
        try {
            onAdd(data);
            showToast("Despesa adicionada!", "success");
            clearDraft();
            handleClose();
        } catch (err) {
            showToast("Erro ao adicionar despesa.", "error");
        }
    };

    const footer = (
        <div className="flex items-center w-full">
            <div className="flex-1 flex items-center gap-2">
                {lastSaved && (
                    <div className="flex items-center gap-1 text-green-600 animate-in fade-in duration-500">
                        <span className="material-symbols-outlined text-xs">cloud_done</span>
                        <span className="text-[8px] font-bold uppercase">Salvo</span>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" form="expense-form" disabled={isSubmitting}>
                    {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Nova Despesa"
            size="sm"
            footer={footer}
        >
            {showRestorePrompt && (
                <div className="bg-indigo-50 px-4 py-2 mb-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <span className="text-[10px] font-bold text-indigo-900">Restaurar rascunho anterior?</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { loadDraft(); setShowRestorePrompt(false); }}
                            className="text-[10px] font-extrabold uppercase bg-white px-2 py-1 rounded-lg text-indigo-600 shadow-sm"
                        >
                            Sim
                        </button>
                        <button
                            onClick={() => { clearDraft(); setShowRestorePrompt(false); }}
                            className="text-[10px] font-extrabold uppercase text-indigo-400"
                        >
                            Não
                        </button>
                    </div>
                </div>
            )}

            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isSubmitting && "Adicionando despesa..."}
            </div>

            <form
                id="expense-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                aria-busy={isSubmitting}
            >
                {/* Type Toggle */}
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <TypeToggle
                            type={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                {/* Title */}
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Título"
                            error={errors.title?.message as string}
                            placeholder="Ex: Jantar no restaurante"
                            required
                            fullWidth
                        />
                    )}
                />

                {/* Amount */}
                <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            value={field.value as any}
                            label="Valor"
                            type="number"
                            step="0.01"
                            error={errors.amount?.message as string}
                            placeholder="0,00"
                            required
                            fullWidth
                            leftIcon={<span className="font-bold text-text-muted">R$</span>}
                        />
                    )}
                />

                {/* Category */}
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <CategorySelector
                            selected={field.value as any}
                            onChange={field.onChange}
                        />
                    )}
                />

                {/* Date */}
                <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Data"
                            type="date"
                            error={errors.date?.message as string}
                            fullWidth
                            required
                        />
                    )}
                />

                {/* Payment Method */}
                <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                        <Select
                            {...field}
                            label="Método de Pagamento"
                            options={PAYMENT_METHODS}
                            fullWidth
                        />
                    )}
                />

                {/* Description */}
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <Textarea
                            {...field}
                            label="Descrição (opcional)"
                            placeholder="Adicione detalhes sobre esta despesa..."
                            rows={2}
                            fullWidth
                        />
                    )}
                />
            </form>
        </Modal>
    );
};

export default AddExpenseModal;
