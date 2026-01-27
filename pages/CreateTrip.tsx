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
    const { addTrip, updateTrip, editingTrip, setEditingTrip, deleteTrip } = useTrips();
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

    const handleSubmitDelete = async () => {
        if (!editingTrip) return;
        if (confirm('Tem certeza que deseja apagar esta viagem?')) {
            try {
                // Check if deleteTrip is available, if not show error/alert as it might be missing from context mock/types sometimes although we expect it
                if (deleteTrip) {
                    await deleteTrip(editingTrip.id);
                    showToast("Viagem excluída.", "success");
                    setActiveTab('dashboard');
                } else {
                    showToast("Erro: Função de excluir indisponível", "error");
                }
            } catch (error) {
                console.error("Error deleting trip", error);
                showToast("Erro ao excluir viagem.", "error");
            }
        }
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

    // Calculate duration for the card
    const durationDays = calcDuration(formData.startDate || '', formData.endDate || '');

    // Custom styled components for this specific design
    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-[#9C7CF4] text-white px-4 py-2 rounded-t-lg text-sm font-medium w-full">
            {children}
        </div>
    );

    const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
        <input
            {...props}
            ref={ref}
            className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#9C7CF4] focus:ring-1 focus:ring-[#9C7CF4] transition-all placeholder:text-gray-400 ${props.className}`}
        />
    ));

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
            {/* Header Area */}
            <div className="flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gray-200 overflow-hidden">
                        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Bem Vindo</p>
                        <h1 className="text-xl font-bold text-gray-800">{user?.name?.toUpperCase() || 'VIAJANTE'}</h1>
                    </div>
                </div>
                <div className="flex gap-4">
                    {/* Icons placeholder if needed */}
                </div>
            </div>

            <div className="flex-1 px-8 pb-8">
                <button
                    onClick={handleCancel}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 bg-gray-100 px-3 py-1.5 rounded-lg w-fit transition-colors"
                >
                    <span className="material-symbols-outlined text-lg mr-1">chevron_left</span>
                    página inicial
                </button>

                <div className="flex flex-col lg:flex-row gap-8 items-start max-w-7xl mx-auto">

                    {/* LEFT COLUMN - Summary Card & Menu */}
                    <div className="w-full lg:w-1/3 space-y-4">
                        {/* Green Card - Preview/Summary */}
                        <div className="bg-[#D4F541] rounded-3xl p-6 relative min-h-[220px] flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-800 text-lg mb-1">Destino</p>
                                    <h2 className="text-3xl font-black text-black leading-tight">
                                        {formData.destination || 'SEU DESTINO'}
                                    </h2>
                                </div>
                                <button className="text-black/70 hover:text-black">
                                    <span className="material-symbols-outlined text-3xl">more_vert</span>
                                </button>
                            </div>

                            <div className="mt-4">
                                <p className="text-lg text-gray-800 font-medium">
                                    {formData.startDate && formData.endDate
                                        ? `${formatToDisplayDate(formData.startDate)} a ${formatToDisplayDate(formData.endDate)}`
                                        : 'Data a definir'}
                                </p>
                            </div>

                            <div className="flex justify-between items-end mt-4">
                                <div className="flex -space-x-2">
                                    {formData.participants.slice(0, 3).map((p, i) => (
                                        <img
                                            key={i}
                                            src={p.avatar}
                                            alt={p.name}
                                            className="size-10 rounded-full border-2 border-[#D4F541] bg-white object-cover"
                                            title={p.name}
                                        />
                                    ))}
                                    {formData.participants.length > 3 && (
                                        <div className="size-10 rounded-full border-2 border-[#D4F541] bg-white flex items-center justify-center text-xs font-bold text-gray-600">
                                            +{formData.participants.length - 3}
                                        </div>
                                    )}
                                </div>
                                {/* Placeholder Flag or Icon */}
                                <div className="size-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
                                    <span className="text-xs">🇧🇷</span>
                                </div>
                            </div>
                        </div>

                        {/* Accordion Menu (Visual Only for now based on mockup) */}
                        <div className="space-y-2">
                            {['cidades', 'roteiro', 'custos', 'memórias'].map((item) => (
                                <div key={item} className="bg-[#FFD93D] rounded-xl px-6 py-3 flex justify-between items-center font-bold text-gray-800 cursor-pointer hover:bg-[#ffe066] transition-colors">
                                    <span>{item}</span>
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Form */}
                    <div className="w-full lg:w-2/3">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* Trip Name */}
                            <div className="space-y-0">
                                <SectionLabel>nome da viagem</SectionLabel>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="border-x border-b border-gray-200 rounded-b-lg p-3 bg-white">
                                            <StyledInput
                                                {...field}
                                                placeholder="Ex: Lua de mel Rio + Petrópolis"
                                                className="border-gray-300"
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Period */}
                            <div className="space-y-0">
                                <SectionLabel>período</SectionLabel>
                                <div className="border-x border-b border-gray-200 rounded-b-lg p-3 bg-white">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <Controller
                                                name="startDate"
                                                control={control}
                                                render={({ field }) => (
                                                    <StyledInput
                                                        {...field}
                                                        type="date"
                                                        className="border-gray-300"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-center justify-center text-gray-400 font-medium">a</div>
                                        <div className="flex-1">
                                            <Controller
                                                name="endDate"
                                                control={control}
                                                render={({ field }) => (
                                                    <StyledInput
                                                        {...field}
                                                        type="date"
                                                        className="border-gray-300"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cities & Dates */}
                            <div className="space-y-0">
                                <SectionLabel>cidades</SectionLabel>
                                <div className="border-x border-b border-gray-200 rounded-b-lg p-3 bg-white space-y-3">
                                    {formData.detailedDestinations.map((dest) => (
                                        <div key={dest.id} className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                                            <div className="flex-grow w-full md:w-auto relative group">
                                                <div className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm flex items-center justify-between">
                                                    <span>{dest.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDestination(dest.id)}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full md:w-auto">
                                                <input
                                                    type="date"
                                                    value={dest.startDate || ''}
                                                    onChange={(e) => handleDestinationDateChange(dest.id, 'startDate', e.target.value)}
                                                    className="w-full md:w-32 bg-white border border-gray-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#9C7CF4] text-gray-600"
                                                    placeholder="quando?"
                                                />
                                                <input
                                                    type="date"
                                                    value={dest.endDate || ''}
                                                    onChange={(e) => handleDestinationDateChange(dest.id, 'endDate', e.target.value)}
                                                    className="w-full md:w-32 bg-white border border-gray-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#9C7CF4] text-gray-600"
                                                    placeholder="quando?"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add City Input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={e => setValue(e.target.value)}
                                            disabled={!ready}
                                            placeholder={formData.detailedDestinations.length === 0 ? "Adicionar cidade..." : "Adicionar outra cidade..."}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#9C7CF4] placeholder:text-gray-400"
                                        />
                                        {status === 'OK' && (
                                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {data.map(({ place_id, description }) => (
                                                    <li
                                                        key={place_id}
                                                        onClick={() => handleSelectPlace(description, place_id)}
                                                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-700 hover:text-[#9C7CF4]"
                                                    >
                                                        {description}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="space-y-0">
                                <SectionLabel>participantes</SectionLabel>
                                <div className="border-x border-b border-gray-200 rounded-b-lg p-3 bg-white space-y-3">
                                    {formData.participants.map((p) => (
                                        <div key={p.id} className="flex flex-col md:flex-row gap-2 items-center">
                                            <div className="flex-1 w-full relative group">
                                                <div className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                                                    <img src={p.avatar} alt="" className="size-5 rounded-full" />
                                                    <span className="flex-1">{p.name}</span>
                                                    {p.id !== user?.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveParticipant(p.id)}
                                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full md:w-1/3">
                                                <input
                                                    type="email"
                                                    value={p.email || ''}
                                                    readOnly={p.id === user?.id} // Only edit email for guests usually, or allow edit if needed
                                                    disabled={p.id === user?.id}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none text-gray-500"
                                                    placeholder="e-mail"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Participant Row */}
                                    <div className="flex flex-col md:flex-row gap-2 items-center">
                                        <div className="flex-1 w-full">
                                            <StyledInput
                                                value={newParticipantName}
                                                onChange={e => setNewParticipantName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                                                placeholder="Nome do participante"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <div className="w-full md:w-1/3">
                                            <StyledInput
                                                value={newParticipantEmail}
                                                onChange={e => setNewParticipantEmail(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                                                placeholder="e-mail"
                                                type="email"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddParticipant}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-4 pt-6">
                                <Button
                                    type="button"
                                    onClick={handleSubmitDelete}
                                    className="bg-[#4A4A4A] hover:bg-gray-800 text-white px-8 py-2.5 rounded-xl font-medium"
                                >
                                    apagar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingForm}
                                    className="bg-[#6B5B95] hover:bg-[#5a4b7e] text-white px-8 py-2.5 rounded-xl font-medium min-w-[120px]"
                                >
                                    {isSubmittingForm ? 'salvando...' : 'salvar'}
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTrip;
