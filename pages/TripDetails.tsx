
import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateNights, formatToDisplayDate, toISODate } from '../lib/dateUtils';

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
  ItineraryActivity,
  Transaction,
  TripParticipant,
  Participant
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '@/contexts/TripContext';
import { fetchExpenses, createExpense, deleteExpense } from '../services/expenseService';
import { fetchJournalEntries, createJournalEntry, deleteJournalEntry } from '../services/journalService';
import { getGeminiService } from '../services/geminiService';

// Existing Trip Details Components
import TripDetailsHeader from '../components/trip-details/TripDetailsHeader';
import { TripNavigationSidebar } from '../components/trip-details/navigation';
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

import AttractionDetailModal from '../components/trip-details/modals/AttractionDetailModal';
import AddCityModal from '../components/trip-details/modals/AddCityModal';
import EditCityModal from '../components/trip-details/modals/EditCityModal';
import AddAttractionModal from '../components/trip-details/modals/AddAttractionModal';
import AttractionMapModal from '../components/trip-details/modals/AttractionMapModal';
import AddDocumentModal from '../components/trip-details/modals/AddDocumentModal';
import AddExpenseModal from '../components/trip-details/modals/AddExpenseModal';
import ShareTripModal from '../components/trip-details/modals/ShareTripModal';
import AddAccommodationModal from '../components/trip-details/modals/AddAccommodationModal';
import AddTransportModal from '../components/trip-details/modals/AddTransportModal';
import { AccommodationProvider, useAccommodation } from '../contexts/AccommodationContext';
import { TransportProvider, useTransport } from '../contexts/TransportContext';
import { ItineraryProvider, useItinerary } from '../contexts/ItineraryContext';
import TransportView from '../components/trip-details/transport/TransportView';
import LogisticsView from '../components/trip-details/logistics/LogisticsView';
import BudgetView from '../components/trip-details/budget/BudgetView';
import Modal from '../components/trip-details/modals/Modal';
import { Button } from '../components/ui/Base';
import AddActivityModal from '../components/trip-details/modals/AddActivityModal';
import { useChecklist, ChecklistProvider } from '../contexts/ChecklistContext';


import TripMapExplorer from '../components/trip-details/maps/TripMapExplorer';
import MediaView from '../components/trip-details/media/MediaView';
import { MagazineView } from '../components/trip-details/magazine';
import SmartPreTripGuide from '../components/trip-details/pre-trip/PreTripGuide';
import AccommodationView from '../components/trip-details/logistics/AccommodationView';
import PreTripBriefingView from '../components/trip-details/pre-trip/briefing/PreTripBriefingView';

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
  onEdit: () => void;
}

