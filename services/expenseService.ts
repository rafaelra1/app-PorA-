import { supabase } from '../lib/supabase';
import { Expense, ExpenseCategory } from '../types';

export interface CreateExpenseInput {
    tripId: string;
    title: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    type: 'entrada' | 'saida';
    date: string;
    paymentMethod: string;
}

export const fetchExpenses = async (tripId: string): Promise<Expense[]> => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category as ExpenseCategory,
        amount: parseFloat(item.amount),
        type: item.type,
        date: item.date,
        paymentMethod: item.payment_method,
    }));
};

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('expenses')
        .insert({
            trip_id: input.tripId,
            user_id: user.id,
            title: input.title,
            description: input.description,
            category: input.category,
            amount: input.amount,
            type: input.type,
            date: input.date,
            payment_method: input.paymentMethod,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category as ExpenseCategory,
        amount: parseFloat(data.amount),
        type: data.type,
        date: data.date,
        paymentMethod: data.payment_method,
    };
};

export const updateExpense = async (id: string, updates: Partial<CreateExpenseInput>): Promise<void> => {
    const dbUpdates: any = { ...updates };

    // Map camelCase to snake_case for DB
    if (updates.paymentMethod) {
        dbUpdates.payment_method = updates.paymentMethod;
        delete dbUpdates.paymentMethod;
    }
    if (updates.tripId) delete dbUpdates.tripId; // Should not update tripId generally

    const { error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
};

export const deleteExpense = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
