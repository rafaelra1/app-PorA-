import * as React from 'react';
import { lazy, Suspense } from 'react';
import TopNavigation from './components/TopNavigation';
import OfflineIndicator from './components/ui/OfflineIndicator';
import { PageLoader } from './components/ui/PageLoader';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Travels = lazy(() => import('./pages/Travels'));
const Memories = lazy(() => import('./pages/Memories'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const Library = lazy(() => import('./pages/Library'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Login = lazy(() => import('./pages/Login'));

// Lazy load heavy components
const AddTripModal = lazy(() => import('./components/AddTripModal'));
const Chatbot = lazy(() => import('./components/Chatbot'));
import { ErrorBoundary } from './components/ErrorBoundary';
import { TripProvider, useTrips } from './contexts/TripContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { AIProvider } from './contexts/AIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { ToastProvider } from './contexts/ToastContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ChecklistProvider } from './contexts/ChecklistContext';
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
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  const handleAddTrip = async (newTrip: Omit<Trip, 'id'> | Trip) => {
    try {
      await addTrip(newTrip);
      closeAddModal();
    } catch (error) {
      alert('Erro ao criar viagem');
    }
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    try {
      await updateTrip(updatedTrip);
      setEditingTrip(undefined);
      closeAddModal();
    } catch (error) {
      alert('Erro ao atualizar viagem');
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
    // Confirmation is handled by UI overlays in Travels.tsx and other components
    try {
      await deleteTrip(id);
    } catch (e) {
      alert('Erro ao excluir viagem');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'trip-details') selectTrip(null);
  };

  const renderContent = () => {
    if (activeTab === 'trip-details' && selectedTrip) {
      return (
        <Suspense fallback={<PageLoader />}>
          <TripDetails trip={selectedTrip} onBack={() => setActiveTab('travels')} onEdit={() => openAddModalWithTrip(selectedTrip)} />
        </Suspense>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard onOpenAddModal={() => openAddModalWithTrip()} trips={trips} onViewTrip={handleViewTrip} onEditTrip={(id) => { const trip = trips.find(t => t.id === id); if (trip) openAddModalWithTrip(trip); }} onDeleteTrip={handleDeleteTrip} onNavigate={setActiveTab} />
          </Suspense>
        );
      case 'calendar':
        return (
          <Suspense fallback={<PageLoader />}>
            <CalendarView trips={trips} onViewTrip={handleViewTrip} />
          </Suspense>
        );
      case 'ai':
        return (
          <Suspense fallback={<PageLoader />}>
            <AIAssistant />
          </Suspense>
        );
      case 'travels':
        return (
          <Suspense fallback={<PageLoader />}>
            <Travels trips={trips} onOpenAddModal={() => openAddModalWithTrip()} onEditTrip={(trip) => openAddModalWithTrip(trip)} onViewTrip={handleViewTrip} onDeleteTrip={handleDeleteTrip} />
          </Suspense>
        );
      case 'memories':
        return (
          <Suspense fallback={<PageLoader />}>
            <Memories />
          </Suspense>
        );
      case 'library':
        return (
          <Suspense fallback={<PageLoader />}>
            <Library />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        );
      case 'notifications':
        return (
          <Suspense fallback={<PageLoader />}>
            <Notifications />
          </Suspense>
        );
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
    <div className="bg-white dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex flex-col transition-colors duration-300">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1000] focus:bg-white focus:text-primary focus:p-4 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-primary focus:font-bold"
      >
        Ir para conteúdo principal
      </a>

      {/* Top Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddModal={() => openAddModalWithTrip()}
      />

      {/* Main Content - Full Width */}
      <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
          {renderContent()}
        </div>
      </main>

      {isAddModalOpen && (
        <Suspense fallback={null}>
          <AddTripModal
            isOpen={isAddModalOpen}
            onClose={closeAddModal}
            onAdd={handleAddTrip}
            onUpdate={handleUpdateTrip}
            initialTrip={editingTrip}
          />
        </Suspense>
      )}

      {/* Global Chatbot */}
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>

      <OfflineIndicator />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TripProvider>
            <CalendarProvider>
              <CurrencyProvider>
                <ChecklistProvider>
                  <UIProvider>
                    <AIProvider>
                      <NotificationProvider>
                        <ToastProvider>
                          <AppContent />
                        </ToastProvider>
                      </NotificationProvider>
                    </AIProvider>
                  </UIProvider>
                </ChecklistProvider>
              </CurrencyProvider>
            </CalendarProvider>
          </TripProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
