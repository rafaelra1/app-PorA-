import * as React from 'react';
import { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button, FormRow } from '../../ui/Base';
import { PlaceSearchInput, PlaceSearchResult } from '../../ui/PlaceSearchInput';
import { ItineraryActivity, ItineraryActivityType } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';
import { useLoadScript } from '@react-google-maps/api';
import { ACTIVITY_TYPES } from '../../../config/constants';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (activity: Omit<ItineraryActivity, 'id'>) => void;
    onEdit?: (activity: ItineraryActivity) => void;
    selectedDay: number;
    selectedDate: string;
    editingActivity?: ItineraryActivity | null;
}

interface ActivityFormData {
    time: string;
    title: string;
    location: string;
    locationDetail: string;
    type: ItineraryActivityType;
    notes: string;
    price: string;
    image: string;
}

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

// =============================================================================
// Constants
// =============================================================================

const INITIAL_FORM_STATE: ActivityFormData = {
    time: '09:00',
    title: '',
    location: '',
    locationDetail: '',
    type: 'sightseeing',
    notes: '',
    price: '',
    image: '',
};

// =============================================================================
// Helper Components
// =============================================================================

interface ActivityTypeSelectorProps {
    selected: ItineraryActivityType;
    onChange: (type: ItineraryActivityType) => void;
}

