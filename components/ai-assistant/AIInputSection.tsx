import React from 'react';
import { TravelBudget, TravelRhythm, TravelCompany, TravelInterest } from '../../types';

interface AIInputSectionProps {
    destination: string;
    setDestination: (value: string) => void;
    days: string;
    setDays: (value: string) => void;
    budget: TravelBudget;
    setBudget: (value: TravelBudget) => void;
    rhythm: TravelRhythm;
    setRhythm: (value: TravelRhythm) => void;
    company: TravelCompany;
    setCompany: (value: TravelCompany) => void;
    interests: TravelInterest[];
    setInterests: (value: TravelInterest[]) => void;
    onGenerate: () => void;
    loading: boolean;
}

const budgetOptions: { value: TravelBudget; label: string; icon: string }[] = [
    { value: 'economic', label: 'Econômico', icon: '💰' },
    { value: 'balanced', label: 'Equilibrado', icon: '💰💰' },
    { value: 'luxury', label: 'Luxo', icon: '💰💰💰' },
];

const rhythmOptions: { value: TravelRhythm; label: string; icon: string }[] = [
    { value: 'relaxed', label: 'Relaxado', icon: '🧘' },
    { value: 'moderate', label: 'Moderado', icon: '⚖️' },
    { value: 'intense', label: 'Intenso', icon: '🏃‍♂️' },
];

const companyOptions: { value: TravelCompany; label: string; icon: string }[] = [
    { value: 'solo', label: 'Solo', icon: '👤' },
    { value: 'couple', label: 'Casal', icon: '💑' },
    { value: 'family', label: 'Família', icon: '👨‍👩‍👧‍👦' },
    { value: 'friends', label: 'Amigos', icon: '👯' },
];

const interestOptions: { value: TravelInterest; label: string; icon: string }[] = [
    { value: 'history', label: 'História', icon: '🏛️' },
    { value: 'food', label: 'Gastronomia', icon: '🍝' },
    { value: 'nature', label: 'Natureza', icon: '🌳' },
    { value: 'shopping', label: 'Compras', icon: '🛍️' },
    { value: 'nightlife', label: 'Vida Noturna', icon: '🎉' },
    { value: 'art', label: 'Arte', icon: '🎨' },
    { value: 'adventure', label: 'Aventura', icon: '🧗' },
];

const AIInputSection: React.FC<AIInputSectionProps> = ({
    destination,
    setDestination,
    days,
    setDays,
    budget,
    setBudget,
    rhythm,
    setRhythm,
    company,
    setCompany,
    interests,
    setInterests,
    onGenerate,
    loading,
}) => {
    const toggleInterest = (interest: TravelInterest) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter((i) => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-soft border border-indigo-100 dark:border-gray-700 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[120px]">smart_toy</span>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <h2 className="text-3xl font-bold text-text-main dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-indigo-500 text-4xl">psychology</span>
                    Assistente de Viagem IA
                </h2>
                <p className="text-text-muted dark:text-gray-400 mt-2 max-w-lg">
                    Deixe nossa IA criar o roteiro perfeito para você. Quanto mais detalhes, melhor será a personalização.
                </p>

                {/* Destination and Duration */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 uppercase mb-2">
                            Destino
                        </label>
                        <input
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 py-3 px-4"
                            placeholder="Ex: Paris, França"
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 uppercase mb-2">
                            Duração
                        </label>
                        <select
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 py-3 px-4"
                        >
                            {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
                                <option key={d} value={d}>
                                    {d} {d === 1 ? 'Dia' : 'Dias'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Travel Style Section */}
                <div className="mt-8 space-y-6">
                    {/* Budget */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 uppercase mb-3">
                            Orçamento
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {budgetOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setBudget(option.value)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${budget === option.value
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span>{option.icon}</span>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rhythm */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 uppercase mb-3">
                            Ritmo da Viagem
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {rhythmOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setRhythm(option.value)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${rhythm === option.value
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span>{option.icon}</span>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 uppercase mb-3">
                            Companhia
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {companyOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setCompany(option.value)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${company === option.value
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span>{option.icon}</span>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 uppercase mb-3">
                            Interesses (selecione vários)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {interestOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => toggleInterest(option.value)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${interests.includes(option.value)
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span>{option.icon}</span>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onGenerate}
                        disabled={loading || !destination}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-14 px-10 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin material-symbols-outlined">refresh</span>
                                Pensando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">auto_awesome</span>
                                Planejar Viagem
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIInputSection;
