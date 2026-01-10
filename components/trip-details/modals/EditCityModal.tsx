import * as React from 'react';
const { useState, useEffect, useCallback, useMemo } = React;
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Base';
import { City } from '../../../types';
import { useLoadScript } from '@react-google-maps/api';
import { getGeminiService } from '../../../services/geminiService';
import { calculateNights } from '../../../lib/dateUtils';
import { checkDateOverlap, getOverlapWarning, DateOverlap } from '../../../lib/dateValidation';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface EditCityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (city: City) => void;
    city: City | null;
    tripStartDate?: string;
    tripEndDate?: string;
    existingCities?: City[];
}

interface CityFormData {
    name: string;
    country: string;
    arrivalDate: string;
    departureDate: string;
    headline: string;
    image?: string;
}

// =============================================================================
// Constants
// =============================================================================

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const formatDateForInput = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    return dateStr;
};

// =============================================================================
// Main Component
// =============================================================================

const EditCityModal: React.FC<EditCityModalProps> = ({
    isOpen,
    onClose,
    onUpdate,
    city,
    tripStartDate,
    tripEndDate,
    existingCities = []
}) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    const minDate = formatDateForInput(tripStartDate);
    const maxDate = formatDateForInput(tripEndDate);

    const [formData, setFormData] = useState<CityFormData>({
        name: '',
        country: '',
        arrivalDate: '',
        departureDate: '',
        headline: '',
        image: undefined,
    });

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Pre-fill form when city prop changes
    useEffect(() => {
        if (isOpen && city) {
            setFormData({
                name: city.name,
                country: city.country,
                arrivalDate: formatDateForInput(city.arrivalDate),
                departureDate: formatDateForInput(city.departureDate),
                headline: city.headline,
                image: city.image,
            });
        }
    }, [isOpen, city]);

    // Date overlap validation (excluding current city being edited)
    const dateOverlaps = useMemo((): DateOverlap[] => {
        if (!formData.arrivalDate || !formData.departureDate || !city) return [];
        return checkDateOverlap(existingCities, formData.arrivalDate, formData.departureDate, city.id);
    }, [existingCities, formData.arrivalDate, formData.departureDate, city]);

    const overlapWarning = useMemo(() => getOverlapWarning(dateOverlaps), [dateOverlaps]);

    const updateField = useCallback(<K extends keyof CityFormData>(
        field: K,
        value: CityFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleGenerateImage = useCallback(async () => {
        if (!formData.name && !formData.country) return;

        setIsGeneratingImage(true);
        try {
            const geminiService = getGeminiService();
            const imageUrl = await geminiService.generateImage(`City of ${formData.name}, ${formData.country}`);
            if (imageUrl) {
                updateField('image', imageUrl);
            }
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsGeneratingImage(false);
        }
    }, [formData.name, formData.country, updateField]);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!city || !formData.name || !formData.country || !formData.arrivalDate || !formData.departureDate) return;

        const nights = calculateNights(formData.arrivalDate, formData.departureDate);

        onUpdate({
            ...city, // Preserve existing fields like id, attractionsCount, restaurantsCount
            name: formData.name,
            country: formData.country,
            arrivalDate: formData.arrivalDate,
            departureDate: formData.departureDate,
            nights,
            headline: formData.headline,
            image: formData.image || city.image || ''
        });

        onClose();
    }, [city, formData, onUpdate, onClose]);

    const isFormValid = formData.name && formData.country && formData.arrivalDate && formData.departureDate;

    const footer = (
        <>
            <Button variant="outline" onClick={onClose}>
                Cancelar
            </Button>
            <Button
                type="submit"
                form="edit-city-form"
                disabled={!isFormValid}
            >
                Salvar Alterações
            </Button>
        </>
    );

    if (!city) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Editar ${city.name}`}
            size="lg"
            footer={footer}
        >
            <form id="edit-city-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Manual Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Cidade"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Ex: Paris"
                        required
                        fullWidth
                        leftIcon={<span className="material-symbols-outlined text-primary text-sm">location_on</span>}
                    />
                    <Input
                        label="País"
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="Ex: França"
                        required
                        fullWidth
                        leftIcon={<span className="material-symbols-outlined text-primary text-sm">public</span>}
                    />
                </div>

                {/* Photo Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">image</span>
                            Foto da Cidade
                        </label>
                        {!formData.image && (
                            <button
                                type="button"
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || (!formData.name && !formData.country)}
                                className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingImage ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        Gerar com IA
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {formData.image ? (
                        <div className="relative h-40 rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={formData.image} alt={formData.name} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => updateField('image', undefined)}
                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                                title="Remover foto"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ) : (
                        <div className="h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <span className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
                            <span className="text-xs">Clique em "Gerar com IA" para criar uma imagem</span>
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                            Chegada
                        </label>
                        <input
                            type="date"
                            value={formData.arrivalDate}
                            onChange={(e) => updateField('arrivalDate', e.target.value)}
                            min={minDate}
                            max={maxDate}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                            Partida
                        </label>
                        <input
                            type="date"
                            value={formData.departureDate}
                            onChange={(e) => updateField('departureDate', e.target.value)}
                            min={formData.arrivalDate || minDate}
                            max={maxDate}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Date Overlap Warning */}
                {overlapWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg shrink-0 mt-0.5">warning</span>
                        <div>
                            <p className="text-sm font-medium text-amber-800">{overlapWarning}</p>
                            <p className="text-xs text-amber-600 mt-1">Você pode continuar, mas verifique se as datas estão corretas.</p>
                        </div>
                    </div>
                )}

                {/* Description */}
                <Textarea
                    label="Descrição Curta (Headline)"
                    value={formData.headline}
                    onChange={(e) => updateField('headline', e.target.value)}
                    placeholder="Ex: A cidade luz, famosa por sua torre e museus."
                    rows={3}
                    fullWidth
                />

                {/* Info about preserved data */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-lg shrink-0 mt-0.5">info</span>
                    <p className="text-xs text-blue-700">
                        Atrações e restaurantes salvos para esta cidade serão preservados.
                    </p>
                </div>
            </form>
        </Modal>
    );
};

export default EditCityModal;
