import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { StyledInput } from '../../ui/StyledInput';
import { StyledSelect, SelectOption } from '../../ui/StyledSelect';
import { Button } from '../../ui/Base';
import { HotelReservation, DocumentAnalysisResult } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';
import { formatDate, formatToDisplayDate } from '../../../lib/dateUtils';
import { validateHotelDates } from '../../../validators/documentValidators';
import { useDocumentAnalysis } from '../../../hooks/useDocumentAnalysis';

// =============================================================================
// Types & Interfaces
// =============================================================================

import { conflictDetector, ConflictResult } from '../../../services/conflictDetector';
import { Transport } from '../../../types';

interface CityOption {
    id: string;
    name: string;
}

interface AddAccommodationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (accommodation: Omit<HotelReservation, 'id'>) => void;
    initialData?: HotelReservation | null;
    flights?: Transport[];
    cities?: CityOption[];
    accommodations?: HotelReservation[];
}

interface AccommodationFormData {
    name: string;
    address: string;
    image: string;
    stars: number;
    rating: number;
    nights: number;
    checkIn: string;
    checkInTime: string;
    checkOut: string;
    checkOutTime: string;
    confirmation: string;
    status: 'confirmed' | 'pending';
    type: 'hotel' | 'home';
    cityId: string;
}

type InputMode = 'manual' | 'ai';

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'pending', label: 'Pendente' },
];

const INITIAL_FORM_STATE: AccommodationFormData = {
    name: '',
    address: '',
    image: '',
    stars: 0,
    rating: 0,
    nights: 1,
    checkIn: '',
    checkInTime: '15:00',
    checkOut: '',
    checkOutTime: '11:00',
    confirmation: '',
    status: 'confirmed',
    type: 'hotel',
    cityId: '',
};

const FALLBACK_HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400';

// =============================================================================
// Helper Functions
// =============================================================================

const mapAccommodationResultToFormData = (result: DocumentAnalysisResult): Partial<AccommodationFormData> => {
    const updates: Partial<AccommodationFormData> = {};

    // Extract name
    if (result.name) updates.name = result.name;
    if (result.fields?.hotelName?.value) updates.name = String(result.fields.hotelName.value);

    // Extract dates
    if (result.date) updates.checkIn = result.date;
    if (result.fields?.checkInDate?.value) updates.checkIn = String(result.fields.checkInDate.value);
    if (result.endDate) updates.checkOut = result.endDate;
    if (result.fields?.checkOutDate?.value) updates.checkOut = String(result.fields.checkOutDate.value);

    // Extract times
    if (result.fields?.checkInTime?.value) {
        const time = String(result.fields.checkInTime.value);
        updates.checkInTime = time.slice(0, 5);
    }
    if (result.fields?.checkOutTime?.value) {
        const time = String(result.fields.checkOutTime.value);
        updates.checkOutTime = time.slice(0, 5);
    }

    // Extract address
    if (result.address) updates.address = result.address;
    if (result.fields?.address?.value) updates.address = String(result.fields.address.value);

    // Extract confirmation
    if (result.reference) updates.confirmation = result.reference;
    if (result.fields?.confirmationNumber?.value) updates.confirmation = String(result.fields.confirmationNumber.value);

    // Calculate nights if dates are available
    const checkIn = updates.checkIn;
    const checkOut = updates.checkOut;
    if (checkIn && checkOut) {
        try {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            updates.nights = diffDays > 0 ? diffDays : 1;
        } catch {
            updates.nights = 1;
        }
    }

    return updates;
};

// =============================================================================
// Helper Components
// =============================================================================

interface ModeToggleProps {
    mode: InputMode;
    onChange: (mode: InputMode) => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-5">
        <button
            type="button"
            onClick={() => onChange('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-text-main' : 'text-text-muted'
                }`}
        >
            <span className="material-symbols-outlined text-base">edit</span>
            Manual
        </button>
        <button
            type="button"
            onClick={() => onChange('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === 'ai' ? 'bg-white shadow-sm text-primary' : 'text-text-muted'
                }`}
        >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Ler Documento
        </button>
    </div>
);

