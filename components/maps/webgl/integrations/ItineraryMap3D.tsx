import React, { useState, useEffect, useMemo } from 'react';
import { WebGLMapProvider } from '../WebGLMapProvider';
import { useWebGLMap } from '../hooks/useWebGLMap';
import { useAnimatedRoute, AnimatedRouteSegment } from '../hooks/useAnimatedRoute';
import { VehicleType } from '../objects/Vehicle3D';

/**
 * Interface para parada do itinerário (compatível com AnimatedItineraryMap)
 */
export interface ItineraryStop {
  id: string;
  title: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  transportMode: 'plane' | 'car' | 'train' | 'bus' | 'walk' | 'ferry';
  day: number;
}

interface ItineraryMap3DProps {
  stops: ItineraryStop[];
  animationSpeed?: number; // 1-10
  autoPlay?: boolean;
  onStopReached?: (stop: ItineraryStop, index: number) => void;
  onTourComplete?: () => void;
}

/**
 * Mapeamento de modos de transporte
 */
const TRANSPORT_MAP: Record<string, VehicleType> = {
  plane: 'flight',
  car: 'car',
  train: 'train',
  bus: 'bus',
  walk: 'walk',
  ferry: 'boat',
};

/**
 * Cores por modo de transporte
 */
const TRANSPORT_COLORS: Record<string, number> = {
  flight: 0x3b82f6,   // Azul
  car: 0xef4444,      // Vermelho
  train: 0x22c55e,    // Verde
  bus: 0xf59e0b,      // Laranja
  walk: 0x8b5cf6,     // Roxo
  boat: 0x06b6d4,     // Ciano
};

/**
 * Ícones Material Symbols para cada transporte
 */
const TRANSPORT_ICONS: Record<string, string> = {
  flight: 'flight',
  car: 'directions_car',
  train: 'train',
  bus: 'directions_bus',
  walk: 'directions_walk',
  boat: 'directions_boat',
};

/**
 * Componente interno com lógica de rota animada
 */