const TripDetailsContent: React.FC<TripDetailsProps> = ({ trip, onBack, onEdit }) => {
  const { user } = useAuth();
  const { updateTrip } = useTrips();
  // Inner Trip Details State (Tabs)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [activeCityTab, setActiveCityTab] = useState<CityTab>('info');
  const [docsFilter, setDocsFilter] = useState<DocsFilter>('Tudo');

  // Itinerary state
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  // Itinerary state (Context)
  const {
    activities: itineraryActivities,
    fetchActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    migrateFromLocalStorage: migrateActivities,
    isLoading: isLoadingItinerary
  } = useItinerary();

  // Migration check for activities
  useEffect(() => {
    if (trip.id) {
      migrateActivities(trip.id);
    }
  }, [trip.id, migrateActivities]);

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
            editorialContent: existing?.editorialContent || dest.editorialContent,
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
    migrateFromLocalStorage,
    isLoading: isLoadingHotels
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
  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Transactions currently remain local or need separate service (Assuming explicit focus on Expenses for now per plan, keeping transactions local to avoid breaking if table not ready, or should I migrate both? Plan said 'Expenses'. Let's stick to Expenses first but typically they go together if 'BudgetView' uses them. Actually, BudgetView uses separate props. I will migrate Expenses. Transactions might fail if I remove useLocalStorage but don't provide replacement. I'll keep transactions as useLocalStorage for now as it wasn't explicitly in the plan schema).
  // Wait, the plan was generic "Expenses Persistence".
  // The 'expenses' table I created seems to mirror the 'Expense' type.
  // 'Transactions' are for shared expenses.
  // I will focus on 'expenses' (individual) per the prompt 'Existem outras funcionalidades... only locally?'.
  // I'll keep transactions as is but replace expenses.
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(`porai_trip_${trip.id}_transactions`, []);
  const [totalBudget] = useState(5000);

  useEffect(() => {
    if (trip.id) {
      fetchExpenses(trip.id).then(setExpenses).catch(console.error);
    }
  }, [trip.id]);

  // Transport state (Context)
  const {
    transports,
    addTransport: addTransportContext,
    updateTransport: updateTransportContext,
    deleteTransport: deleteTransportContext,
    fetchTransports: fetchTransportsContext,
    isLoading: isLoadingTransports
  } = useTransport();

  // Checklist Context
  const { deleteTasksByPattern } = useChecklist();

  // Fetch transports and activities on load
  // Note: fetchActivities is memoized with 'user' as dependency, so when user changes,
  // this effect will re-run and properly fetch activities after authentication
  useEffect(() => {
    if (trip.id) {
      fetchTransportsContext(trip.id);
      fetchActivities(trip.id);
    }
  }, [trip.id, fetchActivities, fetchTransportsContext]);

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

  // Delete Handlers
  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      setExtraDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };



  const handleDeleteJournalEntry = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta memória?')) {
      setJournalEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // Video handlers
  const handleAddVideo = async (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?]*)/)?.[1];
    if (!videoId) return;

    const newVideo = {
      id: `video-${Date.now()}`,
      url: url,
      title: 'Vídeo do YouTube',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      addedAt: new Date().toISOString()
    };

    const updatedTrip = {
      ...trip,
      videos: [...(trip.videos || []), newVideo]
    };

    await updateTrip(updatedTrip);
  };

  const handleRemoveVideo = async (id: string) => {
    const updatedTrip = {
      ...trip,
      videos: (trip.videos || []).filter(v => v.id !== id)
    };
    await updateTrip(updatedTrip);
  };

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

  const handleUpdateEditorialContent = async (content: string) => {
    if (!selectedCity) return;

    // Update selected city immediately
    setSelectedCity(prev => prev ? { ...prev, editorialContent: content } : null);

    // Update cities list (which persists to localStorage)
    setCities(prev => prev.map(c => c.id === selectedCity.id ? { ...c, editorialContent: content } : c));

    // Persist to Backend (Trip.detailedDestinations)
    if (trip.detailedDestinations) {
      const updatedDestinations = trip.detailedDestinations.map(dest => {
        if (dest.id === selectedCity.id) {
          return { ...dest, editorialContent: content };
        }
        return dest;
      });

      const updatedTrip = { ...trip, detailedDestinations: updatedDestinations };

      try {
        await updateTrip(updatedTrip);
      } catch (error) {
        console.error("Failed to save city editorial content:", error);
      }
    }
  };
  const handleGenerateEditorial = async () => { };

  const handleManualAddAttraction = () => { };
  const handleSuggestAI = async () => { };
  const handleAddJournalEntry = () => {
    if (!newJournalContent.trim()) return;
    setJournalEntries([{
      id: 'j-new',
      author: {
        id: user?.id || 'u-temp',
        name: user?.name || 'Usuário',
        avatar: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff',
        role: 'Viajante'
      },
      timestamp: 'Now',
      location: 'Location',
      content: newJournalContent,
      likes: 0,
      comments: 0,
      date: new Date().toISOString().split('T')[0],
      images: [],
      tags: []
    }, ...journalEntries]);
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

  // Edit City State and Handlers
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
  const [deletingCity, setDeletingCity] = useState<City | null>(null);

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setIsEditCityModalOpen(true);
  };

  const handleUpdateCity = (updatedCity: City) => {
    setCities(prev => prev.map(c => c.id === updatedCity.id ? updatedCity : c));
    setEditingCity(null);
    setIsEditCityModalOpen(false);
  };

  const handleDeleteCity = (city: City) => {
    setDeletingCity(city);
  };

  const handleConfirmDeleteCity = () => {
    if (deletingCity) {
      setCities(prev => prev.filter(c => c.id !== deletingCity.id));

      // Cleanup tasks associated with this city
      if (trip.id) {
        deleteTasksByPattern(deletingCity.name, trip.id).catch(err => console.error('Failed to cleanup tasks:', err));
      }

      setDeletingCity(null);
    }
  };

  const handleCityUpdate = (updatedCity: City) => {
    setCities(prev => prev.map(c => c.id === updatedCity.id ? updatedCity : c));
  };

  const handleReorderCities = (reorderedCities: City[]) => {
    setCities(reorderedCities);
  };
  const handleAddDocument = async (newDoc: any) => {
    const docWithId = { ...newDoc, id: Math.random().toString(36).substr(2, 9), status: 'confirmed' };
    setExtraDocuments(prev => [...prev, docWithId]);
    return docWithId;
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



  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      const created = await createExpense({
        ...newExpense,
        tripId: trip.id
      });
      setExpenses(prev => [created, ...prev]);
      setIsAddExpenseModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Failed to create expense", error);
    }
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const transactionWithId: Transaction = {
      ...newTransaction,
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTransactions(prev => [transactionWithId, ...prev]);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
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

  const handleAddItineraryActivity = async (data: { itemName: string; itemType: 'restaurant' | 'attraction' | 'custom'; date: string; time: string; notes?: string, address?: string, image?: string, category?: string }) => {
    console.log('🎯 handleAddItineraryActivity called with data:', data);

    // Calculate day number based on trip start date
    let day = 1;
    if (trip.startDate && data.date) {
      const start = new Date(trip.startDate.includes('/') ? trip.startDate.split('/').reverse().join('-') : trip.startDate);
      const activityDate = new Date(data.date.includes('/') ? data.date.split('/').reverse().join('-') : data.date);
      const diffTime = Math.abs(activityDate.getTime() - start.getTime());
      day = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const newActivity: Omit<ItineraryActivity, 'id'> = {
      day: day,
      date: toISODate(data.date) || data.date, // Convert to YYYY-MM-DD for Supabase
      time: data.time || '12:00',
      title: data.itemName,
      location: data.address,
      type: data.itemType === 'restaurant' ? 'food' : data.itemType === 'attraction' ? 'sightseeing' : 'other',
      completed: false,
      notes: data.notes,
      image: data.image,
      // Store category in notes or extended metadata if needed in future
    };

    console.log('✅ Prepared activity:', newActivity);

    if (trip.id) {
      const activityId = await addActivity(trip.id, newActivity);
      console.log('✨ Activity added with ID:', activityId);

      // Refresh activities after adding
      if (activityId) {
        await fetchActivities(trip.id);
        console.log('🔄 Activities refreshed');
      }
    }
  };

  // Computed expense values
  const tripParticipants: TripParticipant[] = useMemo(() => {
    return (trip.participants || []).map(p => ({
      ...p,
      netBalance: 0 // Initial balance, will be calculated by BudgetView
    }));
  }, [trip.participants]);



  // RENDER CONTENT HELPERS
  const renderTripDetailContent = () => {
    // Show CityGuide if a city is selected or if we are in cities tab (default to first city)
    let targetCity = selectedCity;

    if (activeSubTab.startsWith('city-')) {
      const cityId = activeSubTab.replace('city-', '');
      targetCity = cities.find(c => c.id === cityId) || null;
    } else if (activeSubTab === 'cities') {
      targetCity = selectedCity || cities[0];
    }

    if ((activeSubTab === 'cities' || activeSubTab.startsWith('city-')) && targetCity) {
      // Ensure we have the guide for this city if not already loaded
      // This might need a useEffect, but for specific structure here we assume CityGuideLayout might handle or we let it load
      // Ideally explicit selection should happen. For now, we render.

      return (
        <CityGuideLayout
          selectedCity={targetCity}
          allCities={cities}
          activeCityTab={activeCityTab}
          onBack={() => { setSelectedCity(null); setActiveSubTab('overview'); }}
          onTabChange={setActiveCityTab}
          onCityChange={handleOpenCityDetail}
        >
          {activeCityTab === 'info' && (
            <InfoTab
              city={targetCity}
              cityGuide={cityGuide}
              groundingInfo={groundingInfo}
              groundingLinks={groundingLinks}
              isGroundingLoading={isGroundingLoading}
              onEditorialChange={handleUpdateEditorialContent}
              onGenerateEditorial={() => { }}
              isGeneratingEditorial={false}
              onTabChange={setActiveCityTab}
              accommodations={hotels.filter(h =>
                (h.cityId === targetCity.id) ||
                (!h.cityId && (h.address.toLowerCase().includes(targetCity.name.toLowerCase()) || h.name.toLowerCase().includes(targetCity.name.toLowerCase())))
              )}
              transports={transports.filter(t => (t.arrivalCity?.toLowerCase().includes(targetCity.name.toLowerCase()) || t.arrivalLocation?.toLowerCase().includes(targetCity.name.toLowerCase())))}
              onAddAccommodation={() => {
                setTargetCityId(targetCity.id);
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
          {activeCityTab === 'attractions' && <AttractionsTab key={targetCity.name || 'attractions'} cityGuide={cityGuide} isLoadingGuide={isLoadingGuide} attractionSearch={attractionSearch} genAspectRatio={genAspectRatio} genSize={genSize} onSearchChange={setAttractionSearch} onAspectRatioChange={setGenAspectRatio} onSizeChange={setGenSize} onAttractionClick={setSelectedAttraction} onAddManual={() => { }} onShowMap={() => setIsMapModalOpen(true)} onSuggestAI={() => { }} isSuggestingAI={false} onTabChange={(tab) => setActiveCityTab(tab)} tripStartDate={trip.startDate} tripEndDate={trip.endDate} onAddToItinerary={handleAddItineraryActivity} cityName={targetCity.name} />}
          {activeCityTab === 'gastronomy' && <GastronomyTab key={targetCity.name || 'gastronomy'} cityGuide={cityGuide} isLoadingGuide={isLoadingGuide} cityName={targetCity.name} onTabChange={(tab) => setActiveCityTab(tab)} onAddToItinerary={handleAddItineraryActivity} tripStartDate={trip.startDate} tripEndDate={trip.endDate} />}
          {activeCityTab === 'tips' && <TipsTab cityGuide={cityGuide} />}
        </CityGuideLayout>
      );
    } else if (activeSubTab === 'cities' && !cities.length) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-gray-300 text-4xl">location_city</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma cidade adicionada</h3>
          <p className="text-gray-500 max-w-sm mb-8">Adicione cidades ao seu roteiro para acessar guias, atrações e dicas locais.</p>
          <button
            onClick={() => setIsAddCityModalOpen(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary-dark transition-all"
          >
            Adicionar Primeira Cidade
          </button>
        </div>
      );
    }

    switch (activeSubTab) {

      case 'overview':
        return (
          <OverviewTab
            trip={trip}
            cities={cities}
            hotels={hotels}
            transports={transports}
            activities={itineraryActivities}
            onCityClick={(city) => {
              // Navigate to city guide
              handleOpenCityDetail(city);
            }}
            onAddCity={() => setIsAddCityModalOpen(true)}
            onUpdateCity={handleUpdateCity}
            onDeleteCity={handleDeleteCity}
            onTabChange={setActiveSubTab}
            isLoading={isLoadingHotels || isLoadingTransports || isLoadingItinerary}
          />
        );
      case 'itinerary':
        return <ItineraryView
          itinerary={itinerary}
          activities={activities}
          customActivities={itineraryActivities}
          onUpdateCustomActivities={() => { }} // Deprecated, will be removed
          onDeleteActivity={(id) => { if (trip.id) deleteActivity(trip.id, id); }}
          onUpdateActivity={(act) => { if (trip.id) updateActivity(trip.id, act); }}
          onAddActivity={(act) => { if (trip.id) addActivity(trip.id, act); }}
          isGenerating={isGenerating}
          onGenerate={handleGenerateItinerary}
          onOpenAddActivityModal={handleOpenAddActivityModal}
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
          hotels={hotels}
          transports={transports}
          cities={cities}
          isLoading={isLoadingItinerary}
        />;
      case 'map':
        return (
          <TripMapExplorer
            activities={itineraryActivities}
            hotels={hotels}
            transports={transports}
            cities={cities}
          />
        );
      case 'pre_trip':
        return (
          <SmartPreTripGuide />
        );
      case 'accommodation':
        return (
          <AccommodationView
            trip={trip}
            hotels={hotels}
            onAddAccommodation={() => setIsAddAccommodationModalOpen(true)}
            onEditAccommodation={(hotel) => {
              setSelectedAccommodation(hotel);
              setIsAddAccommodationModalOpen(true);
            }}
            onDeleteAccommodation={handleDeleteAccommodation}
            filter={accommodationFilter}
            onFilterChange={setAccommodationFilter}
            viewMode={accommodationViewMode}
            onViewModeChange={setAccommodationViewMode}
            sortOrder={accommodationSortOrder}
            onSortOrderChange={setAccommodationSortOrder}
            isLoading={isLoadingHotels}
          />
        );
      case 'transport':
        return (
          <TransportView
            trip={trip}
            cities={cities}
            onAddClick={() => setIsAddTransportModalOpen(true)}
            onEditClick={handleEditTransport}
            onDeleteClick={handleDeleteTransport}
            isLoading={isLoadingTransports}
          />
        );

      case 'docs':
        return <DocumentsView documents={extraDocuments} docsFilter={docsFilter} onFilterChange={setDocsFilter} onAddDocument={() => setIsAddDocumentModalOpen(true)} travelers={trip.participants} onDeleteDocument={handleDeleteDocument} />;
      case 'budget':
        return (
          <BudgetView
            expenses={expenses}
            transactions={transactions}
            participants={tripParticipants}
            currentUserId={user?.id}
            tripId={trip.id}
            totalBudget={totalBudget}
            destination={trip.destination}
            onAddExpense={() => setIsAddExpenseModalOpen(true)}
            onAddTransaction={handleAddTransaction}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      case 'media':
        return (
          <MediaView
            trip={trip}
            onAddVideo={handleAddVideo}
            onRemoveVideo={handleRemoveVideo}
          />
        );
      case 'memories':
        return <JournalView tripId={trip.id} tripTitle={trip.title || trip.destination} tripStartDate={trip.startDate} />;
      case 'magazine':
        return (
          <MagazineView
            trip={trip}
            cities={cities}
            itineraryActivities={itineraryActivities}
          />
        );
      case 'briefing':
        return <PreTripBriefingView trip={trip} cities={cities} />;
      default: return null;
    }
  };

  // Trip stats for sidebar badges
  const tripStats = {
    cities: cities.length,
    days: trip.startDate && trip.endDate ? calculateNights(trip.startDate, trip.endDate) + 1 : 0,
    hotels: hotels.length,
    transports: transports.length,
    documents: extraDocuments.length,
    expenses: expenses.length,
    activities: itineraryActivities.length,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-100">
        <TripDetailsHeader trip={trip} onBack={onBack} onEdit={onEdit} onShare={() => setIsShareModalOpen(true)} />
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Nova Navegação Lateral (vertical) */}
        <TripNavigationSidebar
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          tripStats={tripStats}
          cities={cities}
          onCitySelect={handleOpenCityDetail}
          selectedCityId={selectedCity?.id}
        />

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-white [&::-webkit-scrollbar]:hidden">
          {/* Content */}
          <div
            className="p-6 md:p-8 pt-4 pb-12 space-y-6"
            role="tabpanel"
            id={`panel-${activeSubTab}`}
            aria-labelledby={`tab-${activeSubTab}`}
            tabIndex={0}
          >
            {renderTripDetailContent()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AttractionDetailModal
        isOpen={!!selectedAttraction}
        onClose={() => setSelectedAttraction(null)}
        attraction={selectedAttraction}
      />


      <AddCityModal
        isOpen={isAddCityModalOpen}
        onClose={() => setIsAddCityModalOpen(false)}
        onAdd={handleAddCity}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        existingCities={cities}
      />

      <EditCityModal
        isOpen={isEditCityModalOpen}
        onClose={() => {
          setIsEditCityModalOpen(false);
          setEditingCity(null);
        }}
        onUpdate={handleUpdateCity}
        city={editingCity}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        existingCities={cities}
      />

      <Modal
        isOpen={!!deletingCity}
        onClose={() => setDeletingCity(null)}
        title={`Excluir ${deletingCity?.name || 'Cidade'}?`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeletingCity(null)}>
              Cancelar
            </Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirmDeleteCity}>
              Excluir
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            Tem certeza que deseja excluir <strong>{deletingCity?.name}</strong> do roteiro?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
            <p className="text-sm text-amber-700">
              Atrações, restaurantes e notas salvas para esta cidade serão perdidos.
            </p>
          </div>
        </div>
      </Modal>


      <AddDocumentModal
        isOpen={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        onAdd={handleAddDocument}
        travelers={trip.participants}
        tripId={trip.id}
        tripEndDate={trip.endDate}
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
        cities={cities}
        activities={itineraryActivities}
        hotels={hotels}
        transports={transports}
      />

      <AddAccommodationModal
        isOpen={isAddAccommodationModalOpen}
        onClose={() => {
          setIsAddAccommodationModalOpen(false);
          setSelectedAccommodation(null);
          // setTargetCityId(null);
        }}
        onAdd={handleAddAccommodation}
        initialData={selectedAccommodation}
        flights={transports}
        cities={cities.map(c => ({ id: c.id, name: c.name }))}
        accommodations={hotels}
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
          onAdd={(act) => {
            if (trip.id) {
              addActivity(trip.id, act);
            }
          }}
          selectedDay={selectedActivityDay.day}
          selectedDate={selectedActivityDay.date}
        />
      )}
    </div>
  );
};

const TripDetails: React.FC<TripDetailsProps> = (props) => (
  <TripDetailsContent {...props} />
);

export default TripDetails;