interface DocumentUploadProps {
    isAnalyzing: boolean;
    onFileSelect: (file: File) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ isAnalyzing, onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => fileInputRef.current?.click();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
    };

    return (
        <div
            onClick={handleClick}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-5 ${isAnalyzing
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                }`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleChange}
                className="hidden"
            />
            {isAnalyzing ? (
                <>
                    <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-primary text-2xl animate-spin">sync</span>
                    </div>
                    <p className="font-bold text-text-main">Analisando documento...</p>
                    <p className="text-sm text-text-muted mt-1">Extraindo informações com IA</p>
                </>
            ) : (
                <>
                    <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-2xl">cloud_upload</span>
                    </div>
                    <p className="font-bold text-text-main">Envie seu comprovante de reserva</p>
                    <p className="text-sm text-text-muted mt-1">PDF, imagem ou captura de tela</p>
                    <p className="text-xs text-primary font-bold mt-3">A IA extrairá os dados automaticamente</p>
                </>
            )}
        </div>
    );
};

interface RatingInputProps {
    value: number;
    onChange: (value: number) => void;
}

const RatingInput: React.FC<RatingInputProps> = ({ value, onChange }) => (
    <div>
        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
            Avaliação
        </label>
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 4.0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            <span className="material-symbols-outlined text-amber-500 fill">star</span>
        </div>
    </div>
);

interface HotelClassInputProps {
    value: number;
    onChange: (value: number) => void;
}

const HotelClassInput: React.FC<HotelClassInputProps> = ({ value, onChange }) => (
    <div>
        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
            Estrelas (Classificação)
        </label>
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`p-1 rounded-lg transition-all ${value >= star ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-amber-200'
                        }`}
                >
                    <span className={`material-symbols-outlined text-2xl ${value >= star ? 'fill' : ''}`}>star</span>
                </button>
            ))}
        </div>
    </div>
);

import { googlePlacesService } from '../../../services/googlePlacesService';

// =============================================================================
// Main Component
// =============================================================================

const AddAccommodationModal: React.FC<AddAccommodationModalProps> = (props) => {
    const { isOpen, onClose, onAdd, initialData, cities = [], accommodations = [] } = props;
    const [mode, setMode] = useState<InputMode>('manual');
    const [formData, setFormData] = useState<AccommodationFormData>(INITIAL_FORM_STATE);
    const [isEnriching, setIsEnriching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Memoize the options for the hook
    const documentAnalysisOptions = useMemo(() => ({
        mapResultToFormData: mapAccommodationResultToFormData,
        initialFormState: INITIAL_FORM_STATE,
    }), []);

    // Use shared document analysis hook
    const { isAnalyzing, detectedItems, analyzeDocument, clearDetectedItems } = useDocumentAnalysis<AccommodationFormData>(documentAnalysisOptions);

    // Populate form when initialData is provided (for editing/viewing)
    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({
                name: initialData.name || '',
                address: initialData.address || '',
                image: initialData.image || '',
                stars: initialData.stars || 0,
                rating: initialData.rating || 0,
                nights: initialData.nights || 1,
                checkIn: initialData.checkIn || '',
                checkInTime: initialData.checkInTime || '14:00',
                checkOut: initialData.checkOut || '',
                checkOutTime: initialData.checkOutTime || '11:00',
                confirmation: initialData.confirmation || '',
                status: (initialData.status === 'confirmed' || initialData.status === 'pending') ? initialData.status : 'pending',
                type: initialData.type || 'hotel',
                cityId: initialData.cityId || '',
            });
            setMode('manual');
            setError(null);
        } else if (!isOpen) {
            // Reset form when modal closes
            setFormData(INITIAL_FORM_STATE);
            setMode('manual');
            setError(null);
            clearDetectedItems();
        }
    }, [initialData, isOpen, clearDetectedItems]);

    const updateField = useCallback(<K extends keyof AccommodationFormData>(
        field: K,
        value: AccommodationFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
        setMode('manual');
        setError(null);
        clearDetectedItems();
    }, [clearDetectedItems]);

    // Handler to select and populate form from detected item
    const handleSelectItem = useCallback(async (item: AccommodationFormData) => {
        setFormData({ ...INITIAL_FORM_STATE, ...item });
        clearDetectedItems();
        setMode('manual');

        // Enrich with Google Places if we have a name
        if (item.name) {
            setIsEnriching(true);
            try {
                const placeInfo = await googlePlacesService.searchPlace(item.name);
                if (placeInfo.address && !item.address) setFormData(prev => ({ ...prev, address: placeInfo.address || '' }));
                if (placeInfo.rating) setFormData(prev => ({ ...prev, rating: placeInfo.rating || 0 }));
                if (placeInfo.image) setFormData(prev => ({ ...prev, image: placeInfo.image || '' }));
            } catch (e) {
                console.error('Error enriching hotel data:', e);
            } finally {
                setIsEnriching(false);
            }
        }
    }, [clearDetectedItems]);

    const handleRemoveItem = useCallback((index: number) => {
        // Since we can't mutate detectedItems directly, we re-trigger with filtered list
        // For simplicity, we'll just clear all if user removes one (or implement local state)
        clearDetectedItems();
    }, [clearDetectedItems]);

    const handleSearchHotel = useCallback(async () => {
        if (!formData.name) return;

        setIsEnriching(true); // Reuse enriching state for spinner

        try {
            // Parallel fetch: Google (image/address) + Gemini (Metadata)
            const geminiService = getGeminiService();
            const [placeInfo, metadata] = await Promise.all([
                googlePlacesService.searchPlace(formData.name),
                geminiService.getHotelMetadata(formData.name)
            ]);

            if (metadata) {
                if (metadata.address) updateField('address', metadata.address);
                if (metadata.stars) updateField('stars', metadata.stars);
                if (metadata.rating) updateField('rating', metadata.rating);
            }

            if (placeInfo.address && !formData.address && !metadata?.address) updateField('address', placeInfo.address);
            if (placeInfo.rating) updateField('rating', placeInfo.rating); // Prioritize Google Rating
            if (placeInfo.image) updateField('image', placeInfo.image);

        } catch (error) {
            console.error('Error searching hotel:', error);
        } finally {
            setIsEnriching(false);
        }
    }, [formData.name, formData.address, updateField]);

    // Auto-calculate nights
    useEffect(() => {
        if (formData.checkIn && formData.checkOut) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);

            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Only update if different to avoid loop/unnecessary renders (though checkIn/Out diff triggers it)
                if (formData.nights !== diffDays) {
                    updateField('nights', diffDays);
                }
            }
        }
    }, [formData.checkIn, formData.checkOut, formData.nights, updateField]);

    const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
    const [showConflictModal, setShowConflictModal] = useState(false);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.checkIn || !formData.checkOut) {
            setError('Preencha os campos obrigatórios.');
            return;
        }

        if (!validateHotelDates(formData.checkIn, formData.checkOut)) {
            setError('A data de saída deve ser posterior à data de entrada.');
            return;
        }

        // Conflict Detection
        if (!showConflictModal) {
            const tempHotel = {
                ...formData,
                id: initialData?.id || 'temp',
                status: 'confirmed' as const
            };

            let detectedConflicts: ConflictResult[] = [];

            // Check conflicts with flights
            if (props.flights) {
                detectedConflicts = conflictDetector.checkAccommodationConflicts(
                    tempHotel as HotelReservation,
                    props.flights
                );
            }

            // Check overlap with other accommodations
            if (accommodations.length > 0) {
                const overlapConflicts = conflictDetector.checkAccommodationOverlap(
                    tempHotel as HotelReservation,
                    accommodations
                );
                detectedConflicts = [...detectedConflicts, ...overlapConflicts];
            }

            if (detectedConflicts.length > 0) {
                setConflicts(detectedConflicts);
                setShowConflictModal(true);
                return;
            }
        }

        const formatDisplayDate = (dateStr: string) =>
            formatDate(dateStr, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        onAdd({
            name: formData.name,
            address: formData.address || 'Endereço não informado',
            image: formData.image || FALLBACK_HOTEL_IMAGE,
            stars: formData.stars || 3,
            rating: formData.rating || 0,
            nights: formData.nights,
            checkIn: formatToDisplayDate(formData.checkIn),
            checkInTime: `a partir de ${formData.checkInTime}`,
            checkOut: formatToDisplayDate(formData.checkOut),
            checkOutTime: `até ${formData.checkOutTime}`,
            confirmation: formData.confirmation || `RES-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: formData.status,
            type: formData.type,
            cityId: formData.cityId || undefined,
        });

        resetForm();
        onClose();
        setConflicts([]);
        setShowConflictModal(false);
    }, [formData, onAdd, onClose, resetForm, props.flights, accommodations, showConflictModal, initialData?.id]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
        setConflicts([]);
        setShowConflictModal(false);
    }, [onClose, resetForm]);

    // Conflict Modal Overlay
    if (showConflictModal) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={() => setShowConflictModal(false)}
                title="Conflitos na Hospedagem"
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowConflictModal(false)}>
                            Revisar Datas
                        </Button>
                        <Button onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600 border-amber-600">
                            Confirmar Assim Mesmo
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                        <span className="material-symbols-outlined text-3xl text-amber-500 mb-2">hotel_class</span>
                        <h3 className="font-bold text-amber-700">Verifique as datas da estadia</h3>
                        <p className="text-sm text-amber-600/80">
                            {conflicts.some(c => c.type === 'accommodation_overlap')
                                ? 'Conflito com outras hospedagens detectado.'
                                : 'Conflito com voos detectado.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        {conflicts.map((c, i) => (
                            <div key={i} className={`p-4 rounded-xl border flex gap-3 ${c.severity === 'error' ? 'bg-rose-50 border-rose-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                <span className={`material-symbols-outlined text-xl ${c.severity === 'error' ? 'text-rose-500' : 'text-yellow-600'}`}>
                                    {c.severity === 'error' ? 'event_busy' : 'warning'}
                                </span>
                                <div>
                                    <p className={`font-bold text-sm ${c.severity === 'error' ? 'text-rose-700' : 'text-yellow-700'}`}>
                                        {c.message}
                                    </p>
                                    {c.suggestedFix && (
                                        <p className="text-xs text-text-muted mt-1">💡 {c.suggestedFix}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        );
    }

    // Review Items Modal (when AI detects accommodations)
    if (detectedItems.length > 0) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Hospedagem Identificada"
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => clearDetectedItems()}>
                            Cancelar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                        <span className="material-symbols-outlined text-3xl text-primary mb-2">auto_awesome</span>
                        <h3 className="font-bold text-primary">IA detectou {detectedItems.length} hospedagem(ns)</h3>
                        <p className="text-sm text-text-muted">Selecione uma para preencher o formulário.</p>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {detectedItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectItem(item)}
                                className="w-full p-4 border border-gray-200 rounded-xl bg-white hover:border-primary/50 transition-colors flex justify-between items-start gap-3 group text-left"
                            >
                                <div className="flex items-center justify-center size-10 rounded-full bg-gray-50 text-text-muted shrink-0">
                                    <span className="material-symbols-outlined">
                                        {item.type === 'home' ? 'home' : 'hotel'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-text-main truncate">{item.name || 'Hotel não identificado'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {item.checkIn ? formatToDisplayDate(item.checkIn) : 'Data ???'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">dark_mode</span>
                                            {item.nights || 1} noite(s)
                                        </span>
                                    </div>
                                    {item.confirmation && (
                                        <p className="text-xs text-text-muted mt-1">Confirmação: {item.confirmation}</p>
                                    )}
                                </div>
                                <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        );
    }

    const footer = (
        <>
            <Button variant="outline" onClick={handleClose}>
                Cancelar
            </Button>
            <Button type="submit" form="accommodation-form">
                Adicionar
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Adicionar Hospedagem"
            size="lg"
            footer={footer}
        >
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onChange={setMode} />

            {/* AI Upload Section */}
            {mode === 'ai' && (
                <DocumentUpload
                    isAnalyzing={isAnalyzing}
                    onFileSelect={analyzeDocument}
                />
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                </div>
            )}

            <form id="accommodation-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Type Toggle (Hotel / Home) */}
                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                        Tipo de Acomodação
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => updateField('type', 'hotel')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.type === 'hotel'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 text-text-muted hover:border-gray-300'
                                }`}
                        >
                            <span className="material-symbols-outlined">hotel</span>
                            Hotel
                        </button>
                        <button
                            type="button"
                            onClick={() => updateField('type', 'home')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.type === 'home'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 text-text-muted hover:border-gray-300'
                                }`}
                        >
                            <span className="material-symbols-outlined">home</span>
                            Casa / Apartamento
                        </button>
                    </div>
                </div>

                {/* Hotel Name */}
                <div>
                    <StyledInput
                        label={formData.type === 'hotel' ? 'Nome do Hotel' : 'Nome da Propriedade'}
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder={formData.type === 'hotel' ? 'Ex: Hotel Fasano' : 'Ex: Apartamento Centro'}
                        required
                        fullWidth
                        rightIcon={isAnalyzing ? (
                            <span className="material-symbols-outlined text-primary animate-spin">sync</span>
                        ) : undefined}
                    />
                </div>

                {/* City Selection & Stars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City Dropdown */}
                    <div>
                        <StyledSelect
                            label="Cidade"
                            value={formData.cityId}
                            onChange={(e) => updateField('cityId', e.target.value)}
                            options={[
                                { value: '', label: 'Selecione uma cidade' },
                                ...cities.map(city => ({ value: city.id, label: city.name }))
                            ]}
                            fullWidth
                        />
                    </div>

                    {/* Stars (Classification) */}
                    <div>
                        <HotelClassInput
                            value={formData.stars}
                            onChange={(value) => updateField('stars', value)}
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <StyledInput
                            label="Endereço"
                            value={formData.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="Ex: Rua Vittorio Fasano, 88"
                            fullWidth
                        />
                    </div>
                </div>

                {/* Check-in / Check-out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <StyledInput
                                label="Check-in"
                                type="date"
                                value={formData.checkIn}
                                onChange={(e) => updateField('checkIn', e.target.value)}
                                required
                                fullWidth
                            />
                            <StyledInput
                                type="time"
                                label="Horário"
                                value={formData.checkInTime}
                                onChange={(e) => updateField('checkInTime', e.target.value)}
                                fullWidth
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <StyledInput
                                label="Check-out"
                                type="date"
                                value={formData.checkOut}
                                onChange={(e) => updateField('checkOut', e.target.value)}
                                required
                                fullWidth
                            />
                            <StyledInput
                                type="time"
                                label="Horário"
                                value={formData.checkOutTime}
                                onChange={(e) => updateField('checkOutTime', e.target.value)}
                                fullWidth
                            />
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <StyledInput
                            label="Noites"
                            type="number"
                            min="1"
                            value={formData.nights.toString()}
                            onChange={(e) => updateField('nights', parseInt(e.target.value) || 1)}
                            fullWidth
                        />
                    </div>
                    <div className="md:col-span-2">
                        <StyledInput
                            label="Código de Reserva"
                            value={formData.confirmation}
                            onChange={(e) => updateField('confirmation', e.target.value)}
                            placeholder="Ex: HB-12345"
                            fullWidth
                        />
                    </div>
                    <div className="md:col-span-1">
                        <StyledSelect
                            label="Status"
                            value={formData.status}
                            onChange={(e) => updateField('status', e.target.value as 'confirmed' | 'pending')}
                            options={STATUS_OPTIONS}
                            fullWidth
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddAccommodationModal;
