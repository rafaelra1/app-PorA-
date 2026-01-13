import * as React from 'react';
import { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button, DocumentUploadZone, ToggleGroup } from '../../ui/Base';
import { Transport, TransportType, TransportStatus, DocumentAnalysisResult } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';
import { formatDate, parseDisplayDate } from '../../../lib/dateUtils';
import { CitySearchInput } from '../../ui/CitySearchInput';
import { validators, validateFlightTimes } from '../../../validators/documentValidators';
import { enrichmentService } from '../../../services/enrichmentService';
import { TRANSPORT_TYPES, TRANSPORT_STATUS_OPTIONS, INPUT_MODE_OPTIONS, getTransportTypeConfig } from '../../../config/constants';

// =============================================================================
// Types & Interfaces
// =============================================================================

import { conflictDetector, ConflictResult } from '../../../services/conflictDetector';

interface AddTransportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (transport: Omit<Transport, 'id'>) => void;
    onEdit?: (transport: Transport) => void;
    initialData?: Transport | null;
    existingTransports?: Transport[];
}

interface TransportFormData {
    id?: string;
    type: TransportType;
    operator: string;
    reference: string;
    departureLocation: string;
    departureCity: string;
    departureDate: string;
    departureTime: string;
    arrivalLocation: string;
    arrivalCity: string;
    arrivalDate: string;
    arrivalTime: string;
    duration: string;
    transportClass: string;
    seat: string;
    vehicle: string;
    confirmation: string;
    status: TransportStatus;
    fieldConfidences: Record<string, number>;
}

type InputMode = 'manual' | 'ai';

// =============================================================================
// Constants (Local - Não duplicados)
// =============================================================================

const INITIAL_FORM_STATE: TransportFormData = {
    type: 'flight',
    operator: '',
    reference: '',
    departureLocation: '',
    departureCity: '',
    departureDate: '',
    departureTime: '',
    arrivalLocation: '',
    arrivalCity: '',
    arrivalDate: '',
    arrivalTime: '',
    duration: '',
    transportClass: '',
    seat: '',
    vehicle: '',
    confirmation: '',
    status: 'confirmed',
    fieldConfidences: {}
};

const getConfidenceColor = (confidence?: number) => {
    if (confidence === undefined) return '';
    if (confidence >= 0.8) return 'border-green-400 focus:border-green-500 ring-green-100';
    if (confidence >= 0.6) return 'border-yellow-400 focus:border-yellow-500 ring-yellow-100';
    return 'border-red-400 focus:border-red-500 ring-red-100';
};

// Maps generic form fields to specific API fields based on transport type
const TRANSPORT_FIELD_MAPPINGS: Record<string, Record<string, string[]>> = {
    flight: {
        operator: ['airline'],
        reference: ['flightNumber', 'pnr'],
        departureLocation: ['departureAirport', 'pickupLocation'],
        arrivalLocation: ['arrivalAirport', 'dropoffLocation'],
        departureDate: ['departureDate'],
        arrivalDate: ['arrivalDate'],
        departureTime: ['departureTime'],
        arrivalTime: ['arrivalTime'],
        seat: ['seat'],
        transportClass: ['class']
    },
    car: {
        operator: ['company'],
        departureLocation: ['pickupLocation'],
        arrivalLocation: ['dropoffLocation'],
        departureDate: ['pickupDate'],
        arrivalDate: ['dropoffDate'],
        vehicle: ['vehicleModel'],
        confirmation: ['confirmationNumber']
    },
    train: {
        operator: ['company', 'provider'],
        departureDate: ['date'],
        reference: ['reference']
    }
};

// =============================================================================
// Helper Functions
// =============================================================================

