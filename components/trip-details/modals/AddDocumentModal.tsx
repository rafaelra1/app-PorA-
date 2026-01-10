import * as React from 'react';
import { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Button, DocumentUploadZone } from '../../ui/Base';
import { DocumentType, Participant, TripDocument, BatchAnalysisResult, DocumentAnalysisResult, DebugInfo } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';
import { BatchReviewView } from '../documents/BatchReviewView';
import { imagePreprocessor, QualityAnalysis } from '../../../services/imagePreprocessor';
import { pdfService } from '../../../services/pdfService';
import { ImageQualityWarning } from '../../ui/ImageQualityWarning';
import { DebugPanel } from '../../shared/DebugPanel';
import { EntitySyncModal } from './EntitySyncModal';
import { useCalendar } from '../../../contexts/CalendarContext';
import { useTransport } from '../../../contexts/TransportContext';
import { useAccommodation } from '../../../contexts/AccommodationContext';
import { createCalendarEventsFromDocument, getAutoSyncData } from '../../../services/entitySyncService';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validators } from '../../../validators/documentValidators';
import { DOCUMENT_TYPES, DocumentTypeConfig, getDocumentTypesByCategory, FILE_UPLOAD_CONFIG } from '../../../config/constants';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (doc: DocumentFormData) => Promise<TripDocument | void>;
    travelers?: Participant[];
    tripId?: string;
    tripEndDate?: string;
}

export interface DocumentFormData {
    type: DocumentType;
    name: string;
    date: string;
    expiryDate?: string;
    reference: string;
    details: string;
    pickupLocation: string;
    dropoffLocation: string;
    model: string;
    travelers: string[];
    checkInUrl?: string;
    mapUrl?: string;
    contactPhone?: string;
    fieldConfidences?: Record<string, number>;
}

const INITIAL_FORM_STATE: DocumentFormData = {
    type: 'other',
    name: '',
    date: '',
    expiryDate: '',
    reference: '',
    details: '',
    pickupLocation: '',
    dropoffLocation: '',
    model: '',
    travelers: [],
    checkInUrl: '',
    mapUrl: '',
    contactPhone: ''
};

// Using FILE_UPLOAD_CONFIG from centralized constants

const DEFAULT_TRAVELERS: Participant[] = [
    { id: 'u1', name: 'Elena R.', avatar: '', initials: 'ER' },
    { id: 'u2', name: 'João Silva', avatar: '', initials: 'JS' },
    { id: 'u3', name: 'Lisa M.', avatar: '', initials: 'LM' },
];

// =============================================================================
// Helper Components
// =============================================================================

