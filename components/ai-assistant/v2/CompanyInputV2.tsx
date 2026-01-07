import React, { useState } from 'react';
import {
    TravelParty,
    TravelCompany,
    TravelerProfile,
    TravelerAgeGroup,
    TravelInterest,
} from '../../../types';

interface CompanyInputV2Props {
    value: TravelParty | null;
    onChange: (party: TravelParty) => void;
}

const companyOptions: { value: TravelCompany; label: string; icon: string; description: string }[] = [
    { value: 'solo', label: 'Sozinho(a)', icon: '👤', description: 'Aventura individual' },
    { value: 'couple', label: 'Casal', icon: '💑', description: 'Viagem a dois' },
    { value: 'family', label: 'Família', icon: '👨‍👩‍👧‍👦', description: 'Com crianças' },
    { value: 'friends', label: 'Amigos', icon: '👯', description: 'Grupo de amigos' },
];

const ageGroupOptions: { value: TravelerAgeGroup; label: string; ageRange: string }[] = [
    { value: 'infant', label: 'Bebê', ageRange: '0-2 anos' },
    { value: 'child', label: 'Criança', ageRange: '3-12 anos' },
    { value: 'teen', label: 'Adolescente', ageRange: '13-17 anos' },
    { value: 'adult', label: 'Adulto', ageRange: '18-64 anos' },
    { value: 'senior', label: 'Idoso', ageRange: '65+ anos' },
];

const dietaryOptions = [
    'Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Kosher', 'Halal', 'Alergia a frutos do mar'
];

const mobilityOptions = [
    'Cadeira de rodas', 'Dificuldade de locomoção', 'Evitar escadas', 'Evitar longas caminhadas'
];

