import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Base';
import { City } from '../../../types';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { getGeminiService } from '../../../services/geminiService';
import { calculateNights } from '../../../lib/dateUtils';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddCityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (city: Omit<City, 'id'>) => void;
    tripStartDate?: string;
    tripEndDate?: string;
}

interface CityFormData {
    name: string;
    country: string;
    arrivalDate: string;
    departureDate: string;
    headline: string;
    image?: string;
}

// CitySearchResult imported from ui/CitySearchInput

// =============================================================================
// Constants
// =============================================================================

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const INITIAL_FORM_STATE = (defaultDate: string): CityFormData => ({
    name: '',
    country: '',
    arrivalDate: defaultDate,
    departureDate: defaultDate,
    headline: '',
    image: undefined,
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format date string to YYYY-MM-DD format for input fields
 */
const formatDateForInput = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    return dateStr;
};

// =============================================================================
// Sub-Components
// =============================================================================

import { CitySearchInput, CitySearchResult } from '../../ui/CitySearchInput';

interface ImagePreviewProps {
    image?: string;
    name: string;
    isGenerating: boolean;
    onGenerate: () => void;
    onRemove: () => void;
    canGenerate: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
    image,
    name,
    isGenerating,
    onGenerate,
    onRemove,
    canGenerate
}) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">image</span>
                Foto da Cidade
            </label>
            {!image && (
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={isGenerating || !canGenerate}
                    className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
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

        {image ? (
            <div className="relative h-40 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={image} alt={name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">
                        {image.includes('google') ? 'Foto do Google Maps' : 'Imagem Gerada por IA'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                    title="Remover foto"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        ) : (
            <div className="h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <span className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
                <span className="text-xs">
                    {isGenerating ? 'Criando imagem única...' : 'Foto automática do Google ou gere com IA'}
                </span>
            </div>
        )}
    </div>
);

// =============================================================================
// Custom Hooks
// =============================================================================

const useImageGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateImage = useCallback(async (cityName: string, country: string): Promise<string | null> => {
        if (!cityName && !country) return null;

        setIsGenerating(true);
        try {
            const geminiService = getGeminiService();
            const imageUrl = await geminiService.generateImage(`City of ${cityName}, ${country}`);
            return imageUrl;
        } catch (error) {
            console.error('Error generating image:', error);
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

const AddCityModal: React.FC<AddCityModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    tripStartDate,
    tripEndDate
}) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    const minDate = formatDateForInput(tripStartDate);
    const maxDate = formatDateForInput(tripEndDate);

    const [formData, setFormData] = useState<CityFormData>(INITIAL_FORM_STATE(minDate));
    const { isGenerating, generateImage } = useImageGeneration();

    // Reset form dates when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                arrivalDate: minDate || prev.arrivalDate,
                departureDate: minDate || prev.departureDate
            }));
        }
    }, [isOpen, minDate]);

    const updateField = useCallback(<K extends keyof CityFormData>(
        field: K,
        value: CityFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleCitySelect = useCallback((data: CitySearchResult) => {
        setFormData(prev => ({
            ...prev,
            name: data.name,
            country: data.country,
            image: data.image
        }));
    }, []);

    const handleGenerateImage = useCallback(async () => {
        const imageUrl = await generateImage(formData.name, formData.country);
        if (imageUrl) {
            updateField('image', imageUrl);
        }
    }, [formData.name, formData.country, generateImage, updateField]);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE(minDate));
    }, [minDate]);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!formData.name || !formData.country || !formData.arrivalDate || !formData.departureDate) return;

        const nights = calculateNights(formData.arrivalDate, formData.departureDate);

        onAdd({
            name: formData.name,
            country: formData.country,
            arrivalDate: formData.arrivalDate,
            departureDate: formData.departureDate,
            nights,
            headline: formData.headline,
            image: formData.image || ''
        });

        resetForm();
        onClose();
    }, [formData, onAdd, onClose, resetForm]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const isFormValid = formData.name && formData.country && formData.arrivalDate && formData.departureDate;

    const footer = (
        <>
            <Button variant="outline" onClick={handleClose}>
                Cancelar
            </Button>
            <Button
                type="submit"
                form="city-form"
                disabled={!isFormValid}
            >
                Adicionar Cidade
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Adicionar Cidade"
            size="md"
            footer={footer}
        >
            <form id="city-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Google Maps Autocomplete */}
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
                    <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">search</span>
                        Preenchimento Automático (Google Maps)
                    </label>

                    {loadError ? (
                        <div className="p-2 bg-red-100 text-red-700 text-sm rounded">
                            Erro ao carregar Google Maps. Verifique a chave API.
                        </div>
                    ) : isLoaded ? (
                        <CitySearchInput
                            onSelect={handleCitySelect}
                            placeholder="Digite aqui para buscar e preencher..."
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            Carregando Google Maps...
                        </div>
                    )}

                    <p className="text-xs text-text-muted">
                        Busque a cidade para preencher os campos abaixo automaticamente.
                    </p>
                </div>

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
                <ImagePreview
                    image={formData.image}
                    name={formData.name}
                    isGenerating={isGenerating}
                    onGenerate={handleGenerateImage}
                    onRemove={() => updateField('image', undefined)}
                    canGenerate={!!(formData.name || formData.country)}
                />

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

                {/* Description */}
                <Textarea
                    label="Descrição Curta (Headline)"
                    value={formData.headline}
                    onChange={(e) => updateField('headline', e.target.value)}
                    placeholder="Ex: A cidade luz, famosa por sua torre e museus."
                    rows={3}
                    fullWidth
                />
            </form>
        </Modal>
    );
};

export default AddCityModal;
