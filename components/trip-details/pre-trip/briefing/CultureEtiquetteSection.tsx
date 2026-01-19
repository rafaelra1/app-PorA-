import React from 'react';
import { CultureSection } from '../../../../types/preTripBriefing';

interface CultureEtiquetteSectionProps {
    culture: CultureSection;
}

export const CultureEtiquetteSection: React.FC<CultureEtiquetteSectionProps> = ({ culture }) => {
    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎭</span> Cultura & Etiqueta
                <span className="text-gray-400 text-xs font-normal ml-2">Evite gafes sociais</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* DOs */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-green-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Faça
                    </div>
                    <div className="space-y-2">
                        {culture.dos.map((rule, idx) => (
                            <div key={idx} className="flex gap-2 bg-green-50 p-2.5 rounded-lg border border-green-100">
                                <span className="material-symbols-outlined text-green-600 text-[10px] mt-0.5">check</span>
                                <p className="text-gray-700 text-xs font-medium">{rule.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DON'Ts */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Evite
                    </div>
                    <div className="space-y-2">
                        {culture.donts.map((rule, idx) => (
                            <div key={idx} className="flex gap-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                <span className="material-symbols-outlined text-rose-600 text-[10px] mt-0.5">block</span>
                                <p className="text-gray-700 text-xs font-medium">{rule.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Greetings */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <span className="text-lg">🤝</span> Cumprimentos
                </h3>
                <div className="flex flex-col md:flex-row gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {culture.greetings.map((greet, idx) => (
                        <div key={idx} className="flex-1 pt-3 md:pt-0 md:pl-4 first:pt-0 first:pl-0">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">{greet.context}</span>
                            <p className="text-gray-800 font-medium text-xs">{greet.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
