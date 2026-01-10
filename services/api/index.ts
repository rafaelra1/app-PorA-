/**
 * API Services - Entry Point
 *
 * Centralized exports for all API-related utilities and services.
 */

// Core utilities
export { default as ApiClient, executeQuery, normalizeError, isNetworkError, isAuthError, getCurrentUserId, requireAuth, buildSelectQuery } from './client';
export type { ApiResponse, ApiError, RequestConfig } from './client';

// Retry utilities
export { withRetry, withRetryDetailed, withQuickRetry, withAggressiveRetry, withNetworkRetry } from './retry';
export type { RetryOptions, RetryResult } from './retry';
