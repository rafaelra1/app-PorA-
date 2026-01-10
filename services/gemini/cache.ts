/**
 * Cache System for Gemini API Calls
 *
 * Implements a time-based cache with automatic cleanup
 * to reduce API calls and improve response times.
 */

// =============================================================================
// Types
// =============================================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    hits: number;
}

interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
}

export interface CacheOptions {
    /** Time-to-live in milliseconds (default: 30 minutes) */
    ttl?: number;
    /** Maximum cache size (default: 100 entries) */
    maxSize?: number;
    /** Enable statistics tracking (default: true) */
    trackStats?: boolean;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_TTL = 1000 * 60 * 30; // 30 minutes
const DEFAULT_MAX_SIZE = 100;

// =============================================================================
// Cache Class
// =============================================================================

export class GeminiCache<T = unknown> {
    private cache: Map<string, CacheEntry<T>>;
    private ttl: number;
    private maxSize: number;
    private trackStats: boolean;
    private totalHits: number = 0;
    private totalMisses: number = 0;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor(options: CacheOptions = {}) {
        this.cache = new Map();
        this.ttl = options.ttl ?? DEFAULT_TTL;
        this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
        this.trackStats = options.trackStats ?? true;

        // Start automatic cleanup every 5 minutes
        this.startCleanup();
    }

    /**
     * Get a value from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            if (this.trackStats) this.totalMisses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            if (this.trackStats) this.totalMisses++;
            return null;
        }

        // Update hit count
        if (this.trackStats) {
            entry.hits++;
            this.totalHits++;
        }

        return entry.data;
    }

    /**
     * Set a value in cache
     */
    set(key: string, data: T, customTtl?: number): void {
        // Enforce max size with LRU-like eviction
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const now = Date.now();
        const ttl = customTtl ?? this.ttl;

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
            hits: 0
        });
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete a key from cache
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.totalHits = 0;
        this.totalMisses = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.totalHits + this.totalMisses;
        return {
            size: this.cache.size,
            hits: this.totalHits,
            misses: this.totalMisses,
            hitRate: total > 0 ? this.totalHits / total : 0
        };
    }

    /**
     * Evict oldest entry (by timestamp)
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Remove all expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Start automatic cleanup interval
     */
    private startCleanup(): void {
        // Cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Stop automatic cleanup
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
}

// =============================================================================
// Singleton Instance for Gemini
// =============================================================================

const geminiCache = new GeminiCache({
    ttl: DEFAULT_TTL,
    maxSize: DEFAULT_MAX_SIZE
});

// =============================================================================
// Cached Call Helper
// =============================================================================

/**
 * Generate a cache key from function arguments
 */
export function generateCacheKey(prefix: string, ...args: unknown[]): string {
    const argsString = JSON.stringify(args);
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < argsString.length; i++) {
        const char = argsString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `${prefix}:${hash.toString(36)}`;
}

/**
 * Execute a Gemini API call with caching
 *
 * @param key - Unique cache key
 * @param fetcher - Async function to fetch data
 * @param options - Cache options
 * @returns Cached or fresh data
 *
 * @example
 * ```ts
 * const cityGuide = await cachedGeminiCall(
 *   `cityGuide:${cityName}`,
 *   () => geminiService.generateCityGuide(cityName),
 *   { ttl: 60 * 60 * 1000 } // 1 hour
 * );
 * ```
 */
export async function cachedGeminiCall<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number }
): Promise<T> {
    // Check cache first
    const cached = geminiCache.get(key) as T | null;
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    geminiCache.set(key, data, options?.ttl);

    return data;
}

/**
 * Invalidate cache entries by prefix
 *
 * @param prefix - Key prefix to match
 * @returns Number of entries removed
 */
export function invalidateCacheByPrefix(prefix: string): number {
    let removed = 0;

    // Note: This requires iterating all keys, which is not ideal
    // For a production system, consider using a more sophisticated cache
    // that supports prefix-based invalidation
    for (const key of (geminiCache as any).cache.keys()) {
        if (key.startsWith(prefix)) {
            geminiCache.delete(key);
            removed++;
        }
    }

    return removed;
}

/**
 * Get current cache statistics
 */
export function getCacheStats(): CacheStats {
    return geminiCache.getStats();
}

/**
 * Clear all Gemini cache
 */
export function clearGeminiCache(): void {
    geminiCache.clear();
}

// =============================================================================
// Presets for Common Use Cases
// =============================================================================

/** Cache TTL presets */
export const CACHE_TTL = {
    /** 5 minutes - for rapidly changing data */
    SHORT: 5 * 60 * 1000,
    /** 30 minutes - default */
    MEDIUM: 30 * 60 * 1000,
    /** 1 hour - for stable data */
    LONG: 60 * 60 * 1000,
    /** 24 hours - for rarely changing data */
    DAY: 24 * 60 * 60 * 1000
} as const;

export default geminiCache;
