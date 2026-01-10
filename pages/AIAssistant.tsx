import React, { useState, useCallback } from 'react';
import { getGeminiService } from '../services/geminiService';
import {
  TravelBudget,
  TravelRhythm,
  TravelCompany,
  TravelInterest,
  AIGeneratedPlan,
  AIItineraryDay,
  ChatMessage,
} from '../types';
import AIInputSection from '../components/ai-assistant/AIInputSection';
import AIResultMap from '../components/ai-assistant/AIResultMap';
import AIRefinementChat from '../components/ai-assistant/AIRefinementChat';
import AIActivityCard from '../components/ai-assistant/AIActivityCard';
import AIEmptyState from '../components/ai-assistant/AIEmptyState';
import AIAssistantV2 from './AIAssistantV2';
import { PageContainer, PageHeader, Button, Card } from '../components/ui/Base';

type ViewMode = 'input' | 'result';

const AIAssistant: React.FC = () => {
  // V2 Toggle
  const [useV2, setUseV2] = useState(false);

  // Input state (must be declared before any conditional returns - React Hooks Rule)
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [budget, setBudget] = useState<TravelBudget>('balanced');
  const [rhythm, setRhythm] = useState<TravelRhythm>('moderate');
  const [company, setCompany] = useState<TravelCompany>('couple');
  const [interests, setInterests] = useState<TravelInterest[]>(['food', 'history']);

  // Result state
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Hook must be called before early return (React Hooks Rule)
  const handlePromptClick = useCallback((dest: string, numDays: string) => {
    setDestination(dest);
    setDays(numDays);
  }, []);

  // If V2 is enabled, render the new component
  if (useV2) {
    return (
      <div className="relative">
        {/* V1 Toggle Button */}
        <button
          onClick={() => setUseV2(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">undo</span>
          Voltar para V1
        </button>
        <AIAssistantV2 />
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!destination) return;
    setLoading(true);
    try {
      const geminiService = getGeminiService();
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const plan = await geminiService.generateEnhancedItinerary(
        destination,
        startDate,
        endDate,
        budget,
        rhythm,
        company,
        interests
      );

      if (plan) {
        setGeneratedPlan(plan);
        setViewMode('result');
        setSelectedDay(1);
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
    }
    setLoading(false);
  };

  const handleRefineMessage = async (message: string) => {
    if (!generatedPlan) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setRefineLoading(true);

    try {
      const geminiService = getGeminiService();
      const refinedPlan = await geminiService.refineItinerary(generatedPlan, message);

      if (refinedPlan) {
        setGeneratedPlan(refinedPlan);

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Pronto! Atualizei o roteiro conforme sua solicitação. Confira as mudanças no itinerário.',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error refining itinerary:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, houve um erro ao atualizar o roteiro. Tente novamente.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
    setRefineLoading(false);
  };

  const handleSurpriseMe = () => {
    handleRefineMessage('Surpreenda-me! Troque uma atividade turística comum por uma jóia escondida que poucos turistas conhecem.');
  };

  const handleBackToInput = () => {
    setViewMode('input');
  };

  const handleSaveToTrips = () => {
    // TODO: Implement save to trips functionality
    alert('Funcionalidade em desenvolvimento! Em breve você poderá salvar este roteiro.');
  };

  const selectedDayData = generatedPlan?.days.find((d) => d.day === selectedDay);



  return (
    <PageContainer>
      {viewMode === 'input' && (
        <PageHeader
          title="Planejador Inteligente"
          description="Crie roteiros personalizados em segundos com o poder da Inteligência Artificial."
          actions={
            <Button
              variant="secondary"
              onClick={() => setUseV2(true)}
              className="h-10 px-4 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-sm mr-2">science</span>
              Testar V2 Beta
            </Button>
          }
        />
      )}

      {viewMode === 'result' && (
        /* Custom Header for Result Mode to keep Back button context */
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToInput}
              className="size-10 rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors flex items-center justify-center shadow-sm"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-text-main">{generatedPlan?.destination}</h1>
              <p className="text-sm text-text-muted font-medium">
                {generatedPlan?.days.length} dias • {generatedPlan?.totalEstimatedCost}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {generatedPlan?.weatherSummary && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                <span className="material-symbols-outlined text-sm">partly_cloudy_day</span>
                {generatedPlan.weatherSummary}
              </div>
            )}
            <Button variant="primary" onClick={handleSaveToTrips} className="h-10 px-5 text-xs font-bold">
              <span className="material-symbols-outlined text-sm mr-1">bookmark</span>
              Salvar
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'input' ? (
        <>
          {/* Input Section */}
          <AIInputSection
            destination={destination}
            setDestination={setDestination}
            days={days}
            setDays={setDays}
            budget={budget}
            setBudget={setBudget}
            rhythm={rhythm}
            setRhythm={setRhythm}
            company={company}
            setCompany={setCompany}
            interests={interests}
            setInterests={setInterests}
            onGenerate={handleGenerate}
            loading={loading}
          />

          {/* Empty State / Inspiration */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-12">
                <div className="size-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-6 animate-pulse">
                  <span className="material-symbols-outlined text-3xl text-indigo-500 animate-spin">
                    refresh
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Planejando sua viagem...
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                  Nossa IA está criando um roteiro personalizado baseado nas suas preferências.
                  Isso pode levar alguns segundos.
                </p>
                <div className="mt-8 space-y-2 w-full max-w-md">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            ) : (
              <AIEmptyState onPromptClick={handlePromptClick} />
            )}
          </div>
        </>
      ) : (
        <>


          {/* Day Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === null
                ? 'bg-primary text-text-main shadow-sm'
                : 'bg-white text-text-muted hover:bg-gray-50 border border-gray-100'
                }`}
            >
              Todos os Dias
            </button>
            {generatedPlan?.days.map((day) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === day.day
                  ? 'bg-primary text-text-main shadow-sm'
                  : 'bg-white text-text-muted hover:bg-gray-50 border border-gray-100'
                  }`}
              >
                Dia {day.day}
              </button>
            ))}
          </div>

          {/* Split View: Itinerary + Map */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            {/* Left: Itinerary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedDay ? `Dia ${selectedDay}: ${selectedDayData?.title}` : 'Roteiro Completo'}
                </h3>
                {selectedDayData?.summary && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedDayData.summary}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {(selectedDay ? [selectedDayData].filter(Boolean) : generatedPlan?.days)?.map(
                    (day) =>
                      day && (
                        <div key={day.day} className="space-y-4">
                          {!selectedDay && (
                            <div className="flex items-center gap-3 mb-4">
                              <div className="size-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                  {day.day}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {day.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {day.totalCost}
                                </p>
                              </div>
                            </div>
                          )}
                          {day.activities.map((activity) => (
                            <AIActivityCard
                              key={activity.id}
                              activity={activity}
                              dayNumber={day.day}
                              onViewDetails={() => {
                                // TODO: Open detail modal
                              }}
                              onSwap={() => {
                                handleRefineMessage(
                                  `Troque a atividade "${activity.title}" do dia ${day.day} por outra opção similar.`
                                );
                              }}
                            />
                          ))}
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>

            {/* Right: Map + Context */}
            <div className="flex flex-col gap-6">
              {/* Map */}
              <div className="flex-1 min-h-[300px] lg:min-h-0">
                <AIResultMap
                  days={generatedPlan?.days || []}
                  selectedDay={selectedDay}
                  onActivityClick={(activity) => {
                    console.log('Activity clicked:', activity);
                  }}
                />
              </div>

              {/* Refinement Chat */}
              <AIRefinementChat
                messages={chatMessages}
                onSendMessage={handleRefineMessage}
                onSurpriseMe={handleSurpriseMe}
                isLoading={refineLoading}
              />
            </div>
          </div>
        </>
      )
      }
    </PageContainer>
  );
};

export default AIAssistant;
