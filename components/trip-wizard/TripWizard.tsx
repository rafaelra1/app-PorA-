import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trip, Participant, DetailedDestination } from '../../types';
import { Button, Card, Icon } from '../ui/Base';
import { Input } from '../ui/Input';
import DatePicker from '../ui/DatePicker';
import { PlaceSearchInput } from '../ui/PlaceSearchInput';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface TripWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (trip: Omit<Trip, 'id'>) => void;
}

type WizardStep = 'destinations' | 'dates' | 'participants' | 'review';

const TripWizard: React.FC<TripWizardProps> = ({ isOpen, onClose, onComplete }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState<WizardStep>('destinations');

    // State
    const [destinations, setDestinations] = useState<DetailedDestination[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [title, setTitle] = useState('');
    const [participants, setParticipants] = useState<Participant[]>(user ? [user as Participant] : []);
    const [newParticipant, setNewParticipant] = useState({ name: '', email: '' });

    const steps: { key: WizardStep; label: string; icon: string }[] = [
        { key: 'destinations', label: 'Destinos', icon: 'map' },
        { key: 'dates', label: 'Datas', icon: 'calendar_today' },
        { key: 'participants', label: 'Quem vai?', icon: 'group' },
        { key: 'review', label: 'Revisão', icon: 'verified' },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    const handleNext = () => {
        if (currentStep === 'destinations') {
            if (destinations.length === 0) {
                showToast("Selecione pelo menos um destino.", "warning");
                return;
            }
            setCurrentStep('dates');
        } else if (currentStep === 'dates') {
            if (!startDate || !endDate) {
                showToast("Informe as datas da viagem.", "warning");
                return;
            }
            setCurrentStep('participants');
        } else if (currentStep === 'participants') {
            setCurrentStep('review');
        }
    };

    const handleBack = () => {
        if (currentStep === 'dates') setCurrentStep('destinations');
        else if (currentStep === 'participants') setCurrentStep('dates');
        else if (currentStep === 'review') setCurrentStep('participants');
    };

    const handleComplete = () => {
        if (!title) {
            showToast("Dê um título para sua viagem.", "warning");
            return;
        }
        const tripData: Omit<Trip, 'id'> = {
            title: title,
            destination: destinations.map(d => d.name).join(', '),
            startDate: startDate,
            endDate: endDate,
            status: 'planning',
            coverImage: destinations[0]?.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000',
            participants: participants,
            detailedDestinations: destinations,
            isFlexibleDates: false,
        };
        onComplete(tripData);
        showToast("Viagem planejada com sucesso! ✨", "success");
        onClose();
    };

    const handleAddParticipant = () => {
        if (!newParticipant.name) return;
        const p: Participant = {
            id: Math.random().toString(36).substr(2, 9),
            name: newParticipant.name,
            email: newParticipant.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newParticipant.name)}&background=random`,
            role: 'Guest'
        };
        setParticipants([...participants, p]);
        setNewParticipant({ name: '', email: '' });
    };

    const handleRemoveParticipant = (id: string) => {
        if (id === user?.id) return;
        setParticipants(participants.filter(p => p.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in" onClick={onClose} />

            <Card className="relative w-full max-w-2xl bg-white overflow-hidden shadow-2xl animate-zoom-in">

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary-dark">
                            <span className="material-symbols-outlined text-2xl">{steps[currentStepIndex].icon}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Passo {currentStepIndex + 1} de {steps.length}</span>
                            <h2 className="text-2xl font-bold text-text-main">{steps[currentStepIndex].label}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-text-muted transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-8 pt-0 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentStep === 'destinations' && (
                                <div className="space-y-6">
                                    <p className="text-text-muted text-sm font-medium">Para onde você quer ir? Você pode adicionar múltiplas cidades.</p>
                                    <PlaceSearchInput
                                        onSelect={async (result) => {
                                            const cityName = result.name.split(',')[0].trim();
                                            if (!destinations.find(d => d.placeId === result.placeId)) {
                                                // Fetch photo using V1 API
                                                const { getPlaceDetailsFull } = await import('../../services/googlePlacesService');
                                                const placeData = await getPlaceDetailsFull(result.placeId);
                                                let photoUrl: string | undefined;
                                                if (placeData?.photos?.[0]?.name) {
                                                    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                                                    photoUrl = `https://places.googleapis.com/v1/${placeData.photos[0].name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${apiKey}`;
                                                }
                                                setDestinations([...destinations, {
                                                    id: result.placeId,
                                                    name: cityName,
                                                    placeId: result.placeId,
                                                    country: result.description.split(',').pop()?.trim() || '',
                                                    image: photoUrl
                                                }]);
                                            }
                                        }}
                                    />

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {destinations.map(d => (
                                            <div key={d.id} className="bg-primary-light text-primary-dark px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-sm border border-primary/20">
                                                <span className="material-symbols-outlined text-base">location_on</span>
                                                {d.name}
                                                <button onClick={() => setDestinations(destinations.filter(x => x.id !== d.id))}>
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 'dates' && (
                                <div className="space-y-6">
                                    <p className="text-text-muted text-sm font-medium">Quando você pretende viajar?</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DatePicker
                                            label="Data de Início"
                                            value={startDate}
                                            onChange={setStartDate}
                                            fullWidth
                                        />
                                        <DatePicker
                                            label="Data de Fim"
                                            value={endDate}
                                            onChange={setEndDate}
                                            fullWidth
                                            minDate={startDate ? new Date(startDate.split('/').reverse().join('-')) : undefined}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 'participants' && (
                                <div className="space-y-6">
                                    <p className="text-text-muted text-sm font-medium">Quem vai te acompanhar nessa aventura?</p>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nome"
                                            value={newParticipant.name}
                                            onChange={e => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                            fullWidth
                                        />
                                        <Input
                                            placeholder="E-mail"
                                            value={newParticipant.email}
                                            onChange={e => setNewParticipant({ ...newParticipant, email: e.target.value })}
                                            fullWidth
                                        />
                                        <Button onClick={handleAddParticipant} className="!p-3 shrink-0">
                                            <Icon name="add" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
                                        {participants.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.avatar} className="size-8 rounded-lg" alt="" />
                                                    <div>
                                                        <p className="text-sm font-bold text-text-main">{p.name}</p>
                                                        <p className="text-[10px] text-text-muted">{p.email || 'Convidado via link'}</p>
                                                    </div>
                                                </div>
                                                {p.id !== user?.id && (
                                                    <button onClick={() => handleRemoveParticipant(p.id)} className="text-text-muted hover:text-red-500 transition-colors">
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                )}
                                                {p.id === user?.id && (
                                                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary-light rounded-lg">Você</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 'review' && (
                                <div className="space-y-6">
                                    <p className="text-text-muted text-sm font-medium">Tudo pronto! Escolha um nome para sua viagem.</p>
                                    <Input
                                        label="Título da Viagem"
                                        placeholder="Dê um nome criativo!"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        fullWidth
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Duração</p>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">event</span>
                                                <span className="text-sm font-bold text-text-main">{startDate} até {endDate}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Participantes</p>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">groups</span>
                                                <span className="text-sm font-bold text-text-main">{participants.length} pessoas</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Roteiro</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {destinations.map(d => (
                                                <span key={d.id} className="text-xs font-semibold text-text-main px-2 py-1 bg-white rounded-lg border border-gray-100">
                                                    {d.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0 flex gap-4">
                    {currentStepIndex > 0 && (
                        <Button variant="outline" onClick={handleBack} className="flex-1">
                            Voltar
                        </Button>
                    )}
                    <Button
                        variant="dark"
                        onClick={currentStep === 'review' ? handleComplete : handleNext}
                        className="flex-[2]"
                    >
                        {currentStep === 'review' ? 'Finalizar Viagem' : 'Continuar'}
                        <Icon name={currentStep === 'review' ? 'check' : 'arrow_forward'} size="sm" className="ml-2" />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default TripWizard;
