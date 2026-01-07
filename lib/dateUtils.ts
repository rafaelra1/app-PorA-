/**
 * Date Utility Functions
 * 
 * Helper functions for date formatting and manipulation
 */

/**
 * Parse DD/MM/YYYY format to YYYY-MM-DD for input fields
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Date string in YYYY-MM-DD format
 */
export function parseDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY for display
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date string in DD/MM/YYYY format
 */
export function formatToDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }
    return dateStr;
}

/**
 * Calculate duration in days between two dates
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Number of days or null if invalid dates
 */
export function calculateDuration(startDate: string, endDate: string): number | null {
    if (!startDate || !endDate) return null;

    let startStr = startDate;
    let endStr = endDate;

    if (startDate.includes('/')) startStr = parseDisplayDate(startDate);
    if (endDate.includes('/')) endStr = parseDisplayDate(endDate);

    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays : 0;
}

/**
 * Format date to locale string
 * @param dateStr - Date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
    dateStr: string,
    options?: Intl.DateTimeFormatOptions // options kept for signature compatibility but ignored for the standard format
): string {
    if (!dateStr) return '';
    try {
        // Normalize date string to avoid timezone issues
        // When parsing YYYY-MM-DD, JavaScript treats it as UTC midnight,
        // which can result in the previous day in negative UTC offset timezones (like Brazil)
        let normalizedDateStr = dateStr;

        // If it's YYYY-MM-DD format (from date input), add time to force local interpretation
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            normalizedDateStr = dateStr + 'T12:00:00';
        }
        // If it's DD/MM/YYYY format, parse manually
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('/');
            return `${d}/${m}/${y}`; // Already in correct format
        }

        const date = new Date(normalizedDateStr);
        if (isNaN(date.getTime())) return dateStr;

        // Force DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

/**
 * Check if a date is in the past
 * @param dateStr - Date string
 * @returns True if date is in the past
 */
export function isPast(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date < new Date();
}

/**
 * Check if a date is in the future
 * @param dateStr - Date string
 * @returns True if date is in the future
 */
export function isFuture(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date > new Date();
}

/**
 * Format date to short locale string (e.g., "seg, 15 jan")
 * @param dateStr - Date string
 * @returns Formatted short date string
 */
export function formatShortDate(dateStr: string): string {
    // Standardize even short dates to DD/MM/YYYY per user request "Padronize todos os formatos de data"
    return formatDate(dateStr);
}

/**
 * Format a date range (e.g., "15 jan - 20 jan 2024")
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return '';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Add days to a date
 * @param dateStr - Date string
 * @param days - Number of days to add
 * @returns New date string in YYYY-MM-DD format
 */
export function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Calculate nights between two dates
 * @param checkIn - Check-in date string
 * @param checkOut - Check-out date string  
 * @returns Number of nights
 */
export function calculateNights(checkIn: string, checkOut: string): number {
    const duration = calculateDuration(checkIn, checkOut);
    return duration !== null && duration > 0 ? duration : 1;
}

/**
 * Calculate days remaining until a date
 * @param dateStr - Target date string (YYYY-MM-DD or DD/MM/YYYY)
 * @returns Number of days remaining (positive) or 0 if today/past
 */
export function calculateDaysRemaining(dateStr: string): number {
    if (!dateStr) return 0;

    // Normalize to YYYY-MM-DD
    let targetDateStr = dateStr;
    if (dateStr.includes('/')) {
        targetDateStr = parseDisplayDate(dateStr);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDateStr + 'T00:00:00');
    if (isNaN(target.getTime())) return 0;

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
}

// ============================================================
// DATABASE CONVERSION FUNCTIONS (centralized for Supabase)
// ============================================================

/**
 * Convert DD/MM/YYYY to ISO format (YYYY-MM-DD) for database storage
 * Use this when saving dates to Supabase
 * 
 * @param dateStr - Date in DD/MM/YYYY format (or ISO)
 * @returns Date in YYYY-MM-DD format or null if invalid/empty
 * 
 * @example
 * toISODate("23/01/2026") → "2026-01-23"
 * toISODate("2026-01-23") → "2026-01-23"
 */
export function toISODate(dateStr: string): string | null {
    if (!dateStr) return null;

    // Already ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.split('T')[0];
    }

    // DD/MM/YYYY format - convert to ISO
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }

    // Try parsing as Date object (fallback)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return null;
}

/**
 * Convert ISO format (YYYY-MM-DD) to DD/MM/YYYY for display
 * Use this when reading dates from Supabase
 * 
 * @param dateStr - Date in YYYY-MM-DD format (or already DD/MM/YYYY)
 * @returns Date in DD/MM/YYYY format or empty string if invalid
 * 
 * @example
 * fromISODate("2026-01-23") → "23/01/2026"
 * fromISODate("23/01/2026") → "23/01/2026" (passthrough)
 */
export function fromISODate(dateStr: string): string {
    if (!dateStr) return '';

    // Already DD/MM/YYYY format - passthrough
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        return dateStr;
    }

    // ISO format (YYYY-MM-DD or with timestamp) - convert to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const [year, month, day] = dateStr.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    }

    return '';
}
