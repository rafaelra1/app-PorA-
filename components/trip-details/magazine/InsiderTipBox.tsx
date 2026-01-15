import React from 'react';
import { InsiderTip } from '../../../types/magazine';

interface InsiderTipBoxProps {
    tips: InsiderTip[];
}

/**
 * InsiderTipBox - Displays insider tips in a visually distinct box.
 */
const InsiderTipBox: React.FC<InsiderTipBoxProps> = ({ tips }) => {
    if (tips.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">tips_and_updates</span>
                Dicas de Quem Já Foi
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
                {tips.map((tip, idx) => (
                    <div
                        key={idx}
                        className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50"
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{tip.icon}</span>
                            <div className="flex-1">
                                <h5 className="font-semibold text-blue-900 text-sm mb-1">{tip.title}</h5>
                                <p className="text-sm text-blue-700">{tip.content}</p>
                                {tip.source && (
                                    <p className="text-xs text-blue-500 mt-2 italic">{tip.source}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InsiderTipBox;
