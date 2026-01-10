import React, { useState } from 'react';
import ImmersiveAttractionMap from './ImmersiveAttractionMap';
import ItineraryMap3D, { ItineraryStop } from './ItineraryMap3D';
import { WebGLMapProvider } from '../WebGLMapProvider';
import { AutoTourController, TourStop } from './AutoTourController';
import { Attraction, City } from '../../../../types';

/**
 * Exemplo de integração completa dos componentes WebGL
 */
const IntegrationExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attractions' | 'itinerary' | 'tour'>('attractions');

  // Dados de exemplo: São Paulo
  const exampleCity: City = {
    id: '1',
    name: 'São Paulo',
    country: 'Brasil',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    tripId: '1',
  };

  const exampleAttractions: Attraction[] = [
    {
      id: '1',
      name: 'MASP',
      type: 'culture',
      description: 'Museu de Arte de São Paulo',
      location: 'Av. Paulista, 1578',
      cityId: '1',
      rating: 4.7,
      imageUrl: '',
      tripId: '1',
    },
    {
      id: '2',
      name: 'Parque Ibirapuera',
      type: 'nature',
      description: 'Maior parque urbano de São Paulo',
      location: 'Av. Pedro Álvares Cabral',
      cityId: '1',
      rating: 4.8,
      imageUrl: '',
      tripId: '1',
    },
    {
      id: '3',
      name: 'Mercado Municipal',
      type: 'food',
      description: 'Famoso mercado com comidas típicas',
      location: 'Rua da Cantareira, 306',
      cityId: '1',
      rating: 4.6,
      imageUrl: '',
      tripId: '1',
    },
    {
      id: '4',
      name: 'Bairro da Liberdade',
      type: 'culture',
      description: 'Bairro japonês de São Paulo',
      location: 'Liberdade',
      cityId: '1',
      rating: 4.5,
      imageUrl: '',
      tripId: '1',
    },
  ];

  const exampleItinerary: ItineraryStop[] = [
    {
      id: '1',
      title: 'Aeroporto de Guarulhos',
      location: 'GRU - Guarulhos, SP',
      coordinates: [-23.4356, -46.4731],
      transportMode: 'plane',
      day: 1,
    },
    {
      id: '2',
      title: 'Hotel na Av. Paulista',
      location: 'Hotel Unique - Av. Paulista',
      coordinates: [-23.5614, -46.6558],
      transportMode: 'car',
      day: 1,
    },
    {
      id: '3',
      title: 'MASP',
      location: 'Museu de Arte de São Paulo',
      coordinates: [-23.5614, -46.6558],
      transportMode: 'walk',
      day: 2,
    },
    {
      id: '4',
      title: 'Parque Ibirapuera',
      location: 'Av. Pedro Álvares Cabral',
      coordinates: [-23.5875, -46.6577],
      transportMode: 'bus',
      day: 2,
    },
    {
      id: '5',
      title: 'Mercado Municipal',
      location: 'Rua da Cantareira, 306',
      coordinates: [-23.5414, -46.6291],
      transportMode: 'car',
      day: 3,
    },
  ];

  const exampleTourStops: TourStop[] = [
    {
      id: '1',
      name: 'MASP - Vista Frontal',
      description: 'Fachada icônica do museu',
      location: { lat: -23.5614, lng: -46.6558 },
      duration: 4000,
      zoom: 18,
      tilt: 70,
      heading: 0,
      color: 0x8b5cf6,
    },
    {
      id: '2',
      name: 'MASP - Vista Lateral',
      description: 'Estrutura suspensa do edifício',
      location: { lat: -23.5614, lng: -46.6560 },
      duration: 4000,
      zoom: 18,
      tilt: 65,
      heading: 90,
      color: 0x8b5cf6,
    },
    {
      id: '3',
      name: 'Parque Ibirapuera - Entrada',
      description: 'Portões principais do parque',
      location: { lat: -23.5875, lng: -46.6577 },
      duration: 5000,
      zoom: 17,
      tilt: 60,
      heading: 180,
      color: 0x22c55e,
    },
    {
      id: '4',
      name: 'Mercado Municipal',
      description: 'Arquitetura histórica',
      location: { lat: -23.5414, lng: -46.6291 },
      duration: 5000,
      zoom: 18,
      tilt: 70,
      heading: 270,
      color: 0xf97316,
    },
  ];

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-text-main mb-2">
          🗺️ WebGL Maps - Exemplos de Integração
        </h1>
        <p className="text-sm text-text-muted">
          Demonstração dos componentes integrados com dados reais do app
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('attractions')}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'attractions'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            📍 Mapa de Atrações
          </button>

          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'itinerary'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            🛤️ Itinerário 3D
          </button>

          <button
            onClick={() => setActiveTab('tour')}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'tour'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            🎬 Tour Automático
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {activeTab === 'attractions' && (
          <div className="absolute inset-0">
            <ImmersiveAttractionMap
              city={exampleCity}
              attractions={exampleAttractions}
              onAttractionClick={(attraction) => {
                console.log('Clicked:', attraction);
              }}
              autoFlyIn={true}
              show3DBuildings={true}
            />
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="absolute inset-0">
            <ItineraryMap3D
              stops={exampleItinerary}
              animationSpeed={5}
              autoPlay={false}
              onStopReached={(stop, index) => {
                console.log('Reached stop:', stop.title, 'at index:', index);
              }}
              onTourComplete={() => {
                console.log('Tour completed!');
              }}
            />
          </div>
        )}

        {activeTab === 'tour' && (
          <div className="absolute inset-0">
            <WebGLMapProvider
              mapId={import.meta.env.VITE_GOOGLE_MAP_ID || ''}
              center={{ lat: -23.5614, lng: -46.6558 }}
              zoom={16}
              tilt={65}
              heading={0}
            >
              <AutoTourController
                stops={exampleTourStops}
                autoStart={false}
                stopDuration={5000}
                transitionDuration={3000}
                loop={true}
                showMarkers={true}
                showHalos={true}
                onStopChange={(stop, index) => {
                  console.log('Tour stop changed:', stop.name, index);
                }}
                onTourComplete={() => {
                  console.log('Auto tour completed!');
                }}
              />
            </WebGLMapProvider>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-bold text-purple-900 mb-1">Mapa de Atrações</p>
              <p className="text-xs text-purple-700">
                Marcadores 3D, halos pulsantes, navegação imersiva
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-bold text-blue-900 mb-1">Itinerário 3D</p>
              <p className="text-xs text-blue-700">
                Rotas animadas, veículos em movimento, timeline interativa
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-bold text-green-900 mb-1">Tour Automático</p>
              <p className="text-xs text-green-700">
                Navegação autônoma, controles de reprodução, modo loop
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationExample;
