
import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateNights, formatToDisplayDate } from '../lib/dateUtils';

import {
  Trip,
  SubTab,
  CityTab,
  DocsFilter,
  City,
  Activity,
  HotelReservation,
  JournalEntry,
  Attraction,
  Expense,
  ExpenseCategory,
  ExpenseFilter,
  Transport,
  TransportType,
  ItineraryActivity
} from '../types';
import { DEMO_JOURNAL, DEMO_USER } from '../constants';
import { getGeminiService } from '../services/geminiService';

// Existing Trip Details Components
import TripDetailsHeader from '../components/trip-details/TripDetailsHeader';
import TripTabs from '../components/trip-details/TripTabs';
import ItineraryView from '../components/trip-details/itinerary/ItineraryView';
import CitiesView from '../components/trip-details/cities/CitiesView';
import DocumentsView from '../components/trip-details/documents/DocumentsView';
import JournalView from '../components/trip-details/journal/JournalView';
import OverviewTab from '../components/trip-details/overview/OverviewTab';
import CityGuideLayout from '../components/trip-details/city-guide/CityGuideLayout';
import InfoTab from '../components/trip-details/city-guide/InfoTab';
import AttractionsTab from '../components/trip-details/city-guide/AttractionsTab';
import GastronomyTab from '../components/trip-details/city-guide/GastronomyTab';
import TipsTab from '../components/trip-details/city-guide/TipsTab';

// Modal imports
import ImageEditorModal from '../components/trip-details/modals/ImageEditorModal';
import AttractionDetailModal from '../components/trip-details/modals/AttractionDetailModal';
import AddCityModal from '../components/trip-details/modals/AddCityModal';
import AddAttractionModal from '../components/trip-details/modals/AddAttractionModal';
import AttractionMapModal from '../components/trip-details/modals/AttractionMapModal';
import AddDocumentModal from '../components/trip-details/modals/AddDocumentModal';
import AddExpenseModal from '../components/trip-details/modals/AddExpenseModal';
import ShareTripModal from '../components/trip-details/modals/ShareTripModal';
import AddAccommodationModal from '../components/trip-details/modals/AddAccommodationModal';
import AddTransportModal from '../components/trip-details/modals/AddTransportModal';
import { AccommodationProvider, useAccommodation } from '../contexts/AccommodationContext';
import { TransportProvider, useTransport } from '../contexts/TransportContext';
import TransportView from '../components/trip-details/transport/TransportView';
import Modal from '../components/trip-details/modals/Modal';
import { Button } from '../components/ui/Base';
import AddActivityModal from '../components/trip-details/modals/AddActivityModal';

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
  onEdit: () => void;
}

