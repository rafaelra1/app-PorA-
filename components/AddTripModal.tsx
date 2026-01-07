
import React, { useState, useRef, useEffect } from 'react';
import { Trip, TripStatus, Participant, DetailedDestination } from '../types';
import { Button, Card, Input, Icon, LoadingSpinner } from './ui/Base';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";
import { parseDisplayDate, formatToDisplayDate, calculateDuration as calcDuration } from '../lib/dateUtils';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trip: Trip) => void;
  onUpdate?: (trip: Trip) => void;
  initialTrip?: Trip;
}

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const AddTripModal: React.FC<AddTripModalProps> = ({ isOpen, onClose, onAdd, onUpdate, initialTrip }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false);
  const [detailedDestinations, setDetailedDestinations] = useState<DetailedDestination[]>([]);
  const [isFlexibleDates, setIsFlexibleDates] = useState(false);

  // Load Google Maps Script
  const { isLoaded: mapsLoaded, loadError: mapsError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    status: 'planning' as TripStatus,
    coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000',
    participants: user ? [user as Participant] : [] as Participant[]
  });

  // Places Autocomplete - only works when mapsLoaded is true
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
    if (initialTrip) {
      const initialDestinations = initialTrip.detailedDestinations ||
        initialTrip.destination.split(',').map((d, i) => ({
          id: `dest-${i}`,
          name: d.trim(),
        })).filter(d => d.name.length > 0);
      setDetailedDestinations(initialDestinations);
      setIsFlexibleDates(initialTrip.isFlexibleDates || false);
      setFormData({
        title: initialTrip.title,
        destination: initialTrip.destination,
        startDate: parseDisplayDate(initialTrip.startDate),
        endDate: parseDisplayDate(initialTrip.endDate),
        status: initialTrip.status,
        coverImage: initialTrip.coverImage,
        participants: initialTrip.participants
      });
    } else {
      setDetailedDestinations([]);
      setIsFlexibleDates(false);
      setFormData({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        status: 'planning',
        coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000',
        participants: user ? [user as Participant] : []
      });
    }
    setValue('');
    setIsParticipantsExpanded(false);
  }, [initialTrip, isOpen, user, setValue]);

  const duration = calcDuration(formData.startDate, formData.endDate);

  if (!isOpen) return null;

  const handleGenerateImage = async () => {
    const destinationNames = detailedDestinations.map(d => d.name).join(', ') || formData.destination;
    if (!destinationNames) {
      alert("Por favor, informe um destino para gerar a imagem.");
      return;
    }

    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGeneratingImage(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        alert("Chave de API não configurada. Por favor, adicione sua GEMINI_API_KEY no arquivo .env.local");
        setIsGeneratingImage(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A high-quality, professional travel photography of ${destinationNames}, cinematic lighting, wide angle.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: imageSize
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setFormData({ ...formData, coverImage: `data:image/png;base64,${part.inlineData.data}` });
            break;
          }
        }
      }
    } catch (error) {
      console.error("Image generation failed", error);
      alert("Falha ao gerar imagem. Tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAISuggestion = async () => {
    const destinationNames = detailedDestinations.map(d => d.name).join(', ') || formData.destination;
    if (!destinationNames) return;
    setIsOptimizing(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        alert("Chave de API não configurada. Por favor, adicione sua GEMINI_API_KEY no arquivo .env.local");
        setIsOptimizing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Sugira um título criativo para uma viagem para ${destinationNames}. Responda apenas o título.`,
      });
      if (response.text) {
        setFormData({ ...formData, title: response.text.replace(/"/g, '').trim() });
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
        setFormData({
          ...formData,
          coverImage: reader.result as string
        });
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

    // Check for duplicates
    if (detailedDestinations.some(d => d.name.toLowerCase() === description.toLowerCase())) {
      return;
    }

    // Extract city name (first part before comma)
    const cityName = description.split(',')[0].trim();

    // Use Google Places API to get details including country and photo
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    service.getDetails(
      { placeId, fields: ['name', 'address_components', 'photos'] },
      (place, status) => {
        let country = '';
        let photoUrl: string | undefined;

        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // Extract country from address components
          place.address_components?.forEach(comp => {
            if (comp.types.includes('country')) {
              country = comp.long_name;
            }
          });

          // Get photo URL if available
          if (place.photos && place.photos.length > 0) {
            photoUrl = place.photos[0].getUrl({ maxWidth: 1600 });
          }
        }

        // Fallback: extract country from description (e.g., "Paris, France" -> "France")
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

        const newList = [...detailedDestinations, newDest];
        setDetailedDestinations(newList);
        setFormData({ ...formData, destination: newList.map(d => d.name).join(', ') });
      }
    );
  };

  const handleRemoveDestination = (id: string) => {
    const newList = detailedDestinations.filter(d => d.id !== id);
    setDetailedDestinations(newList);
    setFormData({ ...formData, destination: newList.map(d => d.name).join(', ') });
  };

  const handleDestinationDateChange = (id: string, field: 'startDate' | 'endDate', value: string) => {
    setDetailedDestinations(prev => prev.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
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
    setFormData({
      ...formData,
      participants: [...formData.participants, newParticipant]
    });
    setNewParticipantName('');
    setNewParticipantEmail('');
    if (formData.participants.length >= 5) {
      setIsParticipantsExpanded(true);
    }
  };

  const handleRemoveParticipant = (id: string) => {
    if (id === user?.id) return;
    setFormData({
      ...formData,
      participants: formData.participants.filter(p => p.id !== id)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tripData: Trip = {
      id: initialTrip?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      destination: detailedDestinations.map(d => d.name).join(', '),
      detailedDestinations: detailedDestinations,
      isFlexibleDates: isFlexibleDates,
      startDate: isFlexibleDates ? '' : formatToDisplayDate(formData.startDate),
      endDate: isFlexibleDates ? '' : formatToDisplayDate(formData.endDate)
    };

    if (initialTrip && onUpdate) {
      onUpdate(tripData);
    } else {
      onAdd(tripData);
    }

    onClose();
  };

  const displayedParticipants = !isParticipantsExpanded && formData.participants.length > 5
    ? formData.participants.slice(0, 4)
    : formData.participants;
  const remainingCount = formData.participants.length - displayedParticipants.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <Card className="relative w-full max-w-lg overflow-hidden animate-zoom-in shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Icon name={initialTrip ? 'edit_location_alt' : 'add_location_alt'} className="text-primary-dark" filled />
            {initialTrip ? 'Editar Viagem' : 'Nova Viagem'}
          </h2>
          <button onClick={onClose} className="size-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-text-muted transition-all">
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 hide-scrollbar">
          {/* Cover Image */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Capa da Viagem</label>
              <div className="flex gap-2 items-center">
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="text-[10px] py-0 px-2 h-6 rounded border-gray-200 bg-gray-50 font-bold"
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
              className="relative h-40 w-full rounded-xl overflow-hidden cursor-pointer group bg-gray-100 border-2 border-dashed border-gray-200 hover:border-primary transition-all shadow-inner"
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          {/* Title */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Título da Viagem</label>
                <button
                  type="button"
                  onClick={handleAISuggestion}
                  disabled={isOptimizing || detailedDestinations.length === 0}
                  className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 disabled:opacity-30"
                >
                  {isOptimizing ? <span className="animate-spin text-[12px]">refresh</span> : <span className="material-symbols-outlined text-sm">bolt</span>}
                  Sugestão rápida
                </button>
              </div>
              <Input
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Férias de Verão"
                fullWidth
              />
            </div>

            {/* Dates Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Quando vai ser a viagem?</label>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setIsFlexibleDates(false)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${!isFlexibleDates ? 'bg-primary border-primary text-text-main' : 'bg-white border-gray-100 text-text-muted hover:border-primary/30'}`}
                >
                  <Icon name="calendar_month" size="sm" className="mr-1.5" />
                  Período Definido
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlexibleDates(true)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${isFlexibleDates ? 'bg-primary border-primary text-text-main' : 'bg-white border-gray-100 text-text-muted hover:border-primary/30'}`}
                >
                  <Icon name="event_available" size="sm" className="mr-1.5" />
                  Flexível
                </button>
              </div>
              {!isFlexibleDates && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input required type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full rounded-xl border-gray-100 bg-gray-50 py-3 px-4 text-sm font-medium" />
                    <span className="text-[10px] text-text-muted mt-1 block">Início</span>
                  </div>
                  <div>
                    <input required type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full rounded-xl border-gray-100 bg-gray-50 py-3 px-4 text-sm font-medium" />
                    <span className="text-[10px] text-text-muted mt-1 block">Fim</span>
                  </div>
                </div>
              )}
              {!isFlexibleDates && duration !== null && (
                <span className="text-[10px] font-extrabold bg-primary/30 text-primary-dark px-2 py-0.5 rounded uppercase inline-block">
                  {duration} {duration === 1 ? 'dia' : 'dias'}
                </span>
              )}
              {isFlexibleDates && (
                <p className="text-xs text-text-muted bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Icon name="info" size="sm" className="mr-1 text-amber-500" />
                  Você poderá definir as datas exatas mais tarde.
                </p>
              )}
            </div>

            {/* Destinations with Autocomplete */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">Cidades / Destinos</label>
              <div className="relative">
                {mapsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                    <Icon name="error" size="sm" />
                    Erro ao carregar Google Maps. Verifique a configuração da API.
                  </div>
                ) : !mapsLoaded ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-text-muted flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Carregando Google Maps...
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 min-h-[48px] flex flex-wrap gap-2 items-center">
                      {detailedDestinations.map((dest) => (
                        <div key={dest.id} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                          <Icon name="location_on" size="sm" className="text-primary-dark" />
                          <span className="text-xs font-semibold text-text-main">{dest.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDestination(dest.id)}
                            className="text-text-muted hover:text-red-500 transition-colors"
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
                        placeholder={detailedDestinations.length === 0 ? "Buscar cidade..." : "Adicionar outra..."}
                        className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm font-medium text-text-main placeholder:text-text-muted"
                      />
                    </div>
                    {/* Suggestions Dropdown */}
                    {status === 'OK' && (
                      <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
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
              {detailedDestinations.length === 0 && mapsLoaded && (
                <p className="text-[10px] text-text-muted mt-1">Comece a digitar para buscar cidades</p>
              )}
            </div>

            {/* City Date Ranges */}
            {detailedDestinations.length > 0 && !isFlexibleDates && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Período em cada cidade</label>
                {detailedDestinations.map((dest) => (
                  <div key={dest.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Icon name="location_on" size="sm" className="text-primary-dark" />
                      <span className="text-xs font-semibold text-text-main truncate">{dest.name}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dest.startDate || ''}
                        min={formData.startDate}
                        max={formData.endDate}
                        onChange={e => handleDestinationDateChange(dest.id, 'startDate', e.target.value)}
                        className="w-full rounded-lg border-gray-200 bg-white py-2 px-3 text-xs font-medium"
                        placeholder="Chegada"
                      />
                      <input
                        type="date"
                        value={dest.endDate || ''}
                        min={dest.startDate || formData.startDate}
                        max={formData.endDate}
                        onChange={e => handleDestinationDateChange(dest.id, 'endDate', e.target.value)}
                        className="w-full rounded-lg border-gray-200 bg-white py-2 px-3 text-xs font-medium"
                        placeholder="Saída"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  placeholder="E-mail (opcional)"
                  type="email"
                  className="flex-1"
                />
              </div>
              <button type="button" onClick={handleAddParticipant} className="bg-primary text-text-main size-10 rounded-xl flex items-center justify-center hover:bg-primary-dark transition-all active:scale-95 shrink-0">
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
                  {p.id !== user?.id && <button type="button" onClick={() => handleRemoveParticipant(p.id)} className="text-text-muted hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-sm">close</span></button>}
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

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">Status</label>
            <div className="flex gap-2">
              {(['planning', 'confirmed', 'completed'] as TripStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })} className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-bold capitalize transition-all border-2 ${formData.status === s ? 'bg-primary border-primary text-text-main' : 'bg-white border-gray-100 text-text-muted hover:border-primary/30'}`}>
                  {s === 'planning' ? 'Planejando' : s === 'confirmed' ? 'Confirmado' : 'Concluído'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 !py-2.5 !text-xs" type="button">Cancelar</Button>
            <Button variant="dark" className="flex-1 !py-2.5 !text-xs" type="submit">
              {initialTrip ? 'Salvar Alterações' : 'Criar Viagem'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddTripModal;
