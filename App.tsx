import React from 'react';
import TopNavigation from './components/TopNavigation';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Travels from './pages/Travels';
import Journal from './pages/Journal';
import TripDetails from './pages/TripDetails';
import CalendarView from './pages/CalendarView';
import Documents from './pages/Documents';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AddTripModal from './components/AddTripModal';
import Chatbot from './components/Chatbot';
import { TripProvider, useTrips } from './contexts/TripContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { AIProvider } from './contexts/AIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AccommodationProvider } from './contexts/AccommodationContext';
import { Trip } from './types';

const AppContent: React.FC = () => {
  const { trips, selectedTrip, selectTrip, editingTrip, setEditingTrip, addTrip, updateTrip, deleteTrip, isLoading: isLoadingTrips } = useTrips();
  const { activeTab, setActiveTab, isAddModalOpen, openAddModal, closeAddModal } = useUI();
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();

  // Show loading state while checking authentication or loading trips
  if (isLoadingAuth || (isAuthenticated && isLoadingTrips)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="size-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-white font-bold">{isLoadingAuth ? 'Carregando...' : 'Carregando suas viagens...'}</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const handleAddTrip = async (newTrip: Trip) => {
    const result = await addTrip(newTrip);
    if (result.success) {
      closeAddModal();
    } else {
      alert(result.error || 'Erro ao criar viagem');
    }
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    const result = await updateTrip(updatedTrip);
    if (result.success) {
      setEditingTrip(undefined);
      closeAddModal();
    } else {
      alert(result.error || 'Erro ao atualizar viagem');
    }
  };

  const openAddModalWithTrip = (trip?: Trip) => {
    setEditingTrip(trip);
    openAddModal();
  };

  const handleViewTrip = (id: string) => {
    selectTrip(id);
    setActiveTab('trip-details');
  };

  const handleDeleteTrip = async (id: string) => {
    const trip = trips.find(t => t.id === id);
    const confirmMessage = trip
      ? `Tem certeza que deseja excluir a viagem "${trip.title}"?`
      : 'Tem certeza que deseja excluir esta viagem?';

    if (!window.confirm(confirmMessage)) return;

    const result = await deleteTrip(id);
    if (!result.success) {
      alert(result.error || 'Erro ao excluir viagem');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'trip-details') selectTrip(null);
  };

  const renderContent = () => {
    if (activeTab === 'trip-details' && selectedTrip) {
      return <TripDetails trip={selectedTrip} onBack={() => setActiveTab('travels')} onEdit={() => openAddModalWithTrip(selectedTrip)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onOpenAddModal={() => openAddModalWithTrip()} trips={trips} onViewTrip={handleViewTrip} onEditTrip={(id) => { const trip = trips.find(t => t.id === id); if (trip) openAddModalWithTrip(trip); }} onDeleteTrip={handleDeleteTrip} onNavigate={setActiveTab} />;
      case 'calendar':
        return <CalendarView trips={trips} onViewTrip={handleViewTrip} />;
      case 'ai':
        return <AIAssistant />;
      case 'travels':
        return <Travels trips={trips} onOpenAddModal={() => openAddModalWithTrip()} onEditTrip={(trip) => openAddModalWithTrip(trip)} onViewTrip={handleViewTrip} onDeleteTrip={handleDeleteTrip} />;
      case 'journal':
        return <Journal />;
      case 'documents':
        return <Documents />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center text-primary-dark mb-4">
              <span className="material-symbols-outlined text-4xl">construction</span>
            </div>
            <h2 className="text-2xl font-bold text-text-main">Em Breve</h2>
            <p className="text-text-muted mt-2">A tela de "{activeTab}" está sendo preparada com carinho!</p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-6 px-6 py-2 bg-text-main text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-sl-bg dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex flex-col transition-colors duration-300">
      {/* Top Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddModal={() => openAddModalWithTrip()}
      />

      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {renderContent()}
        </div>
      </main>

      <AddTripModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onAdd={handleAddTrip}
        onUpdate={handleUpdateTrip}
        initialTrip={editingTrip}
      />

      {/* Global Chatbot */}
      <Chatbot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TripProvider>
          <AccommodationProvider>
            <UIProvider>
              <AIProvider>
                <AppContent />
              </AIProvider>
            </UIProvider>
          </AccommodationProvider>
        </TripProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
