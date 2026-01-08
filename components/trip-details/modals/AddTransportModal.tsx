import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Select, SelectOption } from '../../ui/Select';
import { Button, DocumentUploadZone, ToggleGroup } from '../../ui/Base';
import { Transport, TransportType, TransportStatus } from '../../../types';
import { getGeminiService, DocumentAnalysisResult } from '../../../services/geminiService';
import { formatDate, parseDisplayDate } from '../../../lib/dateUtils';
import { CitySearchInput } from '../../ui/CitySearchInput';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddTransportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (transport: Omit<Transport, 'id'>) => void;
    onEdit?: (transport: Transport) => void;
    initialData?: Transport | null;
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
}

interface TransportTypeConfig {
    type: TransportType;
    icon: string;
    label: string;
    operatorLabel: string;
    operatorPlaceholder: string;
    referenceLabel: string;
    referencePlaceholder: string;
    departureSectionLabel: string;
    arrivalSectionLabel: string;
    locationPlaceholder: string;
}

type InputMode = 'manual' | 'ai';

// =============================================================================
// Constants
// =============================================================================

const TRANSPORT_TYPES: TransportTypeConfig[] = [
    {
        type: 'flight',
        icon: 'flight',
        label: 'Voo',
        operatorLabel: 'Companhia Aérea',
        operatorPlaceholder: 'Ex: LATAM',
        referenceLabel: 'Número do Voo',
        referencePlaceholder: 'Ex: JL 005',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Aeroporto (GRU)'
    },
    {
        type: 'train',
        icon: 'train',
        label: 'Trem',
        operatorLabel: 'Operadora',
        operatorPlaceholder: 'Ex: JR East',
        referenceLabel: 'Número do Trem',
        referencePlaceholder: 'Ex: Hikari 505',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Estação'
    },
    {
        type: 'car',
        icon: 'directions_car',
        label: 'Aluguel de Carro',
        operatorLabel: 'Locadora',
        operatorPlaceholder: 'Ex: Localiza',
        referenceLabel: 'Referência',
        referencePlaceholder: 'Ex: RES-123',
        departureSectionLabel: 'Retirada',
        arrivalSectionLabel: 'Devolução',
        locationPlaceholder: 'Local'
    },
    {
        type: 'transfer',
        icon: 'local_taxi',
        label: 'Transfer',
        operatorLabel: 'Empresa',
        operatorPlaceholder: 'Ex: GetYourGuide',
        referenceLabel: 'Referência',
        referencePlaceholder: 'Ex: TRF-456',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Local'
    },
    {
        type: 'bus',
        icon: 'directions_bus',
        label: 'Ônibus',
        operatorLabel: 'Empresa',
        operatorPlaceholder: 'Ex: Cometa',
        referenceLabel: 'Número do Bilhete',
        referencePlaceholder: 'Ex: BUS-789',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Rodoviária'
    },
    {
        type: 'ferry',
        icon: 'directions_boat',
        label: 'Balsa',
        operatorLabel: 'Empresa',
        operatorPlaceholder: 'Ex: CCR Barcas',
        referenceLabel: 'Número do Bilhete',
        referencePlaceholder: 'Ex: FRY-101',
        departureSectionLabel: 'Embarque',
        arrivalSectionLabel: 'Desembarque',
        locationPlaceholder: 'Terminal'
    },
];

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'pending', label: 'Pendente' },
];

const MODE_OPTIONS = [
    { value: 'manual' as const, label: 'Manual', icon: 'edit' },
    { value: 'ai' as const, label: 'Ler Documento', icon: 'auto_awesome', activeColor: 'text-primary' },
];

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
        updates.departureTime = result.departureTime;
    } else if (result.details) {
        // Fallback to extracting from details if specific field is missing
        const timeMatch = result.details.match(/\d{1,2}:\d{2}/);
        if (timeMatch) updates.departureTime = timeMatch[0];
    }

    if (result.arrivalTime) {
        updates.arrivalTime = result.arrivalTime;
    }

    if (result.model) updates.vehicle = result.model;

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
        <div className="grid grid-cols-3 gap-2">
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
                    <span className="text-xs font-bold">{t.label}</span>
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
}

const LocationSection: React.FC<LocationSectionProps> = ({
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
}) => (
    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</p>
        <div className="grid grid-cols-2 gap-3">
            <Input
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder={locationPlaceholder}
                fullWidth
            />
            <CitySearchInput
                value={city}
                onChange={onCityChange}
                onSelect={(data) => {
                    onCityChange(data.name + ", " + data.country); // Use standardized format
                }}
                placeholder="Cidade"
            />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <Input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                required={dateRequired}
                fullWidth
            />
            <Input
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                required={timeRequired}
                fullWidth
            />
        </div>
    </div>
);

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
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target?.result as string;

                const geminiService = getGeminiService();
                const results = await geminiService.analyzeDocumentImage(base64);

                if (results && results.length > 0) {
                    console.log('Transport document analysis:', results);

                    const items = results.map(result => ({
                        ...INITIAL_FORM_STATE,
                        ...mapResultToFormData(result)
                    }));

                    // Always show review screen for batch add
                    setDetectedItems(items);
                }

                setIsAnalyzing(false);
            };
            reader.readAsDataURL(file);
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