interface DocumentTypeSelectorProps {
    selected: DocumentType;
    onChange: (type: DocumentType) => void;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selected, onChange }) => {
    const reservationTypes = DOCUMENT_TYPES.filter(t => t.category === 'reservation');
    const identityTypes = DOCUMENT_TYPES.filter(t => t.category === 'identity');
    const healthTypes = DOCUMENT_TYPES.filter(t => t.category === 'health');

    const renderTypeButton = (type: DocumentTypeConfig) => (
        <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selected === type.id
                ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm'
                : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
        >
            <span className="material-symbols-outlined mb-1">{type.icon}</span>
            <span className="text-[10px] font-bold uppercase">{type.label}</span>
        </button>
    );

    return (
        <div className="space-y-4">
            {/* Reservations */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 text-sm">confirmation_number</span>
                    Reservas
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {reservationTypes.map(renderTypeButton)}
                </div>
            </div>

            {/* Identity & Health */}
            <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-600 text-sm">badge</span>
                        Identidade
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {identityTypes.map(renderTypeButton)}
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600 text-sm">vaccines</span>
                        Saúde
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {healthTypes.map(renderTypeButton)}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TravelerSelectorProps {
    travelers: Participant[];
    selected: string[];
    onChange: (ids: string[]) => void;
}

const TravelerSelector: React.FC<TravelerSelectorProps> = ({ travelers, selected, onChange }) => {
    const toggleTraveler = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter(t => t !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-sm">group</span>
                Viajantes
            </label>
            <div className="flex flex-wrap gap-2">
                {travelers.map(traveler => (
                    <button
                        key={traveler.id}
                        type="button"
                        onClick={() => toggleTraveler(traveler.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selected.includes(traveler.id)
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selected.includes(traveler.id)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                            }`}>
                            {traveler.initials || traveler.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold">{traveler.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// Document Upload Logic
// =============================================================================

const useDocumentAnalysis = (onDataExtracted?: (data: Partial<DocumentFormData>) => void) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [qualityWarning, setQualityWarning] = useState<QualityAnalysis | null>(null);
    const [pendingBase64, setPendingBase64] = useState<string | null>(null);

    const processImage = useCallback(async (base64: string) => {
        setProgress('Otimizando imagem...');
        const result = await imagePreprocessor.process(base64);

        setProgress('Analisando informações...');
        const aiData = await getGeminiService().analyzeDocumentImage(result.processedBase64);
        return aiData;
    }, []);

    const processPdf = useCallback(async (base64: string) => {
        setProgress('Extraindo páginas do PDF...');
        const pages = await pdfService.extractPdfPages(base64);

        if (pages.length === 0) throw new Error('Nenhuma página encontrada no PDF');

        let combinedData: any = {};

        for (let i = 0; i < pages.length; i++) {
            setProgress(`Analisando página ${i + 1} de ${pages.length}...`);
            const aiData = await getGeminiService().analyzeDocumentImage(pages[i]);

            if (aiData && aiData.length > 0) {
                const pageData = aiData[0];
                combinedData = { ...combinedData, ...Object.fromEntries(Object.entries(pageData).filter(([k, v]) => v)) };
            }
        }

        return [combinedData];
    }, []);

    const finalizeAnalysis = useCallback((aiData: any[]) => {
        if (!aiData || aiData.length === 0) {
            alert('A IA não conseguiu ler o documento.');
            return;
        }

        const data = aiData[0];
        if (onDataExtracted) {
            const cleanDate = (d: string | undefined) => d?.match(/^\d{4}-\d{2}-\d{2}$/) ? d : '';
            let detailsValue = data.details || '';
            if (data.type === 'hotel' && data.endDate) detailsValue = cleanDate(data.endDate);

            const mapped: Partial<DocumentFormData> = {
                type: data.type as DocumentType,
                name: data.name || '',
                date: cleanDate(data.date) || '',
                reference: data.reference || '',
                details: detailsValue,
                pickupLocation: data.pickupLocation || '',
                dropoffLocation: data.dropoffLocation || '',
                model: data.model || '',
                expiryDate: data.endDate && (['passport', 'visa'].includes(data.type)) ? cleanDate(data.endDate) : ''
            };

            if (data.fields) {
                (mapped as any).fieldConfidences = {};
            }

            // Capture debug info if present
            // We can't pass it easily via Partial<DocumentFormData> unless we extend types or manage it side-band.
            // But the component uses mapAnalysisToForm anyway for its own logic if we returned the result.
            // Here we are calling the callback. 
            // Ideally we should return the raw result to the caller too?
            // But analyzeFile is async void.

            onDataExtracted(mapped);
        }
        setIsAnalyzing(false);
        setProgress('');
    }, [onDataExtracted]);

    const analyzeFile = useCallback(async (file: File) => {
        if (!(FILE_UPLOAD_CONFIG.validTypes as readonly string[]).includes(file.type)) {
            alert('Tipo não suportado.');
            return;
        }
        if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
            alert('Arquivo muito grande (max 10MB).');
            return;
        }

        setIsAnalyzing(true);
        setQualityWarning(null);
        setProgress('Lendo arquivo...');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                if (!base64) { setIsAnalyzing(false); return; }

                try {
                    if (file.type === 'application/pdf') {
                        const aiData = await processPdf(base64);
                        finalizeAnalysis(aiData);
                        return;
                    }

                    setProgress('Verificando qualidade...');
                    const quality = await imagePreprocessor.analyzeQuality(base64);
                    if (!quality.isAcceptable) {
                        setQualityWarning(quality);
                        setPendingBase64(base64);
                        setProgress('');
                        setIsAnalyzing(false); // Stop block
                        return;
                    }

                    const aiData = await processImage(base64);
                    finalizeAnalysis(aiData);
                } catch (e: any) {
                    console.error(e);
                    alert(e.message || 'Erro na análise');
                    setIsAnalyzing(false);
                }
            };
        } catch (e) {
            console.error(e);
            setIsAnalyzing(false);
        }
    }, [processPdf, processImage, finalizeAnalysis]);

    const confirmAnalysis = useCallback(async () => {
        if (!pendingBase64) return;
        try {
            setIsAnalyzing(true);
            setQualityWarning(null);
            const aiData = await processImage(pendingBase64);
            finalizeAnalysis(aiData);
        } catch (e) {
            alert('Erro ao processar.');
        } finally {
            setPendingBase64(null);
            setIsAnalyzing(false);
        }
    }, [pendingBase64, processImage, finalizeAnalysis]);

    const cancelAnalysis = useCallback(() => {
        setIsAnalyzing(false);
        setQualityWarning(null);
        setPendingBase64(null);
        setProgress('');
    }, []);

    const analyzeBatch = useCallback(async (files: File[]): Promise<BatchAnalysisResult> => {
        setIsAnalyzing(true);
        try {
            return await getGeminiService().analyzeDocumentBatch(files);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return {
        isAnalyzing,
        analyzeFile,
        analyzeBatch,
        progress,
        qualityWarning,
        confirmAnalysis,
        cancelAnalysis
    };
};

// =============================================================================
// Main Component
// =============================================================================

const AddDocumentModal: React.FC<AddDocumentModalProps> = (props) => {
    const { isOpen, onClose, onAdd, travelers = DEFAULT_TRAVELERS, tripId, tripEndDate } = props;
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [formData, setFormData] = useState<DocumentFormData>(INITIAL_FORM_STATE);
    const [aiInitialData, setAiInitialData] = useState<Partial<DocumentFormData> | null>(null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | undefined>(undefined);
    const [batchResults, setBatchResults] = useState<BatchAnalysisResult | null>(null);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [savedDocument, setSavedDocument] = useState<TripDocument | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { addCalendarEvent } = useCalendar() as any; // The hook name might be addEvent, checking context
    const { addEvent } = useCalendar();
    const { addTransport } = useTransport();
    const { addAccommodation } = useAccommodation();
    const { preferences } = useNotifications();

    // Reset state on close
    const handleClose = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
        setAiInitialData(null);
        setBatchResults(null);
        setDebugInfo(undefined);
        setMode('single');
        setError(null);
        setShowSyncModal(false);
        setSavedDocument(null);
        onClose();
    }, [onClose]);


    // Field updates
    const updateField = useCallback(<K extends keyof DocumentFormData>(
        field: K,
        value: DocumentFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateFields = useCallback((updates: Partial<DocumentFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    const {
        isAnalyzing,
        analyzeBatch,
        analyzeFile,
        progress,
        qualityWarning,
        confirmAnalysis,
        cancelAnalysis
    } = useDocumentAnalysis(updateFields);

    // File Handling
    const mapAnalysisToForm = (data: DocumentAnalysisResult): Partial<DocumentFormData> => {
        const cleanDate = (d: string | undefined) => d?.match(/^\d{4}-\d{2}-\d{2}$/) ? d : '';
        let detailsValue = data.details || '';

        // Special logic for hotel end date mapping
        if (data.type === 'hotel' && data.endDate) {
            detailsValue = cleanDate(data.endDate);
        }

        return {
            type: data.type as DocumentType, // Cast assuming types match (verified in types.ts)
            name: data.name || '',
            date: cleanDate(data.date) || '',
            reference: data.reference || '',
            details: detailsValue,
            pickupLocation: data.pickupLocation || '',
            dropoffLocation: data.dropoffLocation || '',
            model: data.model || '',
            expiryDate: data.endDate && (data.type === 'passport' || data.type === 'visa') ? cleanDate(data.endDate) : ''
        };
    };

    const handleFilesSelect = async (files: File[]) => {
        if (files.length === 0) return;

        // SINGLE MODE
        if (files.length === 1) {
            setMode('single');
            const file = files[0];
            analyzeFile(file);
            return;
        }

        // BATCH MODE
        setMode('batch');
        const results = await analyzeBatch(files);
        setBatchResults(results);
    };

    // Form Submission (Single)
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);

        if (!formData.name || !formData.date) {
            setError("Preencha os campos obrigatórios.");
            return;
        }

        // Passport Validation
        if (formData.type === 'passport' && formData.expiryDate && tripEndDate) {
            if (!validators.passportExpiry(formData.expiryDate, tripEndDate)) {
                setError("O passaporte deve ter validade de pelo menos 6 meses após a data de retorno da viagem.");
                return;
            }
        }

        try {
            const newDoc = await onAdd(formData);

            // Check if document type is eligible for sync
            const syncableTypes = ['flight', 'hotel', 'car', 'bus', 'train', 'ferry'];
            if (newDoc && typeof newDoc !== 'undefined' && syncableTypes.includes(formData.type)) {
                if (preferences?.autoCreateEntities) {
                    // AUTO-SYNC logic bypassing modal
                    const { entityType, data } = getAutoSyncData(newDoc);
                    if (entityType) {
                        await handleSyncConfirm(entityType, data, newDoc);
                    } else {
                        handleClose();
                    }
                } else {
                    setSavedDocument(newDoc);
                    setShowSyncModal(true);
                }
            } else {
                handleClose();
            }
        } catch (error) {
            console.error("Error saving document:", error);
            setError("Ocorreu um erro ao salvar o documento.");
        }
    }, [formData, onAdd, handleClose, aiInitialData, tripEndDate]);

    const handleSyncConfirm = async (entityType: 'transport' | 'accommodation' | 'car', data: any, docOverride?: TripDocument) => {
        const doc = docOverride || savedDocument;
        if (!doc || !tripId) return;

        try {
            // 1. Create Entity
            if (entityType === 'transport' || entityType === 'car') {
                await addTransport(tripId, data);
            } else if (entityType === 'accommodation') {
                if (addAccommodation) await addAccommodation(tripId, data);
            }

            // 2. Create Calendar Events
            const events = createCalendarEventsFromDocument(doc, tripId);
            for (const event of events) {
                await addEvent(event);
            }

        } catch (error) {
            console.error("Error syncing entity:", error);
        } finally {
            setShowSyncModal(false);
            setSavedDocument(null);
            handleClose();
        }
    };

    // Batch Confirmation
    const handleBatchConfirm = useCallback(() => {
        if (!batchResults) return;

        batchResults.successful.forEach(doc => {
            const mapped = mapAnalysisToForm(doc);
            const submission: DocumentFormData = {
                ...INITIAL_FORM_STATE,
                ...mapped,
                travelers: formData.travelers // Use travelers selected in the modal
            } as DocumentFormData;

            onAdd(submission);
        });

        handleClose();
    }, [batchResults, onAdd, handleClose, formData.travelers]);

    const handleBatchRemove = (index: number, type: 'success' | 'failed' | 'duplicate') => {
        if (!batchResults) return;

        const newResults = { ...batchResults };
        if (type === 'success') newResults.successful.splice(index, 1);
        if (type === 'failed') newResults.failed.splice(index, 1);
        if (type === 'duplicate') newResults.duplicates.splice(index, 1);

        const total = newResults.successful.length + newResults.failed.length + newResults.duplicates.length;
        if (total === 0) {
            setMode('single');
            setBatchResults(null);
            setDebugInfo(undefined);
        } else {
            setBatchResults(newResults);
        }
    };

    // Render logic
    const currentTypeConfig = DOCUMENT_TYPES.find(t => t.id === formData.type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
    const isIdentityType = currentTypeConfig.category === 'identity';
    const isHealthType = currentTypeConfig.category === 'health';

    const renderSingleForm = () => (
        <form id="document-form" onSubmit={handleSubmit} className="space-y-6">
            <DocumentTypeSelector
                selected={formData.type}
                onChange={(type) => updateField('type', type)}
            />

            <TravelerSelector
                travelers={travelers}
                selected={formData.travelers}
                onChange={(ids) => updateField('travelers', ids)}
            />

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <Input
                    label={currentTypeConfig.nameLabel}
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={currentTypeConfig.namePlaceholder}
                    required
                    fullWidth
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label={
                            formData.type === 'hotel' ? 'Check-in' :
                                isIdentityType ? 'Data de Emissão' :
                                    isHealthType ? 'Data da Vacina' :
                                        'Data'
                        }
                        type="date"
                        value={formData.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        required
                        fullWidth
                    />
                    {isIdentityType ? (
                        <Input
                            label="Data de Validade"
                            type="date"
                            value={formData.expiryDate || ''}
                            onChange={(e) => updateField('expiryDate', e.target.value)}
                            fullWidth
                        />
                    ) : (
                        <Input
                            label={formData.type === 'hotel' ? 'Check-out' : 'Horário / Detalhes'}
                            type={formData.type === 'hotel' ? 'date' : 'text'}
                            value={formData.details}
                            onChange={(e) => updateField('details', e.target.value)}
                            placeholder={formData.type === 'hotel' ? '' : 'Ex: 14:00 ou informações extras'}
                            fullWidth
                        />
                    )}
                </div>

                {formData.type === 'flight' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <Input
                            label="Origem (IATA)"
                            value={formData.pickupLocation}
                            onChange={(e) => updateField('pickupLocation', e.target.value)}
                            placeholder="Ex: GRU"
                            fullWidth
                        />
                        <Input
                            label="Destino (IATA)"
                            value={formData.dropoffLocation}
                            onChange={(e) => updateField('dropoffLocation', e.target.value)}
                            placeholder="Ex: JFK"
                            fullWidth
                        />
                    </div>
                )}

                {/* Car-specific Fields */}
                {formData.type === 'car' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <Input
                            label="Modelo do Veículo"
                            value={formData.model}
                            onChange={(e) => updateField('model', e.target.value)}
                            placeholder="Ex: Jeep Compass ou similar"
                            fullWidth
                        />
                    </div>
                )}

                {/* Insurance-specific Fields */}
                {formData.type === 'insurance' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <Input
                            label="Telefone de Emergência"
                            value={formData.contactPhone}
                            onChange={(e) => updateField('contactPhone', e.target.value)}
                            placeholder="Ex: +55 11 4004-1234"
                            fullWidth
                            leftIcon={<span className="material-symbols-outlined text-red-500 text-sm">call</span>}
                        />
                    </div>
                )}

                <Input
                    label={
                        isIdentityType ? 'Número do Documento' :
                            isHealthType ? 'Número do Certificado' :
                                'Código de Reserva / Localizador'
                    }
                    value={formData.reference}
                    onChange={(e) => updateField('reference', e.target.value.toUpperCase())}
                    placeholder={
                        isIdentityType ? 'Ex: BR123456789' :
                            isHealthType ? 'Ex: ICV-2023-001' :
                                'Ex: XYZ123'
                    }
                    fullWidth
                    leftIcon={<span className="material-symbols-outlined text-purple-600 text-sm">tag</span>}
                />
            </div>

            {qualityWarning ? (
                <ImageQualityWarning
                    analysis={qualityWarning}
                    onProceed={confirmAnalysis}
                    onRetake={cancelAnalysis}
                />
            ) : (
                <DocumentUploadZone
                    isProcessing={isAnalyzing}
                    onFilesSelect={handleFilesSelect}
                    multiple={true}
                    title="Anexar Documentos"
                    subtitle="Arraste múltiplos arquivos ou clique para selecionar"
                    processingTitle={mode === 'batch' ? "Processando em lote..." : "Analisando documento..."}
                    processingSubtitle={mode === 'batch' || !progress ? "Nossa IA está lendo seus arquivos" : progress}
                />
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 text-sm animate-in fade-in slide-in-from-bottom-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                </div>
            )}

            {/* Debug Panel - Only shows if debugInfo is present and debug mode is active */}
            {debugInfo && (window.location.search.includes('debug=documents') || window.location.search.includes('debug=true')) && (
                <DebugPanel info={debugInfo} />
            )}
        </form>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === 'batch' ? "Importação em Lote" : "Adicionar Documento"}
            size="lg"
            footer={
                mode === 'single' ? (
                    <>
                        <Button variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="document-form"
                            disabled={!formData.name || !formData.date}
                        >
                            Adicionar Documento
                        </Button>
                    </>
                ) : null // Batch mode has its own buttons in BatchReviewView
            }
        >
            {mode === 'batch' && batchResults ? (
                <>
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                        <TravelerSelector
                            travelers={travelers}
                            selected={formData.travelers}
                            onChange={(ids) => updateField('travelers', ids)}
                        />
                        <p className="text-xs text-text-muted mt-2">
                            * Estes viajantes serão atribuídos a todos os documentos importados.
                        </p>
                    </div>
                    <BatchReviewView
                        results={batchResults}
                        onRemove={handleBatchRemove}
                        onConfirm={handleBatchConfirm}
                        onCancel={() => {
                            setMode('single');
                            setBatchResults(null);
                            setDebugInfo(undefined);
                        }}
                        isSaving={false}
                    />
                </>
            ) : (
                renderSingleForm()
            )}

            <EntitySyncModal
                isOpen={showSyncModal}
                onClose={() => {
                    setShowSyncModal(false);
                    setSavedDocument(null);
                    handleClose();
                }}
                document={savedDocument}
                onConfirm={handleSyncConfirm}
            />
        </Modal>
    );
};

export default AddDocumentModal;
