import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Trip, TripStatus, Participant, DetailedDestination } from '../types';
import { Button, Card, Input, Icon, PageContainer, PageHeader } from '../components/ui/Base';
import { useAuth } from '../contexts/AuthContext';
import { getGeminiService } from '../services/geminiService';
import { parseDisplayDate, formatToDisplayDate, calculateDuration as calcDuration } from '../lib/dateUtils';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripSchema } from '../lib/validations/schemas';
import { useToast } from '../contexts/ToastContext';
import { useAutosaveDraft } from '../hooks/useAutosaveDraft';
import { useTrips } from '@/contexts/TripContext';
import { useUI } from '../contexts/UIContext';

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const CreateTrip: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { addTrip, updateTrip, editingTrip, setEditingTrip } = useTrips();
    const { setActiveTab } = useUI();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [newParticipantEmail, setNewParticipantEmail] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false);

    // Load Google Maps Script
    const { isLoaded: mapsLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    const {
        control,
        handleSubmit,
        setValue: setFormValue,
        watch,
        formState: { errors, isSubmitting: isSubmittingForm },
        reset
    } = useForm({
        resolver: zodResolver(tripSchema),
        defaultValues: {
            title: '',
            destination: '',
            startDate: '',
            endDate: '',
            status: 'planning' as TripStatus,
            coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000',
            participants: user ? [user as Participant] : [] as Participant[],
            isFlexibleDates: false,
            detailedDestinations: [] as DetailedDestination[]
        }
    });

    const formData = watch();

    // Autosave Draft Integration
    const { saveDraft, clearDraft, loadDraft, hasDraft, lastSaved } = useAutosaveDraft({
        key: 'new_trip',
        onRestore: (data: any) => {
            reset(data);
            showToast("Rascunho restaurado!", "info");
        }
    });

    // Debounced Autosave
    useEffect(() => {
        // Only autosave for new trips, not editing
        if (editingTrip) return;

        const timer = setTimeout(() => {
            // Don't save if form is empty/initial
            if (formData.title || formData.destination || formData.detailedDestinations.length > 0) {
                saveDraft(formData);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [formData, editingTrip, saveDraft]);

    // Handle Restore
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    useEffect(() => {
        if (!editingTrip && hasDraft && !formData.title) {
            setShowRestorePrompt(true);
        }
    }, [editingTrip, hasDraft, formData.title]);

    // Places Autocomplete
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            types: ['(cities)'],
        },
        debounce: 300,
        initOnMount: mapsLoaded,
    });

    useEffect(() => {
        if (editingTrip) {
            reset({
                title: editingTrip.title,
                destination: editingTrip.destination,
                startDate: parseDisplayDate(editingTrip.startDate),
                endDate: parseDisplayDate(editingTrip.endDate),
                status: editingTrip.status,
                coverImage: editingTrip.coverImage,
                participants: editingTrip.participants,
                isFlexibleDates: editingTrip.isFlexibleDates || false,
                detailedDestinations: editingTrip.detailedDestinations || []
            });
        } else {
            // Reset when switching to create mode if needed, though usually this component is mounted fresh
        }
        setValue('');
        setIsParticipantsExpanded(false);
    }, [editingTrip, user, reset, setValue]);

    const duration = calcDuration(formData.startDate || '', formData.endDate || '');

    const handleGenerateImage = async () => {
        const destinationNames = formData.detailedDestinations.map(d => d.name).join(', ') || formData.destination;
        if (!destinationNames) {
            showToast("Por favor, informe um destino para gerar a imagem.", "warning");
            return;
        }

        setIsGeneratingImage(true);
        try {
            const geminiService = getGeminiService();
            const imageUrl = await geminiService.generateImage(destinationNames, {
                aspectRatio: "16:9",
                imageSize: imageSize
            });

            if (imageUrl) {
                setFormValue('coverImage', imageUrl);
                showToast("Imagem gerada com sucesso!", "success");
            } else {
                showToast("Falha ao gerar imagem.", "error");
            }
        } catch (error) {
            console.error("Image generation failed", error);
            showToast("Falha ao gerar imagem.", "error");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleAISuggestion = async () => {
        const destinationNames = formData.detailedDestinations.map(d => d.name).join(', ') || formData.destination;
        if (!destinationNames) return;
        setIsOptimizing(true);
        try {
            const geminiService = getGeminiService();
            const prompt = `Sugira um título criativo e inspirador para uma viagem para ${destinationNames}. Responda apenas o título, sem aspas.`;

            // Using a generic call via the service which uses the proxy
            const title = await geminiService.generateText(prompt);

            if (title) {
                setFormValue('title', title.replace(/"/g, '').trim());
                showToast("Título sugerido aplicado!", "info");
            }
        } catch (error) {
            console.error("AI Suggestion failed", error);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormValue('coverImage', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSelectPlace = async (description: string, placeId: string) => {
        setValue('', false);
        clearSuggestions();

        if (formData.detailedDestinations.some(d => d.name.toLowerCase() === description.toLowerCase())) {
            return;
        }

        const cityName = description.split(',')[0].trim();

        // Use V1 REST API instead of legacy JS API to avoid 403 errors
        const { getPlaceDetailsFull } = await import('../services/googlePlacesService');
        const placeData = await getPlaceDetailsFull(placeId);

        let country = '';
        let photoUrl: string | undefined;

        if (placeData) {
            // Extract country from addressComponents
            placeData.addressComponents?.forEach((comp: any) => {
                if (comp.types?.includes('country')) {
                    country = comp.longText || '';
                }
            });

            // Build photo URL using V1 API format
            if (placeData.photos && placeData.photos.length > 0) {
                const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                photoUrl = `https://places.googleapis.com/v1/${placeData.photos[0].name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${apiKey}`;
            }
        }

        if (!country) {
            const parts = description.split(',');
            country = parts.length > 1 ? parts[parts.length - 1].trim() : '';
        }

        const newDest: DetailedDestination = {
            id: Math.random().toString(36).substr(2, 9),
            name: cityName,
            country: country,
            placeId: placeId,
            image: photoUrl,
        };

        const newList = [...formData.detailedDestinations, newDest];
        setFormValue('detailedDestinations', newList);
        setFormValue('destination', newList.map(d => d.name).join(', '));

        if (newList.length === 1 && photoUrl) {
            setFormValue('coverImage', photoUrl);
        }
    };

    const handleRemoveDestination = (id: string) => {
        const newList = formData.detailedDestinations.filter(d => d.id !== id);
        setFormValue('detailedDestinations', newList);
        setFormValue('destination', newList.map(d => d.name).join(', '));
    };

    const handleDestinationDateChange = (id: string, field: 'startDate' | 'endDate', value: string) => {
        const newList = formData.detailedDestinations.map(d =>
            d.id === id ? { ...d, [field]: value } : d
        );
        setFormValue('detailedDestinations', newList);
    };

    const handleAddParticipant = () => {
        if (!newParticipantName.trim()) return;
        const newParticipant: Participant = {
            id: Math.random().toString(36).substr(2, 9),
            name: newParticipantName.trim(),
            email: newParticipantEmail.trim() || undefined,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newParticipantName)}&background=random&color=fff`,
            role: 'Guest'
        };
        setFormValue('participants', [...formData.participants, newParticipant]);
        setNewParticipantName('');
        setNewParticipantEmail('');
        if (formData.participants.length >= 5) {
            setIsParticipantsExpanded(true);
        }
    };

    const handleRemoveParticipant = (id: string) => {
        if (id === user?.id) return;
        setFormValue('participants', formData.participants.filter(p => p.id !== id));
    };

    const handleCancel = () => {
        setEditingTrip(undefined);
        setActiveTab('dashboard');
    };

    const onSubmit = async (data: any) => {
        try {
            const tripData: any = {
                ...data,
                startDate: data.isFlexibleDates ? '' : formatToDisplayDate(data.startDate),
                endDate: data.isFlexibleDates ? '' : formatToDisplayDate(data.endDate)
            };

            if (editingTrip && editingTrip.id) {
                tripData.id = editingTrip.id;
                await updateTrip(tripData as Trip);
                showToast("Viagem atualizada!", "success");
            } else {
                await addTrip(tripData);
                showToast("Viagem criada com sucesso!", "success");
            }

            clearDraft();
            setEditingTrip(undefined);
            setActiveTab('dashboard');
        } catch (err) {
            console.error("Error saving trip:", err);
            showToast("Erro ao salvar viagem.", "error");
        }
    };

    const displayedParticipants = !isParticipantsExpanded && formData.participants.length > 5
        ? formData.participants.slice(0, 4)
        : formData.participants;
    const remainingCount = formData.participants.length - displayedParticipants.length;

    return (
        <PageContainer>
            <PageHeader
                title={editingTrip ? 'Editar Viagem' : 'Nova Viagem'}
                description={editingTrip ? 'Atualize os detalhes da sua viagem.' : 'Comece a planejar sua próxima aventura.'}
                actions={
                    <Button variant="outline" onClick={handleCancel}>
                        Voltar
                    </Button>
                }
            />

            {/* Accessible Status Announcements */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isGeneratingImage && "Gerando imagem com inteligência artificial..."}
                {isOptimizing && "Sugerindo título criativo..."}
                {isSubmittingForm && "Salvando sua viagem..."}
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Draft Restore Notification */}
                {showRestorePrompt && (
                    <div className="bg-indigo-50 px-6 py-4 border border-indigo-100 rounded-xl mb-6 flex items-center justify-between animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">history</span>
                            <span className="text-sm font-bold text-indigo-900">Encontramos um rascunho anterior. Deseja restaurar?</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    loadDraft();
                                    setShowRestorePrompt(false);
                                }}
                                className="text-xs font-bold uppercase bg-white px-4 py-2 rounded-lg text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                            >
                                Restaurar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    clearDraft();
                                    setShowRestorePrompt(false);
                                }}
                                className="text-xs font-bold uppercase text-indigo-400 hover:text-indigo-600 px-3 py-2"
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                )}

                <Card className="p-0 overflow-hidden shadow-soft">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Cover Image */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Capa da Viagem</label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={imageSize}
                                                onChange={(e) => setImageSize(e.target.value as any)}
                                                className="text-[10px] py-1 px-2 h-7 rounded border-gray-200 bg-gray-50 font-bold"
                                                aria-label="Tamanho da imagem"
                                            >
                                                <option value="1K">1K</option>
                                                <option value="2K">2K</option>
                                                <option value="4K">4K</option>
                                            </select>
                                            <button
                                                type="button"
                                                disabled={isGeneratingImage}
                                                onClick={handleGenerateImage}
                                                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 disabled:opacity-50"
                                            >
                                                {isGeneratingImage ? <span className="animate-spin text-[12px]">refresh</span> : <span className="material-symbols-outlined text-sm">auto_awesome</span>}
                                                Gerar com IA
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        onClick={triggerFileInput}
                                        className="relative h-48 w-full rounded-xl overflow-hidden cursor-pointer group bg-gray-100 border-2 border-dashed border-gray-200 hover:border-primary transition-all shadow-inner"
                                    >
                                        <img
                                            src={formData.coverImage}
                                            alt="Trip Cover Preview"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        {isGeneratingImage && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="animate-spin material-symbols-outlined text-3xl text-indigo-600">refresh</span>
                                                    <span className="text-[10px] font-bold text-indigo-600 animate-pulse">CRIANDO ARTE...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                            <span className="text-xs font-bold uppercase tracking-wider">Alterar Foto</span>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" aria-label="Upload de capa" />
                                </div>

                                {/* Title */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="block text-xs font-bold text-text-muted uppercase tracking-wider">Título da Viagem</span>
                                        <button
                                            type="button"
                                            onClick={handleAISuggestion}
                                            disabled={isOptimizing || formData.detailedDestinations.length === 0}
                                            className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 disabled:opacity-30"
                                        >
                                            {isOptimizing ? <span className="animate-spin text-[12px]">refresh</span> : <span className="material-symbols-outlined text-sm">bolt</span>}
                                            Sugestão rápida
                                        </button>
                                    </div>
                                    <Controller
                                        name="title"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                required
                                                error={errors.title?.message as string}
                                                placeholder="Ex: Férias de Verão"
                                                fullWidth
                                            />
                                        )}
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">Status</label>
                                    <div className="flex gap-2">
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    {(['planning', 'confirmed', 'completed'] as TripStatus[]).map(s => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => field.onChange(s)}
                                                            className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-bold capitalize transition-all border-2 ${field.value === s ? 'bg-primary border-primary text-text-main' : 'bg-white border-gray-100 text-text-muted hover:border-primary/30'}`}
                                                            aria-pressed={field.value === s}
                                                        >
                                                            {s === 'planning' ? 'Planejando' : s === 'confirmed' ? 'Confirmado' : 'Concluído'}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Dates Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Quando vai ser a viagem?</label>
                                    </div>
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormValue('isFlexibleDates', false)}
                                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${!formData.isFlexibleDates ? 'bg-primary border-primary text-text-main' : 'bg-white border-gray-100 text-text-muted hover:border-primary/30'}`}
                                        >
                                            <Icon name="calendar_month" size="sm" className="mr-1.5" />
                                            Período Definido
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormValue('isFlexibleDates', true)}
                                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${formData.isFlexibleDates ? 'bg-primary border-primary text-text-main' : 'bg-white border-gray-100 text-text-muted hover:border-primary/30'}`}
                                        >
                                            <Icon name="event_available" size="sm" className="mr-1.5" />
                                            Flexível
                                        </button>
                                    </div>
                                    {!formData.isFlexibleDates && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Controller
                                                name="startDate"
                                                control={control}
                                                render={({ field }) => (
                                                    <div>
                                                        <input
                                                            {...field}
                                                            required={!formData.isFlexibleDates}
                                                            type="date"
                                                            className={`w-full rounded-xl border-gray-100 bg-gray-50 py-3 px-4 text-sm font-medium ${errors.startDate ? 'border-red-300 bg-red-50' : ''}`}
                                                            aria-label="Data de início"
                                                        />
                                                        <span className="text-[10px] text-text-muted mt-1 block">Início</span>
                                                    </div>
                                                )}
                                            />
                                            <Controller
                                                name="endDate"
                                                control={control}
                                                render={({ field }) => (
                                                    <div>
                                                        <input
                                                            {...field}
                                                            required={!formData.isFlexibleDates}
                                                            type="date"
                                                            className={`w-full rounded-xl border-gray-100 bg-gray-50 py-3 px-4 text-sm font-medium ${errors.endDate ? 'border-red-300 bg-red-50' : ''}`}
                                                            aria-label="Data de fim"
                                                        />
                                                        <span className="text-[10px] text-text-muted mt-1 block">Fim</span>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    )}
                                    {errors.endDate && <p className="text-[10px] text-red-500 font-bold">{errors.endDate.message as string}</p>}
                                    {!formData.isFlexibleDates && duration !== null && duration > 0 && (
                                        <span className="text-[10px] font-extrabold bg-primary/30 text-primary-dark px-2 py-0.5 rounded uppercase inline-block">
                                            {duration} {duration === 1 ? 'dia' : 'dias'}
                                        </span>
                                    )}
                                    {formData.isFlexibleDates && (
                                        <p className="text-xs text-text-muted bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <Icon name="info" size="sm" className="mr-1 text-amber-500" />
                                            Você poderá definir as datas exatas mais tarde.
                                        </p>
                                    )}
                                </div>

                                {/* Destinations */}
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">Cidades / Destinos</label>
                                    <div className="relative">
                                        {!mapsLoaded ? (
                                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-text-muted flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                Carregando Google Maps...
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`rounded-xl border p-2 min-h-[48px] flex flex-wrap gap-2 items-center ${errors.destination ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                                                    {formData.detailedDestinations.map((dest) => (
                                                        <div key={dest.id} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                                                            <Icon name="location_on" size="sm" className="text-primary-dark" />
                                                            <span className="text-xs font-semibold text-text-main">{dest.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveDestination(dest.id)}
                                                                className="text-text-muted hover:text-red-500 transition-colors"
                                                                aria-label={`Remover ${dest.name}`}
                                                            >
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={e => setValue(e.target.value)}
                                                        disabled={!ready}
                                                        placeholder={formData.detailedDestinations.length === 0 ? "Buscar cidade..." : "Adicionar outra..."}
                                                        className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm font-medium text-text-main placeholder:text-text-muted"
                                                        aria-label="Buscar destinos"
                                                    />
                                                </div>
                                                {errors.destination && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.destination.message as string}</p>}

                                                {status === 'OK' && (
                                                    <ul className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                        {data.map(({ place_id, description }) => (
                                                            <li
                                                                key={place_id}
                                                                onClick={() => handleSelectPlace(description, place_id)}
                                                                className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Icon name="location_on" size="sm" className="text-gray-400" />
                                                                <span className="text-sm text-text-main">{description}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* City Date Ranges */}
                                {formData.detailedDestinations.length > 0 && !formData.isFlexibleDates && (
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Período em cada cidade</label>
                                        <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                                            {formData.detailedDestinations.map((dest) => (
                                                <div key={dest.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-2 min-w-[100px] max-w-[120px]">
                                                        <Icon name="location_on" size="sm" className="text-primary-dark" />
                                                        <span className="text-xs font-semibold text-text-main truncate" title={dest.name}>{dest.name}</span>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                                        <input
                                                            type="date"
                                                            value={dest.startDate || ''}
                                                            min={formData.startDate}
                                                            max={formData.endDate}
                                                            onChange={e => handleDestinationDateChange(dest.id, 'startDate', e.target.value)}
                                                            className="w-full rounded-lg border-gray-200 bg-white py-2 px-3 text-xs font-medium"
                                                            aria-label={`Chegada em ${dest.name}`}
                                                        />
                                                        <input
                                                            type="date"
                                                            value={dest.endDate || ''}
                                                            min={dest.startDate || formData.startDate}
                                                            max={formData.endDate}
                                                            onChange={e => handleDestinationDateChange(dest.id, 'endDate', e.target.value)}
                                                            className="w-full rounded-lg border-gray-200 bg-white py-2 px-3 text-xs font-medium"
                                                            aria-label={`Saída de ${dest.name}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Participants */}
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">Participantes</label>
                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1 flex gap-2">
                                            <Input
                                                value={newParticipantName}
                                                onChange={e => setNewParticipantName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                                                placeholder="Nome"
                                                className="flex-1"
                                            />
                                            <Input
                                                value={newParticipantEmail}
                                                onChange={e => setNewParticipantEmail(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                                                placeholder="E-mail"
                                                type="email"
                                                className="flex-1"
                                            />
                                        </div>
                                        <button type="button" onClick={handleAddParticipant} className="bg-primary text-text-main size-10 rounded-xl flex items-center justify-center hover:bg-primary-dark transition-all active:scale-95 shrink-0" aria-label="Adicionar participante">
                                            <Icon name="person_add" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                        {displayedParticipants.map((p) => (
                                            <div key={p.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-2 py-1.5 rounded-xl group transition-all hover:border-primary/50">
                                                <img src={p.avatar} className="size-6 rounded-lg object-cover" alt={p.name} />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-text-main max-w-[100px] truncate">{p.name}</span>
                                                    {p.email && <span className="text-[9px] text-text-muted truncate max-w-[100px]">{p.email}</span>}
                                                </div>
                                                {p.id !== user?.id && <button type="button" onClick={() => handleRemoveParticipant(p.id)} className="text-text-muted hover:text-red-500 transition-colors" aria-label={`Remover ${p.name}`}><span className="material-symbols-outlined text-sm">close</span></button>}
                                                {p.id === user?.id && <span className="text-[8px] font-bold text-primary-dark uppercase px-1.5 py-0.5 bg-primary/20 rounded">Eu</span>}
                                            </div>
                                        ))}
                                        {remainingCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsParticipantsExpanded(true)}
                                                className="size-8 rounded-xl bg-primary/20 text-primary-dark text-[10px] font-bold flex items-center justify-center hover:bg-primary/30 transition-all border border-primary/20"
                                            >
                                                +{remainingCount}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit buttons */}
                        <div className="flex items-center justify-between pt-8 border-t border-gray-100 gap-6">
                            <div className="flex items-center gap-2">
                                {lastSaved && !editingTrip && (
                                    <div className="flex items-center gap-1.5 text-green-600 animate-in fade-in slide-in-from-left-2 duration-500">
                                        <span className="material-symbols-outlined text-sm">cloud_done</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Rascunho salvo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button variant="outline" onClick={handleCancel} className="flex-1 md:flex-none" type="button">Cancelar</Button>
                                <Button variant="dark" className="flex-1 md:flex-none min-w-[200px]" type="submit" disabled={isSubmittingForm}>
                                    {isSubmittingForm ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                            Salvando...
                                        </div>
                                    ) : (
                                        editingTrip ? 'Salvar Alterações' : 'Criar Viagem'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </PageContainer>
    );
};

export default CreateTrip;