const AddTransportModal: React.FC<AddTransportModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    onEdit,
    initialData
}) => {
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
                departureTime: initialData.departureTime,
                arrivalLocation: initialData.arrivalLocation,
                arrivalCity: initialData.arrivalCity || '',
                arrivalDate: parseDisplayDate(initialData.arrivalDate),
                arrivalTime: initialData.arrivalTime,
                duration: initialData.duration || '',
                transportClass: initialData.class || '',
                seat: initialData.seat || '',
                vehicle: initialData.vehicle || '',
                confirmation: initialData.confirmation,
                status: initialData.status
            });
            setMode('manual');
        } else if (isOpen && !initialData) {
            setFormData(INITIAL_FORM_STATE);
            setDetectedItems([]);
            setMode('manual');
        }
    }, [isOpen, initialData]);

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

    const formatDisplayDate = (dateStr: string) =>
        dateStr ? formatDate(dateStr, { weekday: 'short', day: 'numeric', month: 'short' }) : '';

    const createTransportObject = (data: TransportFormData): Omit<Transport, 'id'> | Transport => {
        const routeStr = data.departureCity && data.arrivalCity
            ? `${data.departureCity} → ${data.arrivalCity}`
            : undefined;

        const baseObject = {
            type: data.type,
            operator: data.operator,
            reference: data.reference || `${data.type.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            route: routeStr,
            departureLocation: data.departureLocation,
            departureCity: data.departureCity,
            departureTime: data.departureTime,
            departureDate: formatDisplayDate(data.departureDate),
            arrivalLocation: data.arrivalLocation,
            arrivalCity: data.arrivalCity,
            arrivalTime: data.arrivalTime,
            arrivalDate: formatDisplayDate(data.arrivalDate || data.departureDate),
            duration: data.duration,
            class: data.transportClass,
            seat: data.seat,
            vehicle: data.vehicle,
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

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (!formData.operator || !formData.departureDate || !formData.departureTime) {
            setError('Preencha os campos obrigatórios.');
            return;
        }

        // Date & Time Validation
        const start = new Date(`${formData.departureDate}T${formData.departureTime}`);
        if (formData.arrivalDate && formData.arrivalTime) {
            const end = new Date(`${formData.arrivalDate}T${formData.arrivalTime}`);
            if (end < start) {
                setError('A data/hora de chegada não pode ser anterior à partida.');
                return;
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
        }
    }, [formData, onAdd, onEdit, onClose, resetForm]);

    const handleBatchAdd = () => {
        detectedItems.forEach(item => {
            onAdd(createTransportObject(item));
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
                                            {item.departureDate ? formatDate(item.departureDate, { day: '2-digit', month: '2-digit' }) : 'Data ???'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                            {item.departureTime || '--:--'}
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
            size="sm"
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
                options={MODE_OPTIONS}
                value={mode}
                onChange={setMode}
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
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={currentTypeConfig.operatorLabel}
                        value={formData.operator}
                        onChange={(e) => updateField('operator', e.target.value)}
                        placeholder={currentTypeConfig.operatorPlaceholder}
                        required
                        fullWidth
                    />
                    <Input
                        label={currentTypeConfig.referenceLabel}
                        value={formData.reference}
                        onChange={(e) => updateField('reference', e.target.value)}
                        placeholder={currentTypeConfig.referencePlaceholder}
                        fullWidth
                    />
                </div>

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
                />

                {/* Additional Info */}
                <div className="grid grid-cols-3 gap-3">
                    {formData.type !== 'car' ? (
                        <>
                            <Input
                                label="Classe"
                                value={formData.transportClass}
                                onChange={(e) => updateField('transportClass', e.target.value)}
                                placeholder="Econômica"
                                fullWidth
                            />
                            <Input
                                label="Assento"
                                value={formData.seat}
                                onChange={(e) => updateField('seat', e.target.value)}
                                placeholder="12A"
                                fullWidth
                            />
                        </>
                    ) : (
                        <div className="col-span-2">
                            <Input
                                label="Veículo"
                                value={formData.vehicle}
                                onChange={(e) => updateField('vehicle', e.target.value)}
                                placeholder="Toyota Corolla ou similar"
                                fullWidth
                            />
                        </div>
                    )}
                    <Select
                        label="Status"
                        value={formData.status}
                        onChange={(e) => updateField('status', e.target.value as TransportStatus)}
                        options={STATUS_OPTIONS}
                        fullWidth
                    />
                </div>

                {/* Confirmation */}
                <Input
                    label="Código de Confirmação"
                    value={formData.confirmation}
                    onChange={(e) => updateField('confirmation', e.target.value)}
                    placeholder="Ex: ABC123XYZ"
                    fullWidth
                />
            </form>
        </Modal>
    );
};

export default AddTransportModal;
