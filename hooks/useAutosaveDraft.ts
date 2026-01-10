import { useEffect, useState, useCallback } from 'react';

interface UseAutosaveDraftOptions<T> {
    key: string;
    onRestore?: (data: T) => void;
    debounceMs?: number;
}

export function useAutosaveDraft<T>({
    key,
    onRestore,
    debounceMs = 2000
}: UseAutosaveDraftOptions<T>) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasDraft, setHasDraft] = useState(false);

    // Check for existing draft on mount
    useEffect(() => {
        const saved = localStorage.getItem(`draft_${key}`);
        if (saved) {
            setHasDraft(true);
        }
    }, [key]);

    const saveDraft = useCallback((data: T) => {
        localStorage.setItem(`draft_${key}`, JSON.stringify(data));
        setLastSaved(new Date());
        setHasDraft(true);
    }, [key]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(`draft_${key}`);
        setLastSaved(null);
        setHasDraft(false);
    }, [key]);

    const loadDraft = useCallback((): T | null => {
        const saved = localStorage.getItem(`draft_${key}`);
        if (saved) {
            try {
                const data = JSON.parse(saved) as T;
                if (onRestore) onRestore(data);
                return data;
            } catch (e) {
                console.error('Error parsing draft:', e);
                return null;
            }
        }
        return null;
    }, [key, onRestore]);

    return {
        saveDraft,
        clearDraft,
        loadDraft,
        lastSaved,
        hasDraft
    };
}
