import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing localStorage with automatic JSON serialization
 * Provides type-safe localStorage access with React state synchronization
 * 
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [storedValue, setValue, removeValue]
 * 
 * @example
 * const [user, setUser, removeUser] = useLocalStorage('user', null);
 * setUser({ name: 'John', email: 'john@example.com' });
 * removeUser();
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                // Use functional update to ensure we always have the latest state
                setStoredValue((prevValue) => {
                    // Allow value to be a function so we have same API as useState
                    const valueToStore = value instanceof Function ? value(prevValue) : value;

                    // Save to local storage
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    }

                    return valueToStore;
                });
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key] // Removed storedValue from dependencies to prevent stale closures
    );

    // Remove value from localStorage
    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