const TripDetailsContent: React.FC<TripDetailsProps> = ({ trip, onBack, onEdit }) => {
  // Inner Trip Details State (Tabs)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [activeCityTab, setActiveCityTab] = useState<CityTab>('info');
  const [docsFilter, setDocsFilter] = useState<DocsFilter>('Tudo');

  // Itinerary state
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [itineraryActivities, setItineraryActivities] = useLocalStorage<ItineraryActivity[]>(`porai_trip_${trip.id}_itinerary_activities`, []);

  // Cities state
  const [cities, setCities] = useLocalStorage<City[]>(`porai_trip_${trip.id}_cities`, []);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityGuide, setCityGuide] = useState<any>(null);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);

  // Sync cities from trip.detailedDestinations whenever they change
  useEffect(() => {
    if (trip.detailedDestinations?.length) {
      setCities(prevCities => {
        // Create a map of existing cities to preserve unique local data (like replaced images)
        const existingCitiesMap = new Map(prevCities.map(c => [c.id, c]));

        const syncedCities: City[] = trip.detailedDestinations!.map(dest => {
          const existing = existingCitiesMap.get(dest.id);

          return {
            // Mandate these fields from the trip source of truth
            id: dest.id,
            name: dest.name,
            country: dest.country || '',
            arrivalDate: dest.startDate || trip.startDate || '',
            departureDate: dest.endDate || trip.endDate || '',
            nights: calculateNights(dest.startDate || '', dest.endDate || ''),

            // Preserve or initialize these fields
            headline: existing?.headline || `Explore as maravilhas de ${dest.name}`,
            image: existing?.image || dest.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(dest.name + ' city')}`,
            editorialContent: existing?.editorialContent,
          };
        });

        // Sort cities chronologically
        syncedCities.sort((a, b) => {
          const getDate = (dateStr: string) => {
            if (!dateStr) return 0;
            // Handle DD/MM/YYYY format
            if (dateStr.includes('/')) {
              const [d, m, y] = dateStr.split('/');
              return new Date(`${y}-${m}-${d}`).getTime();
            }
            // Handle YYYY-MM-DD format
            return new Date(dateStr).getTime();
          };
          return getDate(a.arrivalDate) - getDate(b.arrivalDate);
        });

        // Only update if there are actual changes to avoid infinite loops if the reference changes but content doesn't
        // (Simple JSON stringify check is often enough for this scale, or just rely on React's state setter optimization if strictly equal, but here we are creating new objects)
        const hasChanges = JSON.stringify(prevCities) !== JSON.stringify(syncedCities);
        return hasChanges ? syncedCities : prevCities;
      });
    }
  }, [trip.detailedDestinations, trip.startDate, trip.endDate, setCities]);

  // Grounding state
  const [groundingInfo, setGroundingInfo] = useState<string>('');
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [isGroundingLoading, setIsGroundingLoading] = useState(false);

  // Attractions state
  const [attractionSearch, setAttractionSearch] = useState('');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [genAspectRatio, setGenAspectRatio] = useState<string>("4:3");
  const [genSize, setGenSize] = useState<string>("1K");
  const [isSuggestingAI, setIsSuggestingAI] = useState(false);

  // Image editing state
  const [editingImage, setEditingImage] = useState<{ type: 'attraction' | 'dish', index: number, data: any } | null>(null);
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);
  const [isGeneratingEditorial, setIsGeneratingEditorial] = useState(false);

  // Documents state
  const [extraDocuments, setExtraDocuments] = useLocalStorage<any[]>(`porai_trip_${trip.id}_documents`, []);

  // Accommodations (Context)
  const {
    accommodations: hotels,
    addAccommodation: addAccContext,
    deleteAccommodation: deleteAccContext,
    updateAccommodation: updateAccContext,
    fetchAccommodations,
    migrateFromLocalStorage
  } = useAccommodation();

  // Local storage for migration checking only
  const [localHotels, setLocalHotels] = useLocalStorage<HotelReservation[]>(`porai_trip_${trip.id}_hotels`, []);

  // Fetch accommodations on mount
  useEffect(() => {
    if (trip.id) {
      fetchAccommodations(trip.id);

      // Migration Check
      if (localHotels.length > 0) {
        console.log('Migrating local hotels to Supabase...');
        migrateFromLocalStorage(trip.id, localHotels).then(() => {
          setLocalHotels([]); // Clear local after migration
        });
      }
    }
  }, [trip.id]);

  const [selectedAccommodation, setSelectedAccommodation] = useState<HotelReservation | null>(null);
  const [targetCityId, setTargetCityId] = useState<string | null>(null);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newJournalContent, setNewJournalContent] = useState('');
  const [newJournalLocation, setNewJournalLocation] = useState('');

  // Expenses state
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(`porai_trip_${trip.id}_expenses`, []);
  const [expenseFilter, setExpenseFilter] = useState<ExpenseFilter>('todas');
  const [totalBudget] = useState(5000);

  // Transport state (Context)
  const {
    transports,
    addTransport: addTransportContext,
    updateTransport: updateTransportContext,
    deleteTransport: deleteTransportContext,
    fetchTransports: fetchTransportsContext
  } = useTransport();

  // Fetch transports on load
  useEffect(() => {
    if (trip.id) {
      fetchTransportsContext(trip.id);
    }
  }, [trip.id]);

  // Remove local filter state as it's handled in TransportView now
  // const [transportFilter, setTransportFilter] = useState<TransportType | 'all'>('all');

  // Modals
  const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
  const [isAddAttractionModalOpen, setIsAddAttractionModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddAccommodationModalOpen, setIsAddAccommodationModalOpen] = useState(false);
  const [isAddTransportModalOpen, setIsAddTransportModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [selectedActivityDay, setSelectedActivityDay] = useState<{ day: number; date: string } | null>(null);

  // Handlers
  const handleGenerateItinerary = async () => setIsGenerating(false); // Mock
  const fetchCityGuide = async (city: City) => {
    setIsLoadingGuide(true);
    // Mock fetch delay
    setTimeout(() => {
      setIsLoadingGuide(false);

      const isKyoto = city.name.toLowerCase().includes('kyoto') || city.name.toLowerCase().includes('quioto');
      const isParis = city.name.toLowerCase().includes('paris');
      const isAthens = city.name.toLowerCase().includes('atenas') || city.name.toLowerCase().includes('athens');

      setCityGuide({
        overview: `${city.name} é um destino incrível repleto de história e cultura.`,
        attractions: [
          {
            name: isAthens ? 'Acrópole de Atenas' : isParis ? 'Torre Eiffel' : isKyoto ? 'Templo Kinkaku-ji' : `Centro Histórico de ${city.name}`,
            description: isAthens ? 'A cidadela antiga mais famosa do mundo, contendo o Parthenon.' : `Um dos marcos mais icônicos de ${city.name}, imperdível para qualquer visitante.`,
            image: isAthens ? 'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&q=80&w=1000' :
              isParis ? 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&q=80&w=1000' :
                isKyoto ? 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&q=80&w=1000' :
                  'https://images.unsplash.com/photo-1565017836-39833cb9352e?auto=format&fit=crop&q=80&w=1000',
            category: 'Histórico',
            rating: 4.9,
            time: '08:00 - 20:00',
            price: '€ 20',
            type: 'Patrimônio'
          },
          {
            name: isAthens ? 'Museu da Acrópole' : isParis ? 'Museu do Louvre' : `Museu Nacional de ${city.name}`,
            description: `Museu arqueológico focado nos achados e cultura de ${city.name}.`,
            image: isAthens ? 'https://images.unsplash.com/photo-1599423300746-b62507ac9705?auto=format&fit=crop&q=80&w=1000' :
              isParis ? 'https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?auto=format&fit=crop&q=80&w=1000' :
                'https://images.unsplash.com/photo-1566835062-85888d3eb64f?auto=format&fit=crop&q=80&w=1000',
            category: 'Museu',
            rating: 4.8,
            time: '09:00 - 17:00',
            price: '€ 10',
            type: 'Museu'
          },
          {
            name: isAthens ? 'Plaka' : isParis ? 'Montmartre' : `Bairro Boêmio de ${city.name}`,
            description: `Bairro histórico e vibrante de ${city.name}, perfeito para passear.`,
            image: isAthens ? 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&q=80&w=1000' :
              isParis ? 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000' :
                'https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&q=80&w=1000',
            category: 'Urbano',
            rating: 4.7,
            time: '24 Horas',
            price: 'Grátis',
            type: 'Bairro'
          },
          {
            name: `Parque Central de ${city.name}`,
            description: 'Um belo espaço verde no coração da cidade para relaxar.',
            image: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&q=80&w=1000',
            category: 'Natureza',
            rating: 4.6,
            time: '06:00 - 22:00',
            price: 'Grátis',
            type: 'Parque'
          },
          {
            name: `Mercado Local de ${city.name}`,
            description: 'O melhor lugar para experimentar sabores locais.',
            image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1000',
            category: 'Urbano',
            rating: 4.5,
            time: '08:00 - 18:00',
            price: 'Grátis',
            type: 'Mercado'
          }
        ],
        typicalDishes: [],
        gastronomy: [
          {
            id: 'g1',
            name: `Restaurante Tradicional de ${city.name}`,
            category: 'Local',
            description: 'Culinária autêntica com receitas passadas de geração em geração.',
            price: '$$',
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000',
            address: `Centro de ${city.name}`,
            hours: { open: '12:00', close: '23:00', text: 'Daily' },
            isOpen: true
          },
          {
            id: 'g2',
            name: `Café ${city.name} Special`,
            category: 'Café',
            description: 'O melhor café da cidade com uma vista incrível.',
            price: '$$',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000',
            address: `Avenida Principal, ${city.name}`,
            hours: { open: '08:00', close: '20:00', text: 'Daily' },
            isOpen: true
          },
          {
            id: 'g3',
            name: `Street Food ${city.name}`,
            category: 'Street Food',
            description: 'Sabores rápidos e deliciosos nas ruas da cidade.',
            price: '$',
            rating: 4.5,
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000',
            address: `Ruas de ${city.name}`,
            hours: { open: '10:00', close: '22:00', text: 'Daily' },
            isOpen: true
          }
        ],
        tips: [],
        essentials: isAthens ? [
          { icon: 'power', title: 'Tomadas', description: 'Tipo C / F (230V). Leve adaptador.' },
          { icon: 'water_drop', title: 'Água da Torneira', description: 'Geralmente segura, mas água engarrafada é comum.' },
          { icon: 'payments', title: 'Gorjetas', description: 'Não obrigatórias, mas arredondar é apreciado.' }
        ] : isParis ? [
          { icon: 'power', title: 'Tomadas', description: 'Tipo E (230V). Adaptador necessário.' },
          { icon: 'water_drop', title: 'Água da Torneira', description: 'Potável e de boa qualidade (Eau de Paris).' },
          { icon: 'payments', title: 'Gorjetas', description: 'Serviço incluído, mas deixar troco é educado.' }
        ] : [
          { icon: 'power', title: 'Tomadas', description: 'Verifique o padrão local (Geralmente Tipo A/B/C).' },
          { icon: 'water_drop', title: 'Água da Torneira', description: 'Verifique se é potável no local.' },
          { icon: 'payments', title: 'Gorjetas', description: 'Verifique os costumes locais.' }
        ],
        emergency: isAthens ? {
          police: '100',
          ambulance: '166',
          embassy: { label: 'Embaixada Brasileira', phone: '+30 210 721 3039', address: 'Plateia Filikis Eterias 14' }
        } : isParis ? {
          police: '17',
          ambulance: '15',
          embassy: { label: 'Consulado Geral', phone: '+33 1 45 61 63 00', address: '34 Cours Albert 1er' }
        } : {
          police: '911/112',
          ambulance: '911/112',
          embassy: { label: 'Consulado Brasileiro', phone: '+00 0000-0000', address: 'Endereço da Embaixada' }
        }
      });
    }, 1000);
  };
  const fetchGroundingInfo = async () => { };
  const handleGenerateAllImages = async () => { };
  const handleEditImageComplete = async () => { };
  const handleUpdateEditorialContent = (content: string) => {
    if (!selectedCity) return;

    // Update selected city immediately
    setSelectedCity(prev => prev ? { ...prev, editorialContent: content } : null);

    // Update cities list (which persists to localStorage)
    setCities(prev => prev.map(c => c.id === selectedCity.id ? { ...c, editorialContent: content } : c));
  };
  const handleGenerateEditorial = async () => { };

  const handleManualAddAttraction = () => { };
  const handleSuggestAI = async () => { };
  const handleAddJournalEntry = () => {
    if (!newJournalContent.trim()) return;
    setJournalEntries([{ id: 'j-new', author: DEMO_USER, timestamp: 'Now', location: 'Location', content: newJournalContent, likes: 0, comments: 0 }, ...journalEntries]);
    setNewJournalContent('');
  };
  const handleOpenCityDetail = async (city: City) => {
    setSelectedCity(city);
    setCityGuide(null);
    setActiveCityTab('info');
    setActiveSubTab('cities');
    await fetchCityGuide(city);
  };
  const handleAddCity = async (newCityData: any) => {
    const newCityId = Math.random().toString(36).substr(2, 9);
    const placeholderImage = newCityData.image || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1000";
    const newCity: City = {
      id: newCityId, ...newCityData, image: placeholderImage,
      editorialContent: `Explore as maravilhas de ${newCityData.name}, ${newCityData.country}.`
    };
    setCities(prev => [...prev, newCity]);
  };
  const handleAddDocument = (newDoc: any) => {
    const docWithId = { ...newDoc, id: Math.random().toString(36).substr(2, 9), status: 'confirmed' };
    setExtraDocuments(prev => [...prev, docWithId]);
  };

  // Delete State
  const [deletingAccommodationId, setDeletingAccommodationId] = useState<string | null>(null);

  const handleDeleteAccommodation = (id: string) => {
    setDeletingAccommodationId(id);
  };

  const handleConfirmDeleteAccommodation = () => {
    if (deletingAccommodationId && trip.id) {
      deleteAccContext(trip.id, deletingAccommodationId);
      setDeletingAccommodationId(null);
    }
  };

  const handleAddAccommodation = async (newAccommodation: Omit<HotelReservation, 'id'>) => {
    if (!trip.id) return;

    const accommodationData = {
      ...newAccommodation,
      cityId: targetCityId || undefined
    };

    // Add via Context
    const newId = await addAccContext(trip.id, accommodationData);

    // Auto-fetch rating and stars via Gemini + Google Places after saving
    try {
      const { getGeminiService } = await import('../services/geminiService');
      const { googlePlacesService } = await import('../services/googlePlacesService');

      const geminiService = getGeminiService();

      const cleanName = newAccommodation.name;
      const cleanAddress = newAccommodation.address && newAccommodation.address.length > 5 && !newAccommodation.address.includes('não informado')
        ? newAccommodation.address
        : '';

      // Primary search
      let googleData = await googlePlacesService.searchPlace(cleanAddress ? `${cleanName} ${cleanAddress}` : `${cleanName} hotel`);

      // Retry logic: if strict search failed to get rating, try relaxed search
      if (!googleData.rating && cleanAddress) {
        console.log('Retrying Google Search with simpler query...');
        const relaxedData = await googlePlacesService.searchPlace(`${cleanName} hotel`);
        if (relaxedData.rating) {
          googleData = relaxedData;
        }
      }

      const geminiMetadata = await geminiService.getHotelMetadata(cleanName, cleanAddress);

      // Heuristic: Auto-correct stars based on Rating if stars are default (3) or missing
      let finalStars = geminiMetadata?.stars || newAccommodation.stars;
      if (googleData.rating) {
        if (googleData.rating >= 4.7) finalStars = 5;
        else if (googleData.rating >= 4.0 && finalStars < 4) finalStars = 4;
      }

      if (newId) {
        const updatedHotel: HotelReservation = {
          id: newId,
          ...accommodationData,
          rating: googleData.rating || accommodationData.rating,
          address: googleData.address || accommodationData.address,
          stars: finalStars,
          image: googleData.image || accommodationData.image,
          status: accommodationData.status || 'confirmed'
        };

        await updateAccContext(trip.id, updatedHotel);
      }

    } catch (error) {
      console.error('Error auto-fetching hotel metadata:', error);
    }
  };



  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expenseWithId: Expense = {
      ...newExpense,
      id: `e-${Math.random().toString(36).substr(2, 9)}`,
    };
    setExpenses(prev => [expenseWithId, ...prev]);
  };

  // Add state for editing transport
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [deletingTransportId, setDeletingTransportId] = useState<string | null>(null);

  const handleAddTransport = async (newTransport: Omit<Transport, 'id'>) => {
    if (!trip.id) return;
    await addTransportContext(trip.id, newTransport);
  };

  const handleUpdateTransport = async (updatedTransport: Transport) => {
    if (!trip.id) return;
    await updateTransportContext(trip.id, updatedTransport);
    setEditingTransport(null);
    setIsAddTransportModalOpen(false);
  };

  const handleDeleteTransport = (transportId: string) => {
    setDeletingTransportId(transportId);
  };

  const handleConfirmDeleteTransport = async () => {
    if (deletingTransportId && trip.id) {
      await deleteTransportContext(trip.id, deletingTransportId);
      setDeletingTransportId(null);
    }
  };

  const handleEditTransport = (transport: Transport) => {
    setEditingTransport(transport);
    setIsAddTransportModalOpen(true);
  };

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'date_asc'>('newest');

  // Accommodation State
  const [accommodationFilter, setAccommodationFilter] = useState<'all' | 'hotel' | 'home'>('all');
  const [accommodationViewMode, setAccommodationViewMode] = useState<'list' | 'grid'>('list');
  const [accommodationSortOrder, setAccommodationSortOrder] = useState<'newest' | 'oldest'>('newest');

  const handleOpenAddActivityModal = (day: number, date: string) => {
    setSelectedActivityDay({ day, date });
    setIsAddActivityModalOpen(true);
  };

  const handleAddItineraryActivity = (data: { itemName: string; itemType: 'restaurant' | 'attraction' | 'custom'; date: string; time: string; notes?: string, address?: string, image?: string, category?: string }) => {
    // Calculate day number based on trip start date
    let day = 1;
    if (trip.startDate && data.date) {
      const start = new Date(trip.startDate.includes('/') ? trip.startDate.split('/').reverse().join('-') : trip.startDate);
      const activityDate = new Date(data.date.includes('/') ? data.date.split('/').reverse().join('-') : data.date);
      const diffTime = Math.abs(activityDate.getTime() - start.getTime());
      day = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const newActivity: ItineraryActivity = {
      id: `act-${Date.now()}`,
      day: day,
      date: data.date.includes('-') ? formatToDisplayDate(data.date) : data.date,
      time: data.time || '12:00',
      title: data.itemName,
      location: data.address,
      type: data.itemType === 'restaurant' ? 'food' : data.itemType === 'attraction' ? 'sightseeing' : 'other',
      completed: false,
      notes: data.notes,
      image: data.image,
      // Store category in notes or extended metadata if needed in future
    };

    setItineraryActivities(prev => [...prev, newActivity]);
  };

  // Computed expense values
  const totalSpent = useMemo(() =>
    expenses.filter(e => e.type === 'saida').reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const totalIncome = useMemo(() =>
    expenses.filter(e => e.type === 'entrada').reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const remainingBudget = totalBudget - totalSpent + totalIncome;
  const remainingPercent = Math.round((remainingBudget / totalBudget) * 100);

  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      alimentacao: 0, transporte: 0, hospedagem: 0, lazer: 0, compras: 0, outros: 0
    };
    expenses.filter(e => e.type === 'saida').forEach(e => {
      totals[e.category] += e.amount;
    });
    return totals;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (expenseFilter === 'todas') return expenses;
    return expenses.filter(e =>
      expenseFilter === 'entradas' ? e.type === 'entrada' : e.type === 'saida'
    );
  }, [expenses, expenseFilter]);

  const dailyAverage = useMemo(() => {
    const days = new Set(expenses.map(e => e.date)).size || 1;
    return totalSpent / days;
  }, [expenses, totalSpent]);

  const maxExpense = useMemo(() =>
    Math.max(...expenses.filter(e => e.type === 'saida').map(e => e.amount), 0),
    [expenses]
  );


  // RENDER CONTENT HELPERS
  const renderTripDetailContent = () => {
    // Show CityGuide if a city is selected
    if (activeSubTab === 'cities' && selectedCity) {
      return (
        <CityGuideLayout
          selectedCity={selectedCity}
          allCities={cities}
          activeCityTab={activeCityTab}
          onBack={() => { setSelectedCity(null); setCityGuide(null); }}

          onTabChange={setActiveCityTab}
          onCityChange={handleOpenCityDetail}
        >
          {activeCityTab === 'info' && (
            <InfoTab
              city={selectedCity}
              cityGuide={cityGuide}
              groundingInfo={groundingInfo}
              groundingLinks={groundingLinks}
              isGroundingLoading={isGroundingLoading}
              onEditorialChange={handleUpdateEditorialContent}
              onGenerateEditorial={() => { }}
              isGeneratingEditorial={false}
              onTabChange={setActiveCityTab}
              accommodations={hotels.filter(h =>
                (h.cityId === selectedCity.id) ||
                (!h.cityId && (h.address.toLowerCase().includes(selectedCity.name.toLowerCase()) || h.name.toLowerCase().includes(selectedCity.name.toLowerCase())))
              )}
              transports={transports.filter(t => (t.arrivalCity?.toLowerCase().includes(selectedCity.name.toLowerCase()) || t.arrivalLocation?.toLowerCase().includes(selectedCity.name.toLowerCase())))}
              onAddAccommodation={() => {
                // Pre-fill hotel name with city name if empty (optional but nice)
                setTargetCityId(selectedCity.id);
                setIsAddAccommodationModalOpen(true);
              }}
              onAddTransport={() => {
                setIsAddTransportModalOpen(true);
              }}
              onViewAccommodation={() => {
                setActiveSubTab('accommodation');
                setAccommodationFilter('all');
              }}
              onViewTransport={() => {
                setActiveSubTab('transport');
              }}
            />
          )}
          {activeCityTab === 'attractions' && <AttractionsTab key={selectedCity?.name || 'attractions'} cityGuide={cityGuide} isLoadingGuide={isLoadingGuide} attractionSearch={attractionSearch} genAspectRatio={genAspectRatio} genSize={genSize} onSearchChange={setAttractionSearch} onAspectRatioChange={setGenAspectRatio} onSizeChange={setGenSize} onRegenerateAll={() => { }} onAttractionClick={setSelectedAttraction} onEditImage={() => { }} onAddManual={() => { }} onShowMap={() => setIsMapModalOpen(true)} onSuggestAI={() => { }} isSuggestingAI={false} onTabChange={setActiveCityTab} tripStartDate={trip.startDate} tripEndDate={trip.endDate} onAddToItinerary={handleAddItineraryActivity} cityName={selectedCity?.name} />}
          {activeCityTab === 'gastronomy' && <GastronomyTab key={selectedCity?.name || 'gastronomy'} cityGuide={cityGuide} isLoadingGuide={isLoadingGuide} onEditImage={() => { }} cityName={selectedCity?.name} onTabChange={setActiveCityTab} onAddToItinerary={handleAddItineraryActivity} tripStartDate={trip.startDate} tripEndDate={trip.endDate} />}
          {activeCityTab === 'tips' && <TipsTab cityGuide={cityGuide} />}
        </CityGuideLayout>
      );
    }

    switch (activeSubTab) {
      case 'overview':
        return (
          <OverviewTab
            trip={trip}
            expenses={expenses}
            cities={cities}
            hotels={hotels}
            transports={transports}
            totalBudget={totalBudget}
            onInvite={() => {
              // TODO: Open invite modal or share functionality
              alert('Convidar participantes - funcionalidade a ser implementada');
            }}
            onCityClick={(city) => {
              // Navigate to city guide
              handleOpenCityDetail(city);
            }}
            onAddCity={() => setIsAddCityModalOpen(true)}
          />
        );
      case 'itinerary':
        return <ItineraryView
          itinerary={itinerary}
          activities={activities}
          customActivities={itineraryActivities}
          onUpdateCustomActivities={setItineraryActivities}
          isGenerating={isGenerating}
          onGenerate={handleGenerateItinerary}
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
          hotels={hotels}
          transports={transports}
          cities={cities} // Passing cities to help populate day headers
        />;
      case 'accommodation':
        let displayedHotels = accommodationFilter === 'all'
          ? hotels
          : hotels.filter(h => h.type === accommodationFilter || (!h.type && accommodationFilter === 'hotel')); // Default to hotel if type is missing

        // Apply sorting
        if (accommodationSortOrder === 'newest') {
          displayedHotels = [...displayedHotels].reverse();
        }

        return (
          <div className="space-y-6">

            <div className="flex flex-col gap-4">
              {/* Title removed per user request */}

              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'hotel', label: 'Hotéis', icon: 'hotel' },
                    { value: 'home', label: 'Casas/Apts', icon: 'home' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setAccommodationFilter(filter.value as 'all' | 'hotel' | 'home')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${accommodationFilter === filter.value
                        ? 'bg-text-main text-white shadow-sm'
                        : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                        }`}
                    >
                      {filter.icon && <span className="material-symbols-outlined text-sm">{filter.icon}</span>}
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
                  {/* Sort */}
                  <button
                    onClick={() => setAccommodationSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-text-muted transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">swap_vert</span>
                    {accommodationSortOrder === 'newest' ? 'Recentes' : 'Antigos'}
                  </button>

                  {/* View Mode */}
                  <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                    <button
                      onClick={() => setAccommodationViewMode('list')}
                      className={`p-1 rounded-lg transition-all ${accommodationViewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <span className="material-symbols-outlined text-lg">view_list</span>
                    </button>
                    <button
                      onClick={() => setAccommodationViewMode('grid')}
                      className={`p-1 rounded-lg transition-all ${accommodationViewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <span className="material-symbols-outlined text-lg">grid_view</span>
                    </button>
                  </div>

                  <div className="w-px h-6 bg-gray-200 mx-1"></div>

                  <button
                    onClick={() => {
                      setSelectedAccommodation(null);
                      setIsAddAccommodationModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-text-main rounded-xl font-bold text-xs hover:bg-primary-dark transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Hotel Cards */}
            <div className={accommodationViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-5"}>
              {displayedHotels.length > 0 ? displayedHotels.map((hotel) => (
                <div key={hotel.id} className="bg-white rounded-2xl shadow-soft border border-gray-100/50 overflow-hidden flex flex-col md:flex-row">
                  {/* Hotel Icon */}
                  <div className="relative w-full md:w-40 h-32 md:h-auto shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <div className="size-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-indigo-500">
                        {hotel.type === 'home' ? 'home' : 'hotel'}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-text-main/80 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                      {hotel.nights} {hotel.nights === 1 ? 'Noite' : 'Noites'}
                    </div>
                  </div>

                  {/* Hotel Details */}
                  {/* Hotel Details */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div className="mb-4">
                      {/* Header with Title and Status */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-lg text-text-main leading-tight line-clamp-2">{hotel.name}</h3>
                        <span className={`shrink-0 px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${hotel.status === 'confirmed'
                          ? 'bg-green-100/80 text-green-700'
                          : hotel.status === 'pending'
                            ? 'bg-amber-100/80 text-amber-700'
                            : 'bg-rose-100/80 text-rose-700'
                          }`}>
                          {hotel.status === 'confirmed' ? 'Confirmado' : hotel.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </div>

                      {/* Stars and Rating */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {hotel.stars ? (
                          <div className="flex text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[14px] fill">star</span>
                            ))}
                          </div>
                        ) : null}

                        {hotel.rating ? (
                          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            <span className="text-xs font-bold">{hotel.rating}</span>
                            <span className="material-symbols-outlined text-[14px]">kid_star</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Address Line */}
                      <div className="flex items-start gap-1.5 text-text-muted text-sm group cursor-pointer hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-base mt-0.5 shrink-0">location_on</span>
                        <span className="line-clamp-2 leading-snug">{hotel.address}</span>
                      </div>
                    </div>

                    {/* Check-in / Check-out Grid */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100/50 mb-4">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">Entrada</p>
                        <p className="font-bold text-sm text-text-main">{hotel.checkIn}</p>
                        <p className="text-xs text-text-muted">{hotel.checkInTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">Saída</p>
                        <p className="font-bold text-sm text-text-main">{hotel.checkOut}</p>
                        <p className="text-xs text-text-muted">{hotel.checkOutTime}</p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Reserva</p>
                        <p className="font-mono text-xs text-text-main truncate" title={hotel.confirmation}>{hotel.confirmation}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name)}`, '_blank')}
                          className="flex items-center justify-center size-9 rounded-xl border border-gray-200/80 text-gray-400 hover:bg-gray-50 hover:text-primary transition-colors"
                          title="Direções"
                        >
                          <span className="material-symbols-outlined text-xl">directions</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAccommodation(hotel);
                            setIsAddAccommodationModalOpen(true);
                          }}
                          className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wide transition-all shadow-sm active:scale-95 ${hotel.status === 'pending'
                            ? 'bg-primary text-text-main hover:bg-primary-dark'
                            : 'bg-white border border-gray-200 text-text-main hover:bg-gray-50'
                            }`}
                        >
                          {hotel.status === 'pending' ? 'Completar' : 'Detalhes'}
                        </button>
                        <button
                          onClick={() => handleDeleteAccommodation(hotel.id)}
                          className="flex items-center justify-center size-9 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 text-gray-400 hover:text-rose-500 transition-colors"
                          title="Remover hospedagem"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>


              )) : (
                <div className="bg-white rounded-2xl p-12 shadow-soft border border-gray-100/50 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">hotel</span>
                  <p className="text-text-muted font-bold">Nenhuma hospedagem adicionada ainda</p>
                  <p className="text-sm text-text-muted mt-1">Adicione suas reservas de hotel para manter tudo organizado</p>
                </div>
              )
              }
            </div >
          </div >
        );
      case 'transport':
        return (
          <TransportView
            trip={trip}
            onAddClick={() => setIsAddTransportModalOpen(true)}
            onEditClick={handleEditTransport}
          />
        );
      case 'docs':
        return <DocumentsView hotels={hotels} extraDocuments={extraDocuments} docsFilter={docsFilter} onFilterChange={setDocsFilter} onAddDocument={() => setIsAddDocumentModalOpen(true)} travelers={trip.participants} />;
      case 'budget':
        const categoryConfig: Record<ExpenseCategory, { label: string; icon: string; color: string; bg: string }> = {
          alimentacao: { label: 'Alimentação', icon: 'restaurant', color: 'text-amber-500', bg: 'bg-amber-100' },
          transporte: { label: 'Transporte', icon: 'directions_car', color: 'text-blue-500', bg: 'bg-blue-100' },
          hospedagem: { label: 'Hospedagem', icon: 'hotel', color: 'text-indigo-500', bg: 'bg-indigo-100' },
          lazer: { label: 'Lazer', icon: 'confirmation_number', color: 'text-green-500', bg: 'bg-green-100' },
          compras: { label: 'Compras', icon: 'shopping_bag', color: 'text-pink-500', bg: 'bg-pink-100' },
          outros: { label: 'Outros', icon: 'more_horiz', color: 'text-gray-500', bg: 'bg-gray-100' },
        };
        const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-main">Gerenciamento de Despesas</h2>
                <p className="text-text-muted text-sm">Acompanhe seus gastos e mantenha-se dentro do orçamento da viagem.</p>
              </div>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-text-main rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Nova Despesa
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Budget Summary */}
              <div className="space-y-6">
                {/* Budget Card */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-text-main">Resumo do Orçamento</h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${remainingPercent > 20 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {remainingPercent > 20 ? 'Dentro da meta' : 'Atenção'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative size-32 mb-4">
                      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-cyan-500" strokeDasharray={`${remainingPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-text-muted">Restante</span>
                        <span className="text-3xl font-extrabold text-text-main">{remainingPercent}%</span>
                        <span className="text-xs text-text-muted">{formatCurrency(remainingBudget)}</span>
                      </div>
                    </div>
                    <div className="flex gap-8 text-center">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider">Total</p>
                        <p className="font-bold text-text-main">{formatCurrency(totalBudget)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider">Gasto</p>
                        <p className="font-bold text-cyan-600">{formatCurrency(totalSpent)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-text-main">Por Categoria</h4>
                  </div>
                  <div className="space-y-4">
                    {(Object.entries(categoryTotals) as [ExpenseCategory, number][]).filter(([_, amount]) => amount > 0).map(([cat, amount]) => {
                      const config = categoryConfig[cat];
                      const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2"><span className={`size-2 ${config.bg.replace('bg-', 'bg-').replace('100', '500')} rounded-full`}></span>{config.label}</span>
                            <span className="font-bold">{formatCurrency(amount)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${config.bg.replace('100', '500')} rounded-full`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Transactions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 flex items-center gap-4">
                    <div className="size-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-500">calendar_today</span>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Média Diária</p>
                      <p className="font-bold text-lg text-text-main">{formatCurrency(dailyAverage)}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 flex items-center gap-4">
                    <div className="size-12 bg-rose-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-rose-500">trending_up</span>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Maior Gasto</p>
                      <p className="font-bold text-lg text-text-main">{formatCurrency(maxExpense)}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 flex items-center gap-4">
                    <div className="size-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500">savings</span>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Economia</p>
                      <p className="font-bold text-lg text-green-600">{remainingPercent > 50 ? '+' : ''}{Math.round(remainingPercent - 50)}%</p>
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-text-main text-lg">Últimas Transações</h3>
                    <div className="flex gap-2">
                      {(['todas', 'entradas', 'saidas'] as ExpenseFilter[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setExpenseFilter(filter)}
                          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${expenseFilter === filter
                            ? 'bg-text-main text-white'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                            }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-gray-100">
                          <th className="pb-3 font-bold">Despesa</th>
                          <th className="pb-3 font-bold">Categoria</th>
                          <th className="pb-3 font-bold">Data</th>
                          <th className="pb-3 font-bold text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredExpenses.slice(0, 5).map((expense) => {
                          const config = categoryConfig[expense.category];
                          return (
                            <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`size-10 ${config.bg} rounded-lg flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined ${config.color} text-lg`}>{config.icon}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-text-main text-sm">{expense.title}</p>
                                    <p className="text-xs text-text-muted">{expense.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td><span className={`px-3 py-1 ${config.bg} ${config.color.replace('text-', 'text-').replace('500', '700')} text-xs font-bold rounded-full`}>{config.label}</span></td>
                              <td className="text-sm text-text-muted">{formatDate(expense.date)}</td>
                              <td className={`text-right font-bold ${expense.type === 'saida' ? 'text-rose-600' : 'text-green-600'}`}>
                                {expense.type === 'saida' ? '-' : '+'} {formatCurrency(expense.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-text-muted">Mostrando {Math.min(5, filteredExpenses.length)} de {filteredExpenses.length} transações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'journal':
        return <JournalView tripTitle={trip.title} tripStartDate={trip.startDate} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <TripDetailsHeader trip={trip} onBack={onBack} onEdit={onEdit} onShare={() => setIsShareModalOpen(true)} />
      <div className="flex-1 overflow-y-auto relative h-full scroll-smooth">
        <TripTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />
        <div className="p-6 md:p-8 pb-32 space-y-8">
          {renderTripDetailContent()}
        </div>
      </div>

      {/* Modals */}
      <AttractionDetailModal
        isOpen={!!selectedAttraction}
        onClose={() => setSelectedAttraction(null)}
        attraction={selectedAttraction}
      />
      {editingImage && (
        <ImageEditorModal
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          imageData={editingImage}
          onEditComplete={handleEditImageComplete}
          isEditing={isEditingWithAI}
        />
      )}

      <AddCityModal
        isOpen={isAddCityModalOpen}
        onClose={() => setIsAddCityModalOpen(false)}
        onAdd={handleAddCity}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
      />

      <AddDocumentModal
        isOpen={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        onAdd={handleAddDocument}
      />

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onAdd={handleAddExpense}
      />

      <AddAttractionModal
        isOpen={isAddAttractionModalOpen}
        onClose={() => setIsAddAttractionModalOpen(false)}
        onAdd={handleManualAddAttraction}
      />

      {selectedCity && (
        <AttractionMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          city={selectedCity}
          attractions={cityGuide?.attractions || []}
        />
      )}

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        trip={trip}
      />

      <AddAccommodationModal
        isOpen={isAddAccommodationModalOpen}
        onClose={() => {
          setIsAddAccommodationModalOpen(false);
          setSelectedAccommodation(null);
          setTargetCityId(null);
        }}
        onAdd={handleAddAccommodation}
        initialData={selectedAccommodation}
      />

      <Modal
        isOpen={!!deletingAccommodationId}
        onClose={() => setDeletingAccommodationId(null)}
        title="Remover Hospedagem"
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeletingAccommodationId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirmDeleteAccommodation}>
              Excluir
            </Button>
          </>
        )}
      >
        <p className="text-gray-600 dark:text-gray-300">
          Tem certeza que deseja remover esta hospedagem? Esta ação não pode ser desfeita.
        </p>
      </Modal>

      <AddTransportModal
        isOpen={isAddTransportModalOpen}
        onClose={() => {
          setIsAddTransportModalOpen(false);
          setEditingTransport(null);
        }}
        onAdd={handleAddTransport}
        onEdit={handleUpdateTransport}
        initialData={editingTransport}
      />

      <Modal
        isOpen={!!deletingTransportId}
        onClose={() => setDeletingTransportId(null)}
        title="Confirmar Exclusão"
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeletingTransportId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirmDeleteTransport}>
              Excluir
            </Button>
          </>
        )}
      >
        <p className="text-gray-600 dark:text-gray-300">
          Tem certeza que deseja remover este transporte? Esta ação não pode ser desfeita.
        </p>
      </Modal>

      {selectedActivityDay && (
        <AddActivityModal
          isOpen={isAddActivityModalOpen}
          onClose={() => {
            setIsAddActivityModalOpen(false);
            setSelectedActivityDay(null);
          }}
          onAdd={handleAddItineraryActivity}
          selectedDay={selectedActivityDay.day}
          selectedDate={selectedActivityDay.date}
        />
      )}
    </div>
  );
};

const TripDetails: React.FC<TripDetailsProps> = (props) => (
  <AccommodationProvider>
    <TransportProvider>
      <TripDetailsContent {...props} />
    </TransportProvider>
  </AccommodationProvider>
);

export default TripDetails;