const CompanyInputV2: React.FC<CompanyInputV2Props> = ({ value, onChange }) => {
    const [selectedType, setSelectedType] = useState<TravelCompany>(value?.type || 'couple');
    const [travelers, setTravelers] = useState<TravelerProfile[]>(value?.travelers || []);
    const [showAddTraveler, setShowAddTraveler] = useState(false);

    // New traveler form state
    const [newTraveler, setNewTraveler] = useState<Partial<TravelerProfile>>({
        ageGroup: 'adult',
        dietaryRestrictions: [],
        mobilityRestrictions: [],
    });

    const handleTypeChange = (type: TravelCompany) => {
        setSelectedType(type);
        const size = type === 'solo' ? 1 : type === 'couple' ? 2 : travelers.length || 2;
        onChange({ type, size, travelers });
    };

    const addTraveler = () => {
        const traveler: TravelerProfile = {
            id: `traveler-${Date.now()}`,
            name: newTraveler.name,
            ageGroup: newTraveler.ageGroup || 'adult',
            age: newTraveler.age,
            dietaryRestrictions: newTraveler.dietaryRestrictions,
            mobilityRestrictions: newTraveler.mobilityRestrictions,
        };
        const updated = [...travelers, traveler];
        setTravelers(updated);
        onChange({ type: selectedType, size: updated.length, travelers: updated });
        setShowAddTraveler(false);
        setNewTraveler({ ageGroup: 'adult', dietaryRestrictions: [], mobilityRestrictions: [] });
    };

    const removeTraveler = (id: string) => {
        const updated = travelers.filter(t => t.id !== id);
        setTravelers(updated);
        onChange({ type: selectedType, size: updated.length, travelers: updated });
    };

    const toggleRestriction = (type: 'dietary' | 'mobility', restriction: string) => {
        const field = type === 'dietary' ? 'dietaryRestrictions' : 'mobilityRestrictions';
        const current = newTraveler[field] || [];
        const updated = current.includes(restriction)
            ? current.filter(r => r !== restriction)
            : [...current, restriction];
        setNewTraveler({ ...newTraveler, [field]: updated });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B68FF]">group</span>
                    Quem vai viajar?
                </h3>
                <p className="text-sm text-[#9F9FB1] mt-1">
                    Nos conte sobre o grupo para personalizar sua experiência.
                </p>
            </div>

            {/* Company Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {companyOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleTypeChange(option.value)}
                        className={`p-4 rounded-2xl border-2 transition-all text-center ${selectedType === option.value
                                ? 'border-[#6B68FF] bg-[#6B68FF]/5'
                                : 'border-[#EDEFF3] hover:border-[#6B68FF]/30'
                            }`}
                    >
                        <span className="text-3xl block mb-2">{option.icon}</span>
                        <span className="font-semibold text-[#1F1F1F] block">{option.label}</span>
                        <span className="text-xs text-[#9F9FB1]">{option.description}</span>
                    </button>
                ))}
            </div>

            {/* Travelers List */}
            {(selectedType === 'family' || selectedType === 'friends') && (
                <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3] space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-[#1F1F1F]">Viajantes</h4>
                        <button
                            onClick={() => setShowAddTraveler(true)}
                            className="flex items-center gap-1 text-[#6B68FF] font-medium text-sm hover:underline"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Adicionar
                        </button>
                    </div>

                    {travelers.length === 0 ? (
                        <p className="text-sm text-[#9F9FB1] text-center py-4">
                            Adicione os viajantes para ajustar as recomendações.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {travelers.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between p-3 bg-[#EDEFF3] rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-10 h-10 bg-[#6B68FF]/20 rounded-full flex items-center justify-center text-[#6B68FF] font-bold">
                                            {t.name?.charAt(0) || t.ageGroup.charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="font-medium text-[#1F1F1F]">{t.name || ageGroupOptions.find(a => a.value === t.ageGroup)?.label}</p>
                                            <p className="text-xs text-[#9F9FB1]">
                                                {t.age ? `${t.age} anos` : ageGroupOptions.find(a => a.value === t.ageGroup)?.ageRange}
                                                {t.dietaryRestrictions?.length ? ` • ${t.dietaryRestrictions.length} restrição(ões)` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeTraveler(t.id)}
                                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Traveler Modal */}
            {showAddTraveler && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#1F1F1F]">Adicionar Viajante</h3>
                            <button
                                onClick={() => setShowAddTraveler(false)}
                                className="p-2 hover:bg-[#EDEFF3] rounded-full"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                    Nome (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={newTraveler.name || ''}
                                    onChange={(e) => setNewTraveler({ ...newTraveler, name: e.target.value })}
                                    placeholder="Ex: João"
                                    className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                />
                            </div>

                            {/* Age Group */}
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                                    Faixa Etária
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {ageGroupOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setNewTraveler({ ...newTraveler, ageGroup: option.value })}
                                            className={`px-4 py-2 rounded-xl font-medium transition-all ${newTraveler.ageGroup === option.value
                                                    ? 'bg-[#6B68FF] text-white'
                                                    : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Age (for children) */}
                            {(newTraveler.ageGroup === 'infant' || newTraveler.ageGroup === 'child' || newTraveler.ageGroup === 'teen') && (
                                <div>
                                    <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                        Idade Específica
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="17"
                                        value={newTraveler.age || ''}
                                        onChange={(e) => setNewTraveler({ ...newTraveler, age: parseInt(e.target.value) })}
                                        placeholder="Idade"
                                        className="w-24 rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                    />
                                </div>
                            )}

                            {/* Dietary Restrictions */}
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                                    Restrições Alimentares
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {dietaryOptions.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => toggleRestriction('dietary', option)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${newTraveler.dietaryRestrictions?.includes(option)
                                                    ? 'bg-[#6B68FF] text-white'
                                                    : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobility Restrictions */}
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                                    Necessidades de Mobilidade
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {mobilityOptions.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => toggleRestriction('mobility', option)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${newTraveler.mobilityRestrictions?.includes(option)
                                                    ? 'bg-[#6B68FF] text-white'
                                                    : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowAddTraveler(false)}
                                    className="flex-1 py-3 rounded-xl font-medium border-2 border-[#EDEFF3] text-[#9F9FB1] hover:bg-[#EDEFF3] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={addTraveler}
                                    className="flex-1 py-3 rounded-xl font-medium bg-[#6B68FF] text-white hover:bg-[#5a57e0] transition-colors"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyInputV2;
