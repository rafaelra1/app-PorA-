import React from 'react';

interface NarrativeBlockProps {
    content: string;
    variant?: 'intro' | 'closing' | 'section';
}

/**
 * NarrativeBlock - Renders editorial narrative text with appropriate styling.
 */
const NarrativeBlock: React.FC<NarrativeBlockProps> = ({ content, variant = 'section' }) => {
    const variantStyles = {
        intro: 'text-lg text-gray-700 leading-relaxed bg-white p-6 rounded-2xl border border-gray-100 shadow-sm',
        closing: 'text-base text-gray-600 italic bg-gradient-to-r from-gray-50 to-transparent p-6 pl-8 border-l-4 border-primary/30 rounded-r-xl',
        section: 'text-base text-gray-700 leading-relaxed',
    };

    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return (
        <div className={variantStyles[variant]}>
            {paragraphs.map((paragraph, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-4' : ''}>
                    {paragraph}
                </p>
            ))}
        </div>
    );
};

export default NarrativeBlock;
