import { useState, useEffect, useCallback } from 'react';
import * as idb from '../utils/indexedDB';

/**
 * Custom hook for managing IndexedDB state with React
 * Useful for storing large items (images, large lists) that exceed localStorage limits
 */
export function useIndexedDB<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial value
    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                const item = await idb.get<T>(key);
                if (isMounted) {
                    if (item !== undefined) {
                        setStoredValue(item);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error(`Error loading IndexedDB key "${key}":`, error);
                if (isMounted) setIsLoading(false);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [key]);

    // Setter function
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                // Use functional update to ensure we always have the latest state
                setStoredValue((prevValue) => {
                    const valueToStore = value instanceof Function ? value(prevValue) : value;

                    // Save to IndexedDB
                    idb.set(key, valueToStore).catch(err =>
                        console.error(`Error saving to IndexedDB "${key}":`, err)
                    );

                    return valueToStore;
                });
            } catch (error) {
                console.error(`Error setting IndexedDB key "${key}":`, error);
            }
        },
        [key]
    );

    return [storedValue, setValue, isLoading];
}
