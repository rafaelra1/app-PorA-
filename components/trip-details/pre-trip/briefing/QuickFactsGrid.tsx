import React from 'react';
import { QuickFact } from '../../../../types/preTripBriefing';

interface QuickFactsGridProps {
    facts: QuickFact[];
}

const FactCard: React.FC<{ fact: QuickFact }> = ({ fact }) => (
    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow group cursor-default h-full">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">{fact.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{fact.label}</p>
            <p className="font-bold text-gray-900 text-sm truncate leading-tight">{fact.value}</p>
            {fact.subValue && (
                <p className="text-[10px] text-gray-500 truncate">{fact.subValue}</p>
            )}
        </div>
        {fact.actionLabel && (
            <span className="material-symbols-outlined text-gray-300 text-sm">arrow_forward</span>
        )}
    </div>
);

export const QuickFactsGrid: React.FC<QuickFactsGridProps> = ({ facts }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
            {facts.map((fact, idx) => (
                <FactCard key={idx} fact={fact} />
            ))}
        </div>
    );
};
