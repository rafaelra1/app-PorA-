/**
 * Retry Utility with Exponential Backoff
 *
 * Provides robust retry logic for API calls with configurable
 * backoff strategy, max retries, and error handling.
 */

// =============================================================================
// Types
// =============================================================================

export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Base delay in milliseconds (default: 1000) */
    baseDelay?: number;
    /** Maximum delay cap in milliseconds (default: 30000) */
    maxDelay?: number;
    /** Multiplier for exponential backoff (default: 2) */
    backoffMultiplier?: number;
    /** Whether to add jitter to delay (default: true) */
    jitter?: boolean;
    /** Callback for each retry attempt */
    onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
    /** Function to determine if error is retryable (default: all errors) */
    isRetryable?: (error: Error) => boolean;
    /** Abort signal to cancel retries */
    signal?: AbortSignal;
}

export interface RetryResult<T> {
    /** The successful result */
    data: T;
    /** Number of attempts made */
    attempts: number;
    /** Total time spent including retries */
    totalTime: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'signal' | 'isRetryable'>> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    multiplier: number,
    jitter: boolean
): number {
    // Exponential backoff: baseDelay * multiplier^attempt
    let delay = baseDelay * Math.pow(multiplier, attempt);

    // Cap at max delay
    delay = Math.min(delay, maxDelay);

    // Add jitter (random +/- 25%)
    if (jitter) {
        const jitterFactor = 0.25;
        const jitterRange = delay * jitterFactor;
        delay = delay + (Math.random() * 2 - 1) * jitterRange;
    }

    return Math.round(delay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, ms);

        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        }
    });
}

/**
 * Default function to determine if an error is retryable
 */
function defaultIsRetryable(error: Error): boolean {
    // Don't retry on validation errors or client errors
    if (error.name === 'ValidationError') return false;
    if (error.message.includes('400')) return false;
    if (error.message.includes('401')) return false;
    if (error.message.includes('403')) return false;
    if (error.message.includes('404')) return false;

    // Retry on network errors and server errors
    if (error.name === 'NetworkError') return true;
    if (error.message.includes('500')) return true;
    if (error.message.includes('502')) return true;
    if (error.message.includes('503')) return true;
    if (error.message.includes('504')) return true;
    if (error.message.includes('timeout')) return true;
    if (error.message.includes('ECONNRESET')) return true;
    if (error.message.includes('ETIMEDOUT')) return true;

    // Default to retrying
    return true;
}

// =============================================================================
// Main Retry Function
// =============================================================================

/**
 * Execute a function with automatic retry and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with result and metadata
 *
 * @example
 * ```ts
 * // Basic usage
 * const result = await withRetry(() => fetchUserData(userId));
 *
 * // With custom options
 * const result = await withRetry(
 *   () => uploadFile(file),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 2000,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry ${attempt}: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = DEFAULT_OPTIONS.maxRetries,
        baseDelay = DEFAULT_OPTIONS.baseDelay,
        maxDelay = DEFAULT_OPTIONS.maxDelay,
        backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
        jitter = DEFAULT_OPTIONS.jitter,
        onRetry,
        isRetryable = defaultIsRetryable,
        signal
    } = options;

    let lastError: Error;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Check if aborted
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        try {
            const result = await fn();
            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if we should retry
            const isLastAttempt = attempt === maxRetries;
            const shouldRetry = !isLastAttempt && isRetryable(lastError);

            if (!shouldRetry) {
                throw lastError;
            }

            // Calculate delay for next attempt
            const delay = calculateDelay(
                attempt,
                baseDelay,
                maxDelay,
                backoffMultiplier,
                jitter
            );

            // Call retry callback
            if (onRetry) {
                onRetry(attempt + 1, lastError, delay);
            }

            // Wait before next attempt
            await sleep(delay, signal);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
}

/**
 * Execute a function with retry and return detailed result
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with result and metadata
 */
export async function withRetryDetailed<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    const wrappedFn = async () => {
        attempts++;
        return fn();
    };

    const data = await withRetry(wrappedFn, options);

    return {
        data,
        attempts,
        totalTime: Date.now() - startTime
    };
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Retry with quick backoff (shorter delays)
 */
export function withQuickRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    return withRetry(fn, {
        maxRetries,
        baseDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 1.5
    });
}

/**
 * Retry with aggressive backoff (longer delays, more retries)
 */
export function withAggressiveRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 5
): Promise<T> {
    return withRetry(fn, {
        maxRetries,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 2.5
    });
}

/**
 * Retry only on network errors
 */
export function withNetworkRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    return withRetry(fn, {
        maxRetries,
        isRetryable: (error) => {
            const message = error.message.toLowerCase();
            return (
                message.includes('network') ||
                message.includes('timeout') ||
                message.includes('econnreset') ||
                message.includes('etimedout') ||
                message.includes('fetch')
            );
        }
    });
}

export default withRetry;
