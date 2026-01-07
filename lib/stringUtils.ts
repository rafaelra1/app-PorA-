/**
 * String Utility Functions
 * 
 * Helper functions for string manipulation
 */

/**
 * Truncate string to specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
}

/**
 * Generate initials from a name
 * @param name - Full name
 * @returns Initials (up to 2 characters)
 */
export function getInitials(name: string): string {
    if (!name) return '';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Capitalize first letter of each word
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Generate a random ID
 * @param length - Length of ID (default: 9)
 * @returns Random alphanumeric ID
 */
export function generateId(length = 9): string {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Slugify a string for URLs
 * @param str - String to slugify
 * @returns URL-safe slug
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Check if string is valid email
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
