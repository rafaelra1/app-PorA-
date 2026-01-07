import React, { useState } from 'react';
import { TravelInterest } from '../../../types';

interface DestinationInputV2Props {
    value: string[];
    onChange: (destinations: string[]) => void;
    interests: TravelInterest[];
    onInterestsChange: (interests: TravelInterest[]) => void;
}

const travelStyleTags: { id: string; label: string; icon: string }[] = [
    { id: 'beach', label: 'Praia', icon: '🏖️' },
    { id: 'mountain', label: 'Montanha', icon: '⛰️' },
    { id: 'city', label: 'Urbano', icon: '🏙️' },
    { id: 'countryside', label: 'Campo', icon: '🌾' },
    { id: 'tropical', label: 'Tropical', icon: '🌴' },
    { id: 'desert', label: 'Deserto', icon: '🏜️' },
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

const DestinationInputV2: React.FC<DestinationInputV2Props> = ({
    value,
    onChange,
    interests,
    onInterestsChange,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

    const addDestination = () => {
        if (inputValue.trim() && !value.includes(inputValue.trim())) {
            onChange([...value, inputValue.trim()]);
            setInputValue('');
        }
    };

    const removeDestination = (dest: string) => {
        onChange(value.filter(d => d !== dest));
    };

    const toggleStyle = (id: string) => {
        setSelectedStyles(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleInterest = (interest: TravelInterest) => {
        if (interests.includes(interest)) {
            onInterestsChange(interests.filter(i => i !== interest));
        } else {
            onInterestsChange([...interests, interest]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B68FF]">location_on</span>
                    Para onde você quer ir?
                </h3>
                <p className="text-sm text-[#9F9FB1] mt-1">
                    Adicione um ou mais destinos para sua viagem.
                </p>
            </div>

            {/* Destination Input */}
            <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3] space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#9F9FB1]">
                            search
                        </span>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addDestination()}
                            placeholder="Ex: Paris, França"
                            className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 pl-12 pr-4 text-[#1F1F1F]"
                        />
                    </div>
                    <button
                        onClick={addDestination}
                        disabled={!inputValue.trim()}
                        className="px-6 py-3 rounded-xl bg-[#6B68FF] text-white font-medium hover:bg-[#5a57e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        <span className="hidden sm:inline">Adicionar</span>
                    </button>
                </div>

                {/* Destinations Tags */}
                {value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {value.map((dest, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 px-4 py-2 bg-[#6B68FF]/10 text-[#6B68FF] rounded-xl font-medium"
                            >
                                <span className="material-symbols-outlined text-lg">place</span>
                                {dest}
                                <button
                                    onClick={() => removeDestination(dest)}
                                    className="ml-1 hover:bg-[#6B68FF]/20 rounded-full p-0.5"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {value.length === 0 && (
                    <div className="text-center py-8 text-[#9F9FB1]">
                        <span className="material-symbols-outlined text-4xl mb-2 block">explore</span>
                        <p className="text-sm">Adicione seu primeiro destino acima</p>
                    </div>
                )}

                {value.length > 1 && (
                    <div className="bg-[#6B68FF]/10 rounded-xl p-3 flex items-center gap-2 text-sm text-[#6B68FF]">
                        <span className="material-symbols-outlined">info</span>
                        Viagem multi-cidades! Vamos otimizar a ordem e sugerir transportes entre elas.
                    </div>
                )}
            </div>

            {/* Travel Style Tags */}
            <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3]">
                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                    Estilo de Viagem (opcional)
                </label>
                <p className="text-sm text-[#9F9FB1] mb-4">
                    Isso nos ajuda a sugerir destinos caso você não tenha decidido ainda.
                </p>
                <div className="flex flex-wrap gap-2">
                    {travelStyleTags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => toggleStyle(tag.id)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedStyles.includes(tag.id)
                                    ? 'bg-[#6B68FF] text-white shadow-md'
                                    : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10'
                                }`}
                        >
                            <span>{tag.icon}</span>
                            {tag.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3]">
                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                    O que você gosta de fazer?
                </label>
                <p className="text-sm text-[#9F9FB1] mb-4">
                    Selecione seus interesses para personalizar as atividades.
                </p>
                <div className="flex flex-wrap gap-2">
                    {interestOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => toggleInterest(option.value)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${interests.includes(option.value)
                                    ? 'bg-gradient-to-r from-[#6B68FF] to-[#9F9FB1] text-white shadow-md'
                                    : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10'
                                }`}
                        >
                            <span>{option.icon}</span>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DestinationInputV2;
