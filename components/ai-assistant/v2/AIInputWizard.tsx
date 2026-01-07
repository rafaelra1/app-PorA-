import React, { useState } from 'react';
import {
    TravelTiming,
    TravelParty,
    BudgetBreakdown,
    TravelInterest,
    TravelPreferencesV2,
} from '../../../types';
import TimingInputV2 from './TimingInputV2';
import DestinationInputV2 from './DestinationInputV2';
import CompanyInputV2 from './CompanyInputV2';
import BudgetInputV2 from './BudgetInputV2';

interface AIInputWizardProps {
    onSubmit: (data: {
        destinations: string[];
        preferences: TravelPreferencesV2;
    }) => void;
    loading: boolean;
}

type WizardStep = 'destination' | 'timing' | 'company' | 'budget' | 'review';

const steps: { id: WizardStep; label: string; icon: string }[] = [
    { id: 'destination', label: 'Destino', icon: 'location_on' },
    { id: 'timing', label: 'Quando', icon: 'schedule' },
    { id: 'company', label: 'Quem', icon: 'group' },
    { id: 'budget', label: 'Orçamento', icon: 'payments' },
    { id: 'review', label: 'Revisar', icon: 'checklist' },
];

const AIInputWizard: React.FC<AIInputWizardProps> = ({ onSubmit, loading }) => {
    const [currentStep, setCurrentStep] = useState<WizardStep>('destination');

    // Form state
    const [destinations, setDestinations] = useState<string[]>([]);
    const [timing, setTiming] = useState<TravelTiming | null>(null);
    const [party, setParty] = useState<TravelParty | null>(null);
    const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
    const [interests, setInterests] = useState<TravelInterest[]>(['food', 'history']);

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStep === 'review';

    const canProceed = () => {
        switch (currentStep) {
            case 'destination':
                return destinations.length > 0;
            case 'timing':
                return timing !== null;
            case 'company':
                return party !== null;
            case 'budget':
                return budget !== null;
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const goPrev = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleSubmit = () => {
        if (!timing || !party || !budget) return;

        onSubmit({
            destinations,
            preferences: {
                timing,
                party,
                budget,
                rhythm: 'moderate',
                interests,
            },
        });
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-[#EDEFF3] overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-[#EDEFF3] p-4">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            {/* Step Circle */}
                            <button
                                onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                                disabled={idx > currentStepIndex}
                                className={`flex items-center gap-2 ${idx <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${idx < currentStepIndex
                                        ? 'bg-[#6B68FF] text-white'
                                        : idx === currentStepIndex
                                            ? 'bg-[#6B68FF] text-white shadow-lg shadow-[#6B68FF]/30'
                                            : 'bg-white text-[#9F9FB1] border-2 border-[#9F9FB1]/30'
                                    }`}>
                                    {idx < currentStepIndex ? (
                                        <span className="material-symbols-outlined text-xl">check</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">{step.icon}</span>
                                    )}
                                </div>
                                <span className={`hidden sm:inline font-medium ${idx === currentStepIndex ? 'text-[#1F1F1F]' : 'text-[#9F9FB1]'
                                    }`}>
                                    {step.label}
                                </span>
                            </button>

                            {/* Connector Line */}
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 rounded-full ${idx < currentStepIndex ? 'bg-[#6B68FF]' : 'bg-[#9F9FB1]/30'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="p-6 sm:p-8 min-h-[400px]">
                {currentStep === 'destination' && (
                    <DestinationInputV2
                        value={destinations}
                        onChange={setDestinations}
                        interests={interests}
                        onInterestsChange={setInterests}
                    />
                )}

                {currentStep === 'timing' && (
                    <TimingInputV2
                        value={timing}
                        onChange={setTiming}
                    />
                )}

                {currentStep === 'company' && (
                    <CompanyInputV2
                        value={party}
                        onChange={setParty}
                    />
                )}

                {currentStep === 'budget' && (
                    <BudgetInputV2
                        value={budget}
                        onChange={setBudget}
                    />
                )}

                {currentStep === 'review' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#6B68FF]">checklist</span>
                                Revise sua Viagem
                            </h3>
                            <p className="text-sm text-[#9F9FB1] mt-1">
                                Confirme os detalhes antes de gerar seu roteiro personalizado.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Destinations */}
                            <div className="p-4 bg-[#EDEFF3] rounded-xl">
                                <p className="text-xs text-[#9F9FB1] uppercase font-medium mb-1">Destinos</p>
                                <p className="text-[#1F1F1F] font-semibold">{destinations.join(' → ')}</p>
                            </div>

                            {/* Timing */}
                            <div className="p-4 bg-[#EDEFF3] rounded-xl">
                                <p className="text-xs text-[#9F9FB1] uppercase font-medium mb-1">Quando</p>
                                <p className="text-[#1F1F1F] font-semibold">
                                    {timing?.type === 'exact'
                                        ? `${timing.startDate} a ${timing.endDate}`
                                        : timing?.type === 'month'
                                            ? `${timing.month}/${timing.year} (${timing.duration} dias)`
                                            : timing ? `Flexível (${timing.duration} dias)` : 'Não definido'
                                    }
                                </p>
                            </div>

                            {/* Party */}
                            <div className="p-4 bg-[#EDEFF3] rounded-xl">
                                <p className="text-xs text-[#9F9FB1] uppercase font-medium mb-1">Viajantes</p>
                                <p className="text-[#1F1F1F] font-semibold">
                                    {party?.size || 0} pessoa(s) • {party?.type === 'solo' ? 'Solo' : party?.type === 'couple' ? 'Casal' : party?.type === 'family' ? 'Família' : 'Amigos'}
                                </p>
                            </div>

                            {/* Budget */}
                            <div className="p-4 bg-[#EDEFF3] rounded-xl">
                                <p className="text-xs text-[#9F9FB1] uppercase font-medium mb-1">Orçamento</p>
                                <p className="text-[#1F1F1F] font-semibold">
                                    R$ {budget?.total?.toLocaleString('pt-BR') || '0'}
                                </p>
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="p-4 bg-[#EDEFF3] rounded-xl">
                            <p className="text-xs text-[#9F9FB1] uppercase font-medium mb-2">Interesses</p>
                            <div className="flex flex-wrap gap-2">
                                {interests.map((i) => (
                                    <span key={i} className="px-3 py-1 bg-[#6B68FF]/10 text-[#6B68FF] rounded-lg text-sm font-medium">
                                        {i}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="p-4 sm:p-6 border-t border-[#EDEFF3] flex justify-between items-center">
                <button
                    onClick={goPrev}
                    disabled={isFirstStep}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isFirstStep
                            ? 'text-[#9F9FB1] cursor-not-allowed'
                            : 'text-[#1F1F1F] hover:bg-[#EDEFF3]'
                        }`}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Voltar
                </button>

                {isLastStep ? (
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !canProceed()}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-[#6B68FF] to-[#9F9FB1] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                Gerando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">auto_awesome</span>
                                Gerar Roteiro
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[#6B68FF] text-white shadow-lg hover:shadow-xl hover:bg-[#5a57e0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próximo
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AIInputWizard;
