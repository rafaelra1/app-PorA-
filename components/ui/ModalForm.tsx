import React, { useCallback, useState } from 'react';
import Modal from '../trip-details/modals/Modal';
import { Button } from './Base';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface ModalFormProps<T = Record<string, unknown>> {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Form submit handler - receives form data */
    onSubmit: (data: T) => Promise<void> | void;
    /** Form content (children) */
    children: React.ReactNode;
    /** Submit button label */
    submitLabel?: string;
    /** Cancel button label */
    cancelLabel?: string;
    /** Whether form is currently submitting */
    isLoading?: boolean;
    /** Whether submit button should be disabled */
    isSubmitDisabled?: boolean;
    /** Modal size */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Form ID for external submit button */
    formId?: string;
    /** Subtitle text below title */
    subtitle?: string;
    /** Custom footer content (replaces default buttons) */
    customFooter?: React.ReactNode;
    /** Additional content between form and footer */
    footerExtra?: React.ReactNode;
    /** Callback when form is reset */
    onReset?: () => void;
    /** Error message to display */
    error?: string | null;
}

// =============================================================================
// Error Banner Component
// =============================================================================

interface ErrorBannerProps {
    message: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => (
    <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
        <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">error</span>
        <p className="text-sm text-rose-600">{message}</p>
    </div>
);

// =============================================================================
// Default Footer Component
// =============================================================================

interface DefaultFooterProps {
    onCancel: () => void;
    isLoading: boolean;
    isSubmitDisabled: boolean;
    submitLabel: string;
    cancelLabel: string;
    formId: string;
}

const DefaultFooter: React.FC<DefaultFooterProps> = ({
    onCancel,
    isLoading,
    isSubmitDisabled,
    submitLabel,
    cancelLabel,
    formId
}) => (
    <>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
        </Button>
        <Button type="submit" form={formId} disabled={isLoading || isSubmitDisabled}>
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Salvando...
                </span>
            ) : (
                submitLabel
            )}
        </Button>
    </>
);

// =============================================================================
// Main ModalForm Component
// =============================================================================

/**
 * ModalForm - A reusable modal component with integrated form handling
 *
 * Features:
 * - Consistent form submission handling
 * - Loading states
 * - Error display
 * - Auto-generated form IDs
 * - Customizable footer
 * - Accessible
 *
 * @example
 * ```tsx
 * <ModalForm
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Add Item"
 *   onSubmit={handleSubmit}
 *   isLoading={isSubmitting}
 *   error={error}
 * >
 *   <Input label="Name" value={name} onChange={setName} />
 * </ModalForm>
 * ```
 */
function ModalForm<T = Record<string, unknown>>({
    isOpen,
    onClose,
    title,
    onSubmit,
    children,
    submitLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    isLoading = false,
    isSubmitDisabled = false,
    size = 'md',
    formId: externalFormId,
    subtitle,
    customFooter,
    footerExtra,
    onReset,
    error
}: ModalFormProps<T>): React.ReactElement | null {
    const [internalFormId] = useState(() => `modal-form-${Math.random().toString(36).substr(2, 9)}`);
    const formId = externalFormId || internalFormId;

    const handleClose = useCallback(() => {
        if (onReset) {
            onReset();
        }
        onClose();
    }, [onClose, onReset]);

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        // The parent component should handle data extraction from form
        // We just trigger the submit handler
        await onSubmit({} as T);
    }, [onSubmit]);

    const footer = customFooter ?? (
        <DefaultFooter
            onCancel={handleClose}
            isLoading={isLoading}
            isSubmitDisabled={isSubmitDisabled}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            formId={formId}
        />
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            size={size}
            footer={footer}
        >
            {/* Subtitle */}
            {subtitle && (
                <p className="text-sm text-text-muted -mt-4 mb-5">
                    {subtitle}
                </p>
            )}

            {/* Error Banner */}
            {error && <ErrorBanner message={error} />}

            {/* Form Content */}
            <form id={formId} onSubmit={handleFormSubmit} className="space-y-5">
                {children}
            </form>

            {/* Footer Extra Content */}
            {footerExtra}
        </Modal>
    );
}

// =============================================================================
// Utility Hook for ModalForm State
// =============================================================================

export interface UseModalFormOptions<T> {
    initialData: T;
    onSubmit: (data: T) => Promise<void> | void;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Hook to manage ModalForm state
 * Combines form state management with submit handling
 */
export function useModalFormState<T extends Record<string, unknown>>({
    initialData,
    onSubmit,
    onSuccess,
    onError
}: UseModalFormOptions<T>) {
    const [formData, setFormData] = useState<T>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null); // Clear error on change
    }, []);

    const resetForm = useCallback(() => {
        setFormData(initialData);
        setError(null);
    }, [initialData]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(formData);
            onSuccess?.();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar';
            setError(errorMessage);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, onSubmit, onSuccess, onError]);

    return {
        formData,
        setFormData,
        updateField,
        resetForm,
        isSubmitting,
        error,
        setError,
        handleSubmit
    };
}

export default ModalForm;