const mapResultToFormData = (result: DocumentAnalysisResult): Partial<TransportFormData> => {
    const updates: Partial<TransportFormData> = {};

    // Detect type
    if (result.type === 'flight') {
        updates.type = 'flight';
    } else if (result.type === 'car') {
        updates.type = 'car';
    } else if (
        result.name?.toLowerCase().includes('trem') ||
        result.name?.toLowerCase().includes('train') ||
        result.name?.toLowerCase().includes('shinkansen')
    ) {
        updates.type = 'train';
    }

    if (result.name) updates.operator = result.name;
    if (result.reference) updates.reference = result.reference;
    if (result.pickupLocation) {
        updates.departureLocation = result.pickupLocation;
        updates.departureCity = result.pickupLocation;
    }
    if (result.dropoffLocation) {
        updates.arrivalLocation = result.dropoffLocation;
        updates.arrivalCity = result.dropoffLocation;
    }
    if (result.date) updates.departureDate = result.date;
    if (result.endDate) updates.arrivalDate = result.endDate;

    // Improved time mapping
    if (result.departureTime) {
        updates.departureTime = result.departureTime.slice(0, 5);
    } else if (result.details) {
        // Fallback to extracting from details if specific field is missing
        const timeMatch = result.details.match(/\d{1,2}:\d{2}/);
        if (timeMatch) updates.departureTime = timeMatch[0];
    }

    if (result.arrivalTime) {
        updates.arrivalTime = result.arrivalTime.slice(0, 5);
    }

    if (result.model) updates.vehicle = result.model;

    // Specific mapping for Flight PNR and Ticket Number -> Confirmation
    if (result.type === 'flight' && result.fields) {
        const pnr = result.fields['pnr']?.value;
        const ticket = result.fields['ticketNumber']?.value;
        const ref = result.fields['flightNumber']?.value;

        // Prioritize explicit flightNumber for reference if found
        if (ref) updates.reference = String(ref);

        if (pnr) {
            updates.confirmation = String(pnr);
            if (ticket) {
                updates.confirmation += ` / Tkt: ${ticket}`;
            }
        } else if (ticket) {
            updates.confirmation = String(ticket);
        }
    }

    // Extract confidences
    const type = result.type || 'other';
    const confidences: Record<string, number> = {};

    // Use mappings if available
    const mapping = TRANSPORT_FIELD_MAPPINGS[type] || TRANSPORT_FIELD_MAPPINGS['train']; // fallback
    if (result.fields) {
        Object.entries(mapping).forEach(([formField, apiFields]) => {
            for (const apiField of apiFields) {
                const fieldData = result.fields?.[apiField];
                if (fieldData?.confidence) {
                    confidences[formField] = fieldData.confidence;
                    break;
                }
            }
        });
    }

    updates.fieldConfidences = confidences;

    return updates;
};

// =============================================================================
// Helper Components
// =============================================================================

interface TransportTypeSelectorProps {
    selected: TransportType;
    onChange: (type: TransportType) => void;
}

