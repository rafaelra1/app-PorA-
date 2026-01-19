import React from 'react';
import { PhraseCategory } from '../../../../types/preTripBriefing';

interface UsefulPhrasesSectionProps {
    categories: PhraseCategory[];
}

export const UsefulPhrasesSection: React.FC<UsefulPhrasesSectionProps> = ({ categories }) => {
    const handlePlayAudio = (text: string) => {
        // Mock audio play
        console.log(`Playing audio for: ${text}`);
        // In a real app, uses window.speechSynthesis or an audio file
        const utterance = new SpeechSynthesisUtterance(text);
        // utterance.lang = 'pt-PT'; // Hardcoded for this task since we know it's Portugal, but should be dynamic
        window.speechSynthesis.speak(utterance);
    };

    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🗣️</span> Frases Úteis
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-100 transition-colors">
                        <h3 className="text-indigo-600 font-bold uppercase text-[10px] tracking-wider mb-3 border-b border-gray-50 pb-2">
                            {cat.category}
                        </h3>
                        <ul className="space-y-2">
                            {cat.phrases.map((phrase, pIdx) => (
                                <li key={pIdx} className="group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900 text-xs">{phrase.original}</p>
                                            {phrase.meaning && (
                                                <p className="text-[10px] text-gray-500 italic">{phrase.meaning}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handlePlayAudio(phrase.original)}
                                            className="text-gray-300 hover:text-indigo-600 p-0.5 rounded-full hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Ouvir pronúncia"
                                        >
                                            <span className="material-symbols-outlined text-base">volume_up</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
};
