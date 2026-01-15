import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for responsive design based on CSS media queries
 * 
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query: string): boolean {
    // SSR-safe initial value
    const getMatches = useCallback((): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.matchMedia(query).matches;
    }, [query]);

    const [matches, setMatches] = useState<boolean>(getMatches);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQueryList = window.matchMedia(query);

        // Initial check
        setMatches(mediaQueryList.matches);

        // Handler for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Modern API (addEventListener) with fallback (addListener)
        if (mediaQueryList.addEventListener) {
            mediaQueryList.addEventListener('change', handleChange);
        } else {
            // Deprecated but needed for older Safari
            mediaQueryList.addListener(handleChange);
        }

        return () => {
            if (mediaQueryList.removeEventListener) {
                mediaQueryList.removeEventListener('change', handleChange);
            } else {
                mediaQueryList.removeListener(handleChange);
            }
        };
    }, [query]);

    return matches;
}

/**
 * Predefined breakpoint hooks for common use cases
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export default useMediaQuery;