const TransportTypeSelector: React.FC<TransportTypeSelectorProps> = ({ selected, onChange }) => (
    <div>
        <label className="block text-xs font-bold text-text-muted uppercase mb-3 tracking-wider">
            Tipo de Transporte *
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {TRANSPORT_TYPES.map((t) => (
                <button
                    key={t.type}
                    type="button"
                    onClick={() => onChange(t.type)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${selected === t.type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-text-muted'
                        }`}
                >
                    <span className="material-symbols-outlined">{t.icon}</span>
                    <span className="text-xs font-bold text-center leading-tight">{t.label}</span>
                </button>
            ))}
        </div>
    </div>
);

interface LocationSectionProps {
    title: string;
    location: string;
    city: string;
    date: string;
    time: string;
    locationPlaceholder: string;
    onLocationChange: (value: string) => void;
    onCityChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onTimeChange: (value: string) => void;
    dateRequired?: boolean;
    timeRequired?: boolean;
    confidences?: Record<string, number>;
}

const LocationSection: React.FC<LocationSectionProps & { isFlight?: boolean }> = ({
    title,
    location,
    city,
    date,
    time,
    locationPlaceholder,
    onLocationChange,
    onCityChange,
    onDateChange,
    onTimeChange,
    dateRequired = false,
    timeRequired = false,
    confidences = {},
    isFlight = false
}) => {
    const [enrichmentHint, setEnrichmentHint] = useState<string | null>(null);

    // Enrich Airport Code on Blur or typing
    const handleLocationBlur = async () => {
        if (!isFlight) return;
        if (location.length === 3) {
            const enriched = await enrichmentService.enrichAirport(location);
            if (enriched) {
                setEnrichmentHint(`${enriched.name}`);
                if (!city) {
                    onCityChange(`${enriched.city}, ${enriched.country}`);
                }
            } else {
                setEnrichmentHint(null);
            }
        }
    };

    return (
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</p>
                {enrichmentHint && (
                    <span className="text-xs text-primary font-medium animate-in fade-in">
                        {enrichmentHint}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                        value={location}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            onLocationChange(isFlight && val.length > 3 ? val.slice(0, 3) : val); // Very loose input mask
                        }}
                        onBlur={handleLocationBlur}
                        placeholder={locationPlaceholder}
                        fullWidth
                        maxLength={isFlight ? 3 : undefined}
                        className={getConfidenceColor(typeof window !== 'undefined' ? confidences['departureLocation'] || confidences['arrivalLocation'] : undefined)}
                    />
                    <CitySearchInput
                        value={city}
                        onChange={onCityChange}
                        onSelect={(data) => {
                            onCityChange(data.name + ", " + data.country);
                        }}
                        placeholder="Cidade"
                    />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        required={dateRequired}
                        fullWidth
                        className={getConfidenceColor(confidences['departureDate'] || confidences['arrivalDate'])}
                    />
                    <Input
                        type="time"
                        value={time}
                        onChange={(e) => onTimeChange(e.target.value)}
                        required={timeRequired}
                        fullWidth
                        className={getConfidenceColor(confidences['departureTime'] || confidences['arrivalTime'])}
                    />
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// Custom Hooks
// =============================================================================

const useDocumentAnalysis = (
    updateFormData: (updates: Partial<TransportFormData>) => void,
    setDetectedItems: (items: TransportFormData[]) => void
) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeDocument = useCallback(async (file: File) => {
        setIsAnalyzing(true);

        try {
            const geminiService = getGeminiService();
            // Pass File directly - service handles server or client-side processing
            const results = await geminiService.analyzeDocumentImage(file);

            if (results && results.length > 0) {
                console.log('Transport document analysis:', results);

                const items = results.map(result => ({
                    ...INITIAL_FORM_STATE,
                    ...mapResultToFormData(result)
                }));

                // Always show review screen for batch add
                setDetectedItems(items);
            } else {
                console.warn('No results from document analysis');
            }

            setIsAnalyzing(false);
        } catch (error) {
            console.error('Error analyzing document:', error);
            setIsAnalyzing(false);
        }
    }, [updateFormData, setDetectedItems]);

    return { isAnalyzing, analyzeDocument };
};

// =============================================================================
// Main Component
// =============================================================================

const AddTransportModal: React.FC<AddTransportModalProps> = (props) => {
    const {
        isOpen,
        onClose,
        onAdd,
        onEdit,
        initialData,
        ...transportProps
    } = props;
    const [mode, setMode] = useState<InputMode>('manual');
    const [formData, setFormData] = useState<TransportFormData>(INITIAL_FORM_STATE);
    const [detectedItems, setDetectedItems] = useState<TransportFormData[]>([]);

    // Load initial data when modal opens or initialData changes
    React.useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                id: initialData.id,
                type: initialData.type,
                operator: initialData.operator,
                reference: initialData.reference,
                departureLocation: initialData.departureLocation,
                departureCity: initialData.departureCity || '',
                departureDate: parseDisplayDate(initialData.departureDate),
                departureTime: initialData.departureTime?.slice(0, 5) || '',
                arrivalLocation: initialData.arrivalLocation,
                arrivalCity: initialData.arrivalCity || '',
                arrivalDate: parseDisplayDate(initialData.arrivalDate),
                arrivalTime: initialData.arrivalTime?.slice(0, 5) || '',
                duration: initialData.duration || '',
                transportClass: initialData.class || '',
                seat: initialData.seat || '',
                vehicle: initialData.vehicle || '',
                confirmation: initialData.confirmation,
                status: initialData.status,
                fieldConfidences: {}
            });
            setMode('manual');
        } else if (isOpen && !initialData) {
            setFormData(INITIAL_FORM_STATE);
            setDetectedItems([]);
            setMode('manual');
        }
    }, [isOpen, initialData]);

    // Auto-calculate duration when departure/arrival date/time change
    React.useEffect(() => {
        if (formData.departureDate && formData.departureTime && formData.arrivalDate && formData.arrivalTime) {
            try {
                const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
                const arrivalDateTime = new Date(`${formData.arrivalDate}T${formData.arrivalTime}`);

                if (!isNaN(departureDateTime.getTime()) && !isNaN(arrivalDateTime.getTime()) && arrivalDateTime > departureDateTime) {
                    const diffMs = arrivalDateTime.getTime() - departureDateTime.getTime();
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;

                    let durationStr = '';
                    if (hours > 0) {
                        durationStr = `${hours}h`;
                        if (minutes > 0) {
                            durationStr += ` ${minutes}min`;
                        }
                    } else {
                        durationStr = `${minutes}min`;
                    }

                    if (formData.duration !== durationStr) {
                        setFormData(prev => ({ ...prev, duration: durationStr }));
                    }
                }
            } catch (e) {
                // Invalid date format, skip calculation
            }
        }
    }, [formData.departureDate, formData.departureTime, formData.arrivalDate, formData.arrivalTime, formData.duration]);

    const updateField = useCallback(<K extends keyof TransportFormData>(
        field: K,
        value: TransportFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateFormData = useCallback((updates: Partial<TransportFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    const { isAnalyzing, analyzeDocument } = useDocumentAnalysis(updateFormData, setDetectedItems);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
        setMode('manual');
        setDetectedItems([]);
    }, []);

    const createTransportObject = (data: TransportFormData): Omit<Transport, 'id'> | Transport => {
        const routeStr = data.departureCity && data.arrivalCity
            ? `${data.departureCity} → ${data.arrivalCity}`
            : undefined;

        // Ensure we have valid dates - use departure date as fallback for arrival
        const departureDate = data.departureDate || '';
        const arrivalDate = data.arrivalDate || departureDate;

        const baseObject = {
            type: data.type,
            operator: data.operator,
            reference: data.reference || `${data.type.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            route: routeStr,
            departureLocation: data.departureLocation || '',
            departureCity: data.departureCity || '',
            departureTime: data.departureTime || '',
            departureDate: formatDate(departureDate),
            arrivalLocation: data.arrivalLocation || '',
            arrivalCity: data.arrivalCity || '',
            arrivalTime: data.arrivalTime || '',
            arrivalDate: formatDate(arrivalDate),
            duration: data.duration || '',
            class: data.transportClass || '',
            seat: data.seat || '',
            vehicle: data.vehicle || '',
            confirmation: data.confirmation || `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            status: data.status
        };

        if (data.id) {
            return { ...baseObject, id: data.id };
        }
        return baseObject;
    };

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
    const [showConflictModal, setShowConflictModal] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (!formData.operator || !formData.departureDate || !formData.departureTime) {
            setError('Preencha os campos obrigatórios.');
            return;
        }

        // Date & Time Validation
        if (formData.arrivalDate && formData.arrivalTime) {
            const isValidSequence = validateFlightTimes(
                formData.departureDate,
                formData.departureTime,
                formData.arrivalDate,
                formData.arrivalTime
            );

            if (!isValidSequence) {
                setError('A data/hora de chegada deve ser posterior à partida.');
                return;
            }
        }

        // Conflict Detection
        if (!showConflictModal && transportProps.existingTransports) {
            const transportObj = createTransportObject(formData);
            const detectedConflicts = conflictDetector.checkTransportConflicts(
                transportObj as Transport,
                transportProps.existingTransports
            );

            if (detectedConflicts.length > 0) {
                setConflicts(detectedConflicts);
                setShowConflictModal(true);
                return;
            }
        }

        // Specific Validations for Flight
        if (formData.type === 'flight') {
            // Enrich/Validate IATA if possible or just warn
            if (formData.reference && !validators.flightNumber(formData.reference)) {
                // Just a warning or strict? Let's be permissive but maybe show a warning if we had a warning UI.
                // For now, if it looks really wrong, maybe error?
                // User asked for inline errors.
                // For now I'll stick to blocking errors on critical things.
            }
        }

        setIsSubmitting(true);
        try {
            const transportObj = createTransportObject(formData);

            if (formData.id && onEdit) {
                await onEdit(transportObj as Transport);
            } else {
                await onAdd(transportObj);
            }

            resetForm();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao salvar. Tente novamente.');
        } finally {
            setIsSubmitting(false);
            setShowConflictModal(false);
            setConflicts([]);
        }
    }, [formData, onAdd, onEdit, onClose, resetForm, showConflictModal, transportProps.existingTransports]);

    const handleBatchAdd = () => {
        detectedItems.forEach(item => {
            // Basic validation similar to handleSubmit
            if (item.operator && item.departureDate && item.departureTime) {
                onAdd(createTransportObject(item));
            } else {
                console.warn("Skipping invalid item in batch add:", item);
            }
        });
        resetForm();
        onClose();
    };

    const handleRemoveItem = (index: number) => {
        setDetectedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    // Conflict Modal Mode
    if (showConflictModal) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={() => setShowConflictModal(false)}
                title="Conflitos Detectados"
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowConflictModal(false)}>
                            Corrigir
                        </Button>
                        <Button onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600 border-amber-600">
                            Salvar Mesmo Assim
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                        <span className="material-symbols-outlined text-3xl text-amber-500 mb-2">warning</span>
                        <h3 className="font-bold text-amber-700">Atenção! Existem conflitos na agenda.</h3>
                        <p className="text-sm text-amber-600/80">Verifique os horários abaixo.</p>
                    </div>

                    <div className="space-y-2">
                        {conflicts.map((c, i) => (
                            <div key={i} className={`p-4 rounded-xl border flex gap-3 ${c.severity === 'error' ? 'bg-rose-50 border-rose-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                <span className={`material-symbols-outlined text-xl ${c.severity === 'error' ? 'text-rose-500' : 'text-yellow-600'}`}>
                                    {c.severity === 'error' ? 'error' : 'warning'}
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

    // Review Modal Mode
    if (detectedItems.length > 0) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Itens Identificados"
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setDetectedItems([])}>
                            Cancelar
                        </Button>
                        <Button onClick={handleBatchAdd}>
                            Adicionar Todos ({detectedItems.length})
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                        <span className="material-symbols-outlined text-3xl text-primary mb-2">auto_awesome</span>
                        <h3 className="font-bold text-primary">IA detectou {detectedItems.length} transportes</h3>
                        <p className="text-sm text-text-muted">Revise os itens abaixo antes de adicionar ao itinerário.</p>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {detectedItems.map((item, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white hover:border-primary/50 transition-colors flex justify-between items-start gap-3 group">
                                <div className="flex items-center justify-center size-10 rounded-full bg-gray-50 text-text-muted shrink-0">
                                    <span className="material-symbols-outlined">
                                        {TRANSPORT_TYPES.find(t => t.type === item.type)?.icon || 'flight'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-text-main truncate">{item.operator}</p>
                                        {item.reference && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-text-muted font-mono">{item.reference}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-text-muted">
                                        <span>{item.departureCity}</span>
                                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                        <span>{item.arrivalCity}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {item.departureDate ? formatDate(item.departureDate) : 'Data ???'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                            {item.departureTime?.slice(0, 5) || '--:--'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="size-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-gray-300 flex items-center justify-center transition-colors"
                                    title="Remover item"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        );
    }

    // Normal Mode (Single Add)
    const currentTypeConfig = TRANSPORT_TYPES.find(t => t.type === formData.type) || TRANSPORT_TYPES[0];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Adicionar Transporte"
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="transport-form" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : (formData.id ? 'Salvar Alterações' : 'Adicionar')}
                    </Button>
                </>
            }
        >
            {/* Validation Error */}
            {error && (
                <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">error</span>
                    <p className="text-sm text-rose-600">{error}</p>
                </div>
            )}

            {/* Mode Toggle */}
            <ToggleGroup
                options={INPUT_MODE_OPTIONS}
                value={mode}
                onChange={(val) => setMode(val as InputMode)}
                className="mb-5"
            />

            {/* AI Upload Section */}
            {mode === 'ai' && (
                <div className="mb-5">
                    <DocumentUploadZone
                        isProcessing={isAnalyzing}
                        onFileSelect={analyzeDocument}
                        title="Envie seu bilhete ou comprovante"
                        subtitle="Passagem aérea, trem, ou reserva de carro"
                    />
                </div>
            )}

            <form id="transport-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Transport Type */}
                <TransportTypeSelector
                    selected={formData.type}
                    onChange={(type) => updateField('type', type)}
                />

                {/* Operator & Reference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label={currentTypeConfig.operatorLabel}
                        value={formData.operator}
                        onChange={(e) => updateField('operator', e.target.value)}
                        placeholder={currentTypeConfig.operatorPlaceholder}
                        required
                        fullWidth
                        className={getConfidenceColor(formData.fieldConfidences['operator'])}
                    />
                    <Input
                        label={currentTypeConfig.referenceLabel}
                        value={formData.reference}
                        onChange={(e) => updateField('reference', e.target.value)}
                        placeholder={currentTypeConfig.referencePlaceholder}
                        fullWidth
                        className={getConfidenceColor(formData.fieldConfidences['reference'])}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Departure */}
                    <LocationSection
                        title={currentTypeConfig.departureSectionLabel}
                        location={formData.departureLocation}
                        city={formData.departureCity}
                        date={formData.departureDate}
                        time={formData.departureTime}
                        locationPlaceholder={currentTypeConfig.locationPlaceholder}
                        onLocationChange={(v) => updateField('departureLocation', v)}
                        onCityChange={(v) => updateField('departureCity', v)}
                        onDateChange={(v) => updateField('departureDate', v)}
                        onTimeChange={(v) => updateField('departureTime', v)}
                        dateRequired
                        timeRequired
                        confidences={{
                            departureLocation: formData.fieldConfidences['departureLocation'],
                            departureDate: formData.fieldConfidences['departureDate'],
                            departureTime: formData.fieldConfidences['departureTime']
                        }}
                        isFlight={formData.type === 'flight'}
                    />

                    {/* Arrival */}
                    <LocationSection
                        title={currentTypeConfig.arrivalSectionLabel}
                        location={formData.arrivalLocation}
                        city={formData.arrivalCity}
                        date={formData.arrivalDate}
                        time={formData.arrivalTime}
                        locationPlaceholder={currentTypeConfig.locationPlaceholder}
                        onLocationChange={(v) => updateField('arrivalLocation', v)}
                        onCityChange={(v) => updateField('arrivalCity', v)}
                        onDateChange={(v) => updateField('arrivalDate', v)}
                        onTimeChange={(v) => updateField('arrivalTime', v)}
                        confidences={{
                            arrivalLocation: formData.fieldConfidences['arrivalLocation'],
                            arrivalDate: formData.fieldConfidences['arrivalDate'],
                            arrivalTime: formData.fieldConfidences['arrivalTime']
                        }}
                        isFlight={formData.type === 'flight'}
                    />
                </div>

                {/* Duration Display */}
                {formData.duration && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                        <span className="text-sm font-bold text-primary">
                            Duração: {formData.duration}
                        </span>
                    </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {formData.type !== 'car' ? (
                        <>
                            <div className="md:col-span-1">
                                <Input
                                    label="Classe"
                                    value={formData.transportClass}
                                    onChange={(e) => updateField('transportClass', e.target.value)}
                                    placeholder="Econômica"
                                    fullWidth
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Input
                                    label="Assento"
                                    value={formData.seat}
                                    onChange={(e) => updateField('seat', e.target.value)}
                                    placeholder="12A"
                                    fullWidth
                                />
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2">
                            <Input
                                label="Veículo"
                                value={formData.vehicle}
                                onChange={(e) => updateField('vehicle', e.target.value)}
                                placeholder="Toyota Corolla"
                                fullWidth
                            />
                        </div>
                    )}
                    <div className="md:col-span-1">
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => updateField('status', e.target.value as TransportStatus)}
                            options={TRANSPORT_STATUS_OPTIONS}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Input
                            label="Confirmação"
                            value={formData.confirmation}
                            onChange={(e) => updateField('confirmation', e.target.value)}
                            placeholder="Ex: ABC123XYZ"
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddTransportModal;