const ActivityTypeSelector: React.FC<ActivityTypeSelectorProps> = ({ selected, onChange }) => (
    <div>
        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
            Tipo de Atividade
        </label>
        <div className="grid grid-cols-4 md:grid-cols-9 gap-2">
            {ACTIVITY_TYPES.map((actType) => (
                <button
                    key={actType.value}
                    type="button"
                    onClick={() => onChange(actType.value)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selected === actType.value
                        ? `${actType.borderColor} ${actType.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <span className={`material-symbols-outlined ${selected === actType.value ? actType.color : 'text-gray-400'
                        }`}>{actType.icon}</span>
                    <span className="text-[10px] font-bold text-text-main">{actType.label}</span>
                </button>
            ))}
        </div>
    </div>
);

interface ImageGeneratorProps {
    image: string;
    title: string;
    isGenerating: boolean;
    onGenerate: () => void;
    onClear: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
    image,
    title,
    isGenerating,
    onGenerate,
    onClear,
}) => (
    <div>
        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
            Imagem
        </label>
        {image ? (
            <div className="relative rounded-xl overflow-hidden">
                <img src={image} alt="Preview" className="w-full h-40 object-cover" />
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute top-2 right-2 size-8 bg-black/50 rounded-lg flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={isGenerating || !title}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-bold text-text-main hover:bg-white transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Regenerar
                </button>
            </div>
        ) : (
            <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || !title}
                className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary text-text-muted hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        <span className="font-bold text-sm">Gerando imagem com IA...</span>
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span className="font-bold text-sm">Gerar imagem com IA</span>
                    </>
                )}
            </button>
        )}
        <p className="text-xs text-text-muted mt-2">
            Preencha o título para gerar uma imagem automaticamente
        </p>
    </div>
);

// =============================================================================
// Custom Hooks
// =============================================================================

const useImageGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateImage = useCallback(async (
        title: string,
        location?: string
    ): Promise<string | null> => {
        if (!title) return null;

        setIsGenerating(true);
        try {
            const prompt = `${title}${location ? `, ${location}` : ''}, travel photography, beautiful destination`;
            const imageUrl = await getGeminiService().generateImage(prompt);
            return imageUrl;
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return { isGenerating, generateImage };
};

// =============================================================================
// Main Component
// =============================================================================

const AddActivityModal: React.FC<AddActivityModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    onEdit,
    selectedDay,
    selectedDate,
    editingActivity
}) => {
    const isEditMode = !!editingActivity;
    const initialFormState: ActivityFormData = editingActivity ? {
        time: editingActivity.time,
        title: editingActivity.title,
        location: editingActivity.location || '',
        locationDetail: editingActivity.locationDetail || '',
        type: editingActivity.type,
        notes: editingActivity.notes || '',
        price: editingActivity.price || '',
        image: editingActivity.image || '',
    } : INITIAL_FORM_STATE;

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    const [formData, setFormData] = useState<ActivityFormData>(initialFormState);
    const { isGenerating, generateImage } = useImageGeneration();

    const updateField = useCallback(<K extends keyof ActivityFormData>(
        field: K,
        value: ActivityFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
    }, []);

    const handleGenerateImage = useCallback(async () => {
        const imageUrl = await generateImage(formData.title, formData.location);
        if (imageUrl) {
            updateField('image', imageUrl);
        }
    }, [formData.title, formData.location, generateImage, updateField]);

    // Location Suggestion Logic
    const [isClassifying, setIsClassifying] = useState(false);

    const handlePlaceSelect = async (place: PlaceSearchResult) => {
        // Update form with the full address/name
        updateField('location', place.name);
        // We could store place.address in locationDetail if desired, but for now specific location is key
        if (place.address && place.address !== place.name) {
            updateField('locationDetail', place.address);
        }

        // Trigger AI classification based on the place name + address context
        setIsClassifying(true);
        try {
            const classification = await getGeminiService().classifyActivity(`${place.name}, ${place.address}`);
            if (classification) {
                updateField('type', classification as ItineraryActivityType);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsClassifying(false);
        }
    };


    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.time) return;

        const activityData = {
            day: selectedDay,
            date: selectedDate,
            time: formData.time,
            title: formData.title,
            location: formData.location || undefined,
            locationDetail: formData.locationDetail || undefined,
            type: formData.type,
            completed: editingActivity?.completed || false,
            notes: formData.notes || undefined,
            price: formData.price || undefined,
            image: formData.image || undefined,
        };

        if (editingActivity && onEdit) {
            onEdit({ ...activityData, id: editingActivity.id });
        } else {
            onAdd(activityData);
        }

        resetForm();
        onClose();
    }, [formData, selectedDay, selectedDate, onAdd, onEdit, onClose, resetForm, editingActivity]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    // Removed handleTitleBlur since auto-fill is now on Location


    // Reset form when editingActivity changes
    React.useEffect(() => {
        if (editingActivity) {
            setFormData({
                time: editingActivity.time,
                title: editingActivity.title,
                location: editingActivity.location || '',
                locationDetail: editingActivity.locationDetail || '',
                type: editingActivity.type,
                notes: editingActivity.notes || '',
                price: editingActivity.price || '',
                image: editingActivity.image || '',
            });
        } else {
            setFormData(INITIAL_FORM_STATE);
        }
    }, [editingActivity]);

    const footer = (
        <>
            <Button variant="outline" onClick={handleClose}>
                Cancelar
            </Button>
            <Button
                type="button"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            >
                {isEditMode ? 'Salvar' : 'Adicionar'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditMode ? 'Editar Atividade' : 'Nova Atividade'}
            size="lg"
            footer={footer}
        >
            {/* Subtitle with day info */}
            <p className="text-sm text-text-muted -mt-4 mb-5">
                Dia {selectedDay} • {selectedDate}
            </p>

            <form id="activity-form" onSubmit={handleSubmit} className="space-y-5">

                {/* Title and Auto-fill */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                            O que vamos fazer?
                        </label>
                        {isClassifying && (
                            <span className="text-[10px] text-primary flex items-center gap-1 animate-pulse">
                                <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
                                Classificando...
                            </span>
                        )}
                    </div>
                    <Input
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Ex: Jantar de Aniversário, Visita ao Museu..."
                        required
                        fullWidth
                        className="w-full text-lg font-medium"
                        autoFocus
                    />
                </div>

                {/* Location */}
                <div className="relative">
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1 tracking-wider">
                        Localização
                    </label>
                    {isLoaded ? (
                        <PlaceSearchInput
                            value={formData.location}
                            onChange={(val) => updateField('location', val)}
                            onSelect={handlePlaceSelect}
                            placeholder="Endereço ou nome do local (Ex: Torre Eiffel)"
                        />
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-text-muted text-sm">
                            Carregando mapa...
                        </div>
                    )}
                </div>

                {/* Time, Price & Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Horário"
                        type="time"
                        value={formData.time}
                        onChange={(e) => updateField('time', e.target.value)}
                        required
                        fullWidth
                    />
                    <Input
                        label="Preço (opcional)"
                        value={formData.price}
                        onChange={(e) => updateField('price', e.target.value)}
                        placeholder="Ex: ¥2,500"
                        fullWidth
                    />
                    <Input
                        label="Detalhes (opcional)"
                        value={formData.locationDetail}
                        onChange={(e) => updateField('locationDetail', e.target.value)}
                        placeholder="Ex: 10 min a pé"
                        fullWidth
                    />
                </div>

                {/* Activity Type */}
                <div className="border-t border-gray-100 pt-4">
                    <ActivityTypeSelector
                        selected={formData.type}
                        onChange={(type) => updateField('type', type)}
                    />
                </div>

                {/* Notes */}
                <Textarea
                    label="Notas (opcional)"
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Dicas ou observações sobre esta atividade..."
                    rows={2}
                    fullWidth
                />

                {/* Image Generation */}
                <ImageGenerator
                    image={formData.image}
                    title={formData.title}
                    isGenerating={isGenerating}
                    onGenerate={handleGenerateImage}
                    onClear={() => updateField('image', '')}
                />
            </form>
        </Modal>
    );
};

export default AddActivityModal;
