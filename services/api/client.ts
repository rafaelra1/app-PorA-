/**
 * API Client Configuration
 *
 * Base configuration and utilities for all API calls.
 * Centralizes error handling, retry logic, and request configuration.
 */

import { supabase } from '../../lib/supabase';
import { withRetry, RetryOptions } from './retry';

// =============================================================================
// Types
// =============================================================================

export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
    status: number;
}

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}

export interface RequestConfig {
    /** Whether to use retry logic (default: true) */
    retry?: boolean;
    /** Custom retry options */
    retryOptions?: RetryOptions;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Normalize error to ApiError format
 */
export function normalizeError(error: unknown): ApiError {
    if (error instanceof Error) {
        return {
            code: error.name || 'UNKNOWN_ERROR',
            message: error.message,
            details: error
        };
    }

    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        return {
            code: String(err.code || 'UNKNOWN_ERROR'),
            message: String(err.message || 'An unknown error occurred'),
            details: error
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: String(error),
        details: error
    };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('econnreset')
        );
    }
    return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('401') ||
            message.includes('unauthorized') ||
            message.includes('jwt') ||
            message.includes('token')
        );
    }
    return false;
}

// =============================================================================
// Supabase Helpers
// =============================================================================

/**
 * Execute a Supabase query with optional retry
 */
export async function executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    config: RequestConfig = {}
): Promise<ApiResponse<T>> {
    const { retry = true, retryOptions, signal } = config;

    const execute = async (): Promise<ApiResponse<T>> => {
        const { data, error } = await queryFn();

        if (error) {
            return {
                data: null,
                error: normalizeError(error),
                status: 500
            };
        }

        return {
            data,
            error: null,
            status: 200
        };
    };

    if (retry) {
        try {
            return await withRetry(execute, {
                maxRetries: 2,
                baseDelay: 1000,
                ...retryOptions,
                signal
            });
        } catch (error) {
            return {
                data: null,
                error: normalizeError(error),
                status: 500
            };
        }
    }

    return execute();
}

/**
 * Get current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
}

/**
 * Ensure user is authenticated before making a request
 */
export async function requireAuth(): Promise<string> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    return userId;
}

// =============================================================================
// Request Builders
// =============================================================================

/**
 * Build a SELECT query with common options
 */
export function buildSelectQuery<T>(
    table: string,
    options: {
        columns?: string;
        filters?: Record<string, unknown>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        offset?: number;
    } = {}
) {
    let query = supabase
        .from(table)
        .select(options.columns || '*');

    // Apply filters
    if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        }
    }

    // Apply ordering
    if (options.orderBy) {
        query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
        });
    }

    // Apply pagination
    if (options.limit) {
        query = query.limit(options.limit);
    }

    if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    return query;
}

// =============================================================================
// API Client Class
// =============================================================================

/**
 * Base API client for Supabase operations
 */
export class ApiClient {
    private userId: string | null = null;

    /**
     * Initialize client with user ID
     */
    async init(): Promise<void> {
        this.userId = await getCurrentUserId();
    }

    /**
     * Get user ID, throwing if not authenticated
     */
    protected getUserId(): string {
        if (!this.userId) {
            throw new Error('API client not initialized or user not authenticated');
        }
        return this.userId;
    }

    /**
     * Generic SELECT operation
     */
    protected async select<T>(
        table: string,
        options: {
            columns?: string;
            filters?: Record<string, unknown>;
            orderBy?: { column: string; ascending?: boolean };
            limit?: number;
        } = {},
        config?: RequestConfig
    ): Promise<ApiResponse<T[]>> {
        return executeQuery<T[]>(
            () => buildSelectQuery(table, {
                ...options,
                filters: {
                    ...options.filters,
                    user_id: this.getUserId()
                }
            }),
            config
        );
    }

    /**
     * Generic INSERT operation
     */
    protected async insert<T>(
        table: string,
        data: Record<string, unknown>,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return executeQuery<T>(
            () => supabase
                .from(table)
                .insert({
                    ...data,
                    user_id: this.getUserId()
                })
                .select()
                .single(),
            config
        );
    }

    /**
     * Generic UPDATE operation
     */
    protected async update<T>(
        table: string,
        id: string,
        data: Record<string, unknown>,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return executeQuery<T>(
            () => supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .eq('user_id', this.getUserId())
                .select()
                .single(),
            config
        );
    }

    /**
     * Generic DELETE operation
     */
    protected async delete(
        table: string,
        id: string,
        config?: RequestConfig
    ): Promise<ApiResponse<null>> {
        return executeQuery<null>(
            () => supabase
                .from(table)
                .delete()
                .eq('id', id)
                .eq('user_id', this.getUserId()),
            config
        );
    }
}

export default ApiClient;
