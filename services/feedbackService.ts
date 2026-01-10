import { CorrectionFeedback } from '../types';

const STORAGE_KEY = 'porai_feedback_corrections';

export const feedbackService = {
    /**
     * Save user correction feedback
     */
    saveCorrection: (feedback: CorrectionFeedback) => {
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            existing.push(feedback);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            console.log('Feedback saved:', feedback);
        } catch (error) {
            console.error('Error saving feedback:', error);
        }
    },

    /**
     * Get feedback statistics
     */
    getStats: () => {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CorrectionFeedback[];

            const fieldErrors: Record<string, number> = {};
            const typeErrors: Record<string, number> = {};

            data.forEach(item => {
                // Count corrections per field
                item.correctedValue.forEach(fix => {
                    const field = fix.field;
                    fieldErrors[field] = (fieldErrors[field] || 0) + 1;
                });

                // Count per document type
                const type = item.documentType;
                typeErrors[type] = (typeErrors[type] || 0) + 1;
            });

            return { total: data.length, fieldErrors, typeErrors };
        } catch (error) {
            console.error('Error getting feedback stats:', error);
            return { total: 0, fieldErrors: {}, typeErrors: {} };
        }
    },

    /**
     * Clear all feedback data
     */
    clearFeedback: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
