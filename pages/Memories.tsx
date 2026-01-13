import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useItinerary } from '../contexts/ItineraryContext';
import { useTrips } from '../contexts/TripContext';
import { PageContainer, PageHeader, Button } from '../components/ui/Base';
import { EmptyState } from '../components/ui/EmptyState';
import {
  MemoryCard,
  PendingReviewsList,
  GamificationWidget,
  CreateReviewModal
} from '../components/memories';
import { TripMemory, PendingReviewItem, MemoryStats, Participant, ReviewContent } from '../types';

// Mock data for demonstration (in production, this would come from a database)
const MOCK_MEMORIES: TripMemory[] = [
  {
    id: 'mem_001',
    linkedItineraryItemId: 'evt_999_dinner',
    timestamp: '2026-06-09T21:30:00Z',
    date: '2026-06-09',
    type: 'REVIEW',
    content: {
      title: 'Jantar no Trattoria da Enzo',
      rating: 5,
      text: 'A melhor pasta carbonara da vida! O lugar é pequeno e barulhento, mas a vibe é autêntica. O garçom foi super simpático e deu dicas incríveis de vinhos locais.',
      tags: ['Gastronomia', 'Jantar', 'Vibe Local'],
      photos: [
        'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800',
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
      ],
    } as ReviewContent,
    author: {
      id: 'user_1',
      name: 'Viajante',
      avatar: 'https://ui-avatars.com/api/?name=V&background=667eea&color=fff',
    },
    location: 'Roma, Itália',
  },
  {
    id: 'mem_002',
    linkedItineraryItemId: 'evt_888_museum',
    timestamp: '2026-06-08T14:00:00Z',
    date: '2026-06-08',
    type: 'REVIEW',
    content: {
      title: 'Museus do Vaticano',
      rating: 5,
      text: 'Simplesmente impressionante. A Capela Sistina superou todas as expectativas. Recomendo ir bem cedo para evitar multidões.',
      tags: ['Cultura', 'Imperdível', 'Arte'],
      photos: [
        'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      ],
    } as ReviewContent,
    author: {
      id: 'user_1',
      name: 'Viajante',
      avatar: 'https://ui-avatars.com/api/?name=V&background=667eea&color=fff',
    },
    location: 'Vaticano',
  },
];

const Memories: React.FC = () => {
  const { user } = useAuth();
  const { activities, fetchActivities } = useItinerary();
  const { selectedTrip } = useTrips();

  // State
  const [memories, setMemories] = useState<TripMemory[]>(MOCK_MEMORIES);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedPendingItem, setSelectedPendingItem] = useState<PendingReviewItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'reviews' | 'notes'>('all');

  // Fetch activities when trip changes
  useEffect(() => {
    if (selectedTrip?.id) {
      fetchActivities(selectedTrip.id);
    }
  }, [selectedTrip?.id, fetchActivities]);

  // Get list of reviewed itinerary item IDs
  const reviewedIds = useMemo(() =>
    memories
      .filter(m => m.linkedItineraryItemId)
      .map(m => m.linkedItineraryItemId as string),
    [memories]
  );

  // Calculate stats for gamification
  const stats: MemoryStats = useMemo(() => {
    const categoryBreakdown: Record<string, number> = {};

    memories.forEach(m => {
      if (m.type === 'REVIEW') {
        const content = m.content as ReviewContent;
        content.tags.forEach(tag => {
          categoryBreakdown[tag] = (categoryBreakdown[tag] || 0) + 1;
        });
      }
    });

    // Count reviewable activities (past ones, excluding transport)
    const now = new Date();
    const pastActivities = activities.filter(act => {
      const actDate = new Date(`${act.date}T${act.time || '00:00'}`);
      return actDate < now && act.type !== 'transport' && act.type !== 'accommodation';
    });

    return {
      totalPlacesVisited: pastActivities.length || memories.length,
      reviewsWritten: memories.filter(m => m.type === 'REVIEW').length,
      pendingReviews: Math.max(0, pastActivities.length - reviewedIds.length),
      categoryBreakdown,
    };
  }, [memories, activities, reviewedIds]);

  // Filter memories based on active tab
  const filteredMemories = useMemo(() => {
    switch (activeTab) {
      case 'reviews':
        return memories.filter(m => m.type === 'REVIEW');
      case 'notes':
        return memories.filter(m => m.type === 'FREE_TEXT');
      default:
        return memories;
    }
  }, [memories, activeTab]);

  // Current user as Participant
  const currentUser: Participant = useMemo(() => ({
    id: user?.id || 'guest',
    name: user?.name || 'Viajante',
    avatar: user?.avatar || 'https://ui-avatars.com/api/?name=V&background=667eea&color=fff',
  }), [user]);

  // Handlers
  const handlePendingReviewClick = (item: PendingReviewItem) => {
    setSelectedPendingItem(item);
    setIsReviewModalOpen(true);
  };

  const handleCreateNewMemory = () => {
    setSelectedPendingItem(null);
    setIsReviewModalOpen(true);
  };

  const handleSubmitMemory = (newMemory: TripMemory) => {
    setMemories(prev => [newMemory, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    if (window.confirm('Excluir esta memória?')) {
      setMemories(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleShareMemory = (id: string) => {
    // Placeholder for share functionality
    alert('Funcionalidade de compartilhamento em desenvolvimento!');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Diário de Experiências"
        description="Suas memórias e avaliações integradas ao roteiro da viagem."
        actions={
          <Button
            onClick={handleCreateNewMemory}
            variant="primary"
            className="!bg-gradient-to-r !from-purple-600 !to-violet-600 shadow-lg shadow-purple-500/25"
          >
            <span className="material-symbols-outlined text-lg mr-2">add_circle</span>
            Nova Memória
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Pending Reviews & Gamification */}
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
          {/* Pending Reviews Widget */}
          <PendingReviewsList
            activities={activities}
            reviewedIds={reviewedIds}
            onReviewClick={handlePendingReviewClick}
          />

          {/* Gamification Widget */}
          <GamificationWidget stats={stats} />
        </div>

        {/* Main Content - Memory Feed */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex bg-gray-100/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reviews'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span className="material-symbols-outlined text-sm mr-1 align-middle">star</span>
                Avaliações
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'notes'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span className="material-symbols-outlined text-sm mr-1 align-middle">edit_note</span>
                Relatos
              </button>
            </div>

            <div className="flex-1" />

            <span className="text-xs text-gray-400 font-medium">
              {filteredMemories.length} memória{filteredMemories.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Memory Cards */}
          {filteredMemories.length > 0 ? (
            <div className="space-y-6">
              {filteredMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onDelete={handleDeleteMemory}
                  onShare={handleShareMemory}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="illustrated"
              icon="auto_stories"
              title={
                activeTab === 'all'
                  ? 'Nenhuma memória ainda'
                  : activeTab === 'reviews'
                    ? 'Nenhuma avaliação'
                    : 'Nenhum relato livre'
              }
              description={
                activeTab === 'all'
                  ? 'Comece avaliando os lugares que você visitou ou escreva sobre suas experiências.'
                  : activeTab === 'reviews'
                    ? 'Avalie os lugares do seu roteiro para ver suas avaliações aqui.'
                    : 'Escreva relatos livres sobre sua viagem.'
              }
              action={{
                label: 'Criar Primeira Memória',
                onClick: handleCreateNewMemory,
              }}
            />
          )}
        </div>
      </div>

      {/* Create Review Modal */}
      <CreateReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedPendingItem(null);
        }}
        onSubmit={handleSubmitMemory}
        prefilledItem={selectedPendingItem}
        currentUser={currentUser}
      />
    </PageContainer>
  );
};

export default Memories;
