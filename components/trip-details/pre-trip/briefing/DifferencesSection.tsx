import React from 'react';
import { DifferenceCategory, DifferenceItem } from '../../../../types/preTripBriefing';

interface DifferencesSectionProps {
    differences: DifferenceCategory[];
}

export const DifferencesSection: React.FC<DifferencesSectionProps> = ({ differences }) => {
    return (
        <section className="mb-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>🇧🇷 ↔️ ✈️</span> Diferenças Importantes
                </h2>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 uppercase tracking-wide">
                    O que vai estranhar
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {differences.map((category) => (
                    <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        {/* Category Header */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <span className="text-lg">{category.icon}</span>
                            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">
                                {category.title}
                            </h3>
                        </div>

                        {/* List */}
                        <ul className="space-y-2">
                            {category.items.map((item, idx) => {
                                const isObject = typeof item === 'object' && item !== null;
                                const term = isObject ? (item as DifferenceItem).term : null;
                                const desc = isObject ? (item as DifferenceItem).description : item as string;

                                return (
                                    <li key={idx} className="flex gap-2 text-gray-700 text-xs leading-relaxed">
                                        <span className="text-indigo-500 mt-1 text-[10px]">●</span>
                                        <span>
                                            {term && <strong className="font-semibold text-gray-900 mr-1">"{term}"</strong>}
                                            {term ? `= ${desc}` : desc}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
};
