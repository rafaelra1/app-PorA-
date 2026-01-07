import { useState, useCallback } from 'react';

/**
 * Generic form state management hook
 * Provides consistent form handling across all modal forms
 * 
 * @template T - The shape of the form data
 * @param initialState - Initial form state
 * @returns Form state and helper functions
 */
export function useFormState<T extends Record<string, unknown>>(initialState: T) {
    const [formData, setFormData] = useState<T>(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [isDirty, setIsDirty] = useState(false);

    /**
     * Update a single form field
     */
    const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    /**
     * Update multiple form fields at once
     */
    const updateFields = useCallback((updates: Partial<T>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    }, []);

    /**
     * Reset form to initial state
     */
    const resetForm = useCallback(() => {
        setFormData(initialState);
        setErrors({});
        setIsDirty(false);
    }, [initialState]);

    /**
     * Set a validation error for a field
     */
    const setFieldError = useCallback((field: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    /**
     * Clear all errors
     */
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * Check if form has any errors
     */
    const hasErrors = Object.keys(errors).length > 0;

    /**
     * Get error for a specific field
     */
    const getFieldError = useCallback((field: keyof T) => errors[field], [errors]);

    return {
        formData,
        errors,
        isDirty,
        hasErrors,
        updateField,
        updateFields,
        resetForm,
        setFieldError,
        clearErrors,
        getFieldError,
        setFormData,
    };
}

/**
 * Hook for handling form submission
 * Provides loading state and error handling
 * 
 * @param onSubmit - Async function to call on submit
 * @param onSuccess - Optional callback after successful submission
 * @param onError - Optional callback on error
 */
export function useFormSubmit<T>(
    onSubmit: (data: T) => Promise<void> | void,
    options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
        resetOnSuccess?: boolean;
    }
) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (data: T, resetForm?: () => void) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await onSubmit(data);
            if (options?.resetOnSuccess && resetForm) {
                resetForm();
            }
            options?.onSuccess?.();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setSubmitError(errorMessage);
            options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            setIsSubmitting(false);
        }
    }, [onSubmit, options]);

    return {
        isSubmitting,
        submitError,
        handleSubmit,
        clearSubmitError: () => setSubmitError(null),
    };
}

/**
 * Hook for managing modal open/close state with form reset
 * 
 * @param resetForm - Function to reset the form state
 * @param onClose - External close callback
 */
export function useModalForm(
    resetForm: () => void,
    onClose: () => void
) {
    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    return { handleClose };
}

export default { useFormState, useFormSubmit, useModalForm };