const ItineraryMapContent: React.FC<{
  stops: ItineraryStop[];
  speed: number;
  autoPlay: boolean;
  onStopReached?: (stop: ItineraryStop, index: number) => void;
  onTourComplete?: () => void;
}> = ({ stops, speed, autoPlay, onStopReached, onTourComplete }) => {
  const { isLoaded, flyTo } = useWebGLMap();
  const [currentStop, setCurrentStop] = useState(0);

  // Converter paradas em segmentos de rota
  const routeSegments: AnimatedRouteSegment[] = useMemo(() => {
    const segments: AnimatedRouteSegment[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];

      const segment: AnimatedRouteSegment = {
        points: [
          { lat: fromStop.coordinates[0], lng: fromStop.coordinates[1] },
          { lat: toStop.coordinates[0], lng: toStop.coordinates[1] },
        ],
        transportType: TRANSPORT_MAP[fromStop.transportMode] || 'car',
        color: TRANSPORT_COLORS[TRANSPORT_MAP[fromStop.transportMode]] || TRANSPORT_COLORS.car,
        duration: calculateDuration(fromStop, toStop, speed),
      };

      segments.push(segment);
    }

    return segments;
  }, [stops, speed]);

  // Controles da rota animada
  const routeControls = useAnimatedRoute('itinerary-route', {
    segments: routeSegments,
    autoPlay,
    loop: false,
    onSegmentStart: (index) => {
      setCurrentStop(index);
      if (onStopReached && stops[index]) {
        onStopReached(stops[index], index);
      }
    },
    onSegmentEnd: (index) => {
      // Voar para próxima parada
      const nextStop = stops[index + 1];
      if (nextStop) {
        flyTo(
          {
            lat: nextStop.coordinates[0],
            lng: nextStop.coordinates[1],
          },
          {
            zoom: 16,
            tilt: 65,
            heading: 45,
            duration: 1500,
          }
        );
      }
    },
    onRouteComplete: () => {
      if (onTourComplete) {
        onTourComplete();
      }
    },
  });

  // Ajustar velocidade
  useEffect(() => {
    routeControls.setSpeed(speed / 5); // Normalizar para 0.2x - 2x
  }, [speed, routeControls]);

  // Fly-in inicial
  useEffect(() => {
    if (isLoaded && stops.length > 0) {
      const firstStop = stops[0];
      flyTo(
        {
          lat: firstStop.coordinates[0],
          lng: firstStop.coordinates[1],
        },
        {
          zoom: 14,
          tilt: 60,
          heading: 0,
          duration: 3000,
        }
      );
    }
  }, [isLoaded, stops, flyTo]);

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      {/* Controles de Reprodução */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          {/* Informação da Parada Atual */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="material-symbols-outlined text-primary"
                style={{
                  color: `#${(TRANSPORT_COLORS[TRANSPORT_MAP[stops[currentStop]?.transportMode]] || TRANSPORT_COLORS.car)
                    .toString(16)
                    .padStart(6, '0')}`,
                }}
              >
                {TRANSPORT_ICONS[TRANSPORT_MAP[stops[currentStop]?.transportMode]] || 'location_on'}
              </span>
              <span className="text-xs font-bold text-text-muted">
                Parada {currentStop + 1} de {stops.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-text-main">
              {stops[currentStop]?.title || 'Carregando...'}
            </h3>
            <p className="text-xs text-text-muted">{stops[currentStop]?.location}</p>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-text-muted">Progresso</span>
              <span className="text-xs text-text-muted">
                {Math.round(routeControls.progress * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
                style={{ width: `${routeControls.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Botões de Controle */}
          <div className="flex gap-2">
            <button
              onClick={routeControls.isPlaying ? routeControls.pause : routeControls.play}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                {routeControls.isPlaying ? 'pause' : 'play_arrow'}
              </span>
              {routeControls.isPlaying ? 'Pausar' : 'Iniciar Tour'}
            </button>

            <button
              onClick={routeControls.reset}
              className="px-4 py-2 bg-white text-text-main rounded-lg font-bold text-sm border-2 border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">restart_alt</span>
              Reiniciar
            </button>

            {/* Velocidade */}
            <select
              value={speed}
              onChange={(e) => routeControls.setSpeed(Number(e.target.value) / 5)}
              className="px-3 py-2 bg-white text-text-main rounded-lg font-bold text-sm border-2 border-gray-200 focus:outline-none focus:border-primary"
            >
              <option value="1">0.2x</option>
              <option value="3">0.6x</option>
              <option value="5">1x</option>
              <option value="8">1.6x</option>
              <option value="10">2x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline de Paradas */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg max-h-[400px] overflow-y-auto z-10">
        <h4 className="text-xs font-bold text-text-main mb-2">Timeline</h4>
        <div className="space-y-2">
          {stops.map((stop, index) => {
            const isPast = index < currentStop;
            const isCurrent = index === currentStop;
            const isFuture = index > currentStop;

            return (
              <button
                key={stop.id}
                onClick={() => routeControls.jumpToSegment(Math.max(0, index - 1))}
                className={`w-full text-left p-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-primary text-white'
                    : isPast
                    ? 'bg-green-50 text-green-900'
                    : 'bg-gray-50 text-text-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isCurrent
                        ? 'bg-white text-primary'
                        : isPast
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{stop.title}</p>
                    <p className="text-xs opacity-75 truncate">{stop.location}</p>
                    {index < stops.length - 1 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-xs">
                          {TRANSPORT_ICONS[TRANSPORT_MAP[stop.transportMode]]}
                        </span>
                        <span className="text-xs opacity-75 capitalize">
                          {stop.transportMode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

/**
 * Componente principal de mapa 3D de itinerário
 */
const ItineraryMap3D: React.FC<ItineraryMap3DProps> = ({
  stops,
  animationSpeed = 5,
  autoPlay = false,
  onStopReached,
  onTourComplete,
}) => {
  if (stops.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-text-muted">Nenhuma parada no itinerário</p>
      </div>
    );
  }

  // Centro inicial (primeira parada)
  const initialCenter = useMemo(
    () => ({
      lat: stops[0].coordinates[0],
      lng: stops[0].coordinates[1],
    }),
    [stops]
  );

  return (
    <div className="w-full h-full relative">
      <WebGLMapProvider
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID || ''}
        center={initialCenter}
        zoom={14}
        tilt={60}
        heading={0}
        onMapLoad={(map, manager) => {
          console.log('ItineraryMap3D loaded', { map, manager, stops: stops.length });
        }}
      >
        <ItineraryMapContent
          stops={stops}
          speed={animationSpeed}
          autoPlay={autoPlay}
          onStopReached={onStopReached}
          onTourComplete={onTourComplete}
        />
      </WebGLMapProvider>
    </div>
  );
};

/**
 * Helper: Calcular duração do segmento baseado em distância
 */
function calculateDuration(from: ItineraryStop, to: ItineraryStop, speed: number): number {
  // Calcular distância aproximada (fórmula de Haversine)
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(to.coordinates[0] - from.coordinates[0]);
  const dLon = toRad(to.coordinates[1] - from.coordinates[1]);
  const lat1 = toRad(from.coordinates[0]);
  const lat2 = toRad(to.coordinates[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Duração base: 1km = 1 segundo
  // Ajustar por velocidade do usuário (1-10)
  const baseDuration = distance * 1000; // em ms
  const speedMultiplier = 11 - speed; // Inverter: speed 10 = mais rápido

  return Math.max(2000, baseDuration / speedMultiplier);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export default ItineraryMap3D;
