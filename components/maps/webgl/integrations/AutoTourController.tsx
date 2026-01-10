import React, { useState, useEffect, useCallback } from 'react';
import { useWebGLMap } from '../hooks/useWebGLMap';
import { Marker3D } from '../objects/Marker3D';
import { WaveHalo3D } from '../objects/Halo3D';

export interface TourStop {
  id: string;
  name: string;
  description?: string;
  location: google.maps.LatLngLiteral;
  duration?: number; // ms para ficar nesta parada
  zoom?: number;
  tilt?: number;
  heading?: number;
  color?: number;
}

export interface AutoTourControllerProps {
  stops: TourStop[];
  autoStart?: boolean;
  stopDuration?: number; // duração padrão em cada parada (ms)
  transitionDuration?: number; // duração da transição entre paradas (ms)
  loop?: boolean;
  onStopChange?: (stop: TourStop, index: number) => void;
  onTourComplete?: () => void;
  showMarkers?: boolean;
  showHalos?: boolean;
}

/**
 * Componente para controlar tours automáticos
 */
export const AutoTourController: React.FC<AutoTourControllerProps> = ({
  stops,
  autoStart = false,
  stopDuration = 5000,
  transitionDuration = 3000,
  loop = false,
  onStopChange,
  onTourComplete,
  showMarkers = true,
  showHalos = true,
}) => {
  const { manager, flyTo, isLoaded } = useWebGLMap();
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * Adicionar marcadores e halos nas paradas
   */
  useEffect(() => {
    if (!isLoaded || !manager || stops.length === 0) return;

    const markers: Marker3D[] = [];
    const halos: WaveHalo3D[] = [];

    stops.forEach((stop, index) => {
      // Criar marcador
      if (showMarkers) {
        const marker = new Marker3D({
          type: index === 0 ? 'flag' : index === stops.length - 1 ? 'sphere' : 'pin',
          color: stop.color || 0x6366f1,
          scale: 1,
          pulseEffect: false,
          floatEffect: true,
          rotateEffect: true,
          label: (index + 1).toString(),
        });

        const position = manager.overlay.latLngAltitudeToVector3({
          ...stop.location,
          altitude: 0,
        });
        marker.group.position.copy(position);
        manager.scene.add(marker.group);
        markers.push(marker);
      }

      // Criar halo
      if (showHalos) {
        const halo = new WaveHalo3D({
          color: stop.color || 0x6366f1,
          radius: 50,
          pulseSpeed: 0.003,
          rotationSpeed: 0.005,
          opacity: 0.6,
        });

        const position = manager.overlay.latLngAltitudeToVector3({
          ...stop.location,
          altitude: 0,
        });
        halo.group.position.copy(position);
        halo.group.visible = index === currentStopIndex;
        manager.scene.add(halo.group);
        halos.push(halo);
      }
    });

    // Callback de animação
    const animationCallback = (deltaTime: number) => {
      markers.forEach((marker) => marker.update(deltaTime * 0.001));
      halos.forEach((halo) => halo.update(deltaTime));
    };

    manager.onAnimate(animationCallback);

    // Cleanup
    return () => {
      markers.forEach((marker) => {
        manager.scene.remove(marker.group);
        marker.dispose();
      });

      halos.forEach((halo) => {
        manager.scene.remove(halo.group);
        halo.dispose();
      });

      manager.removeAnimateCallback(animationCallback);
    };
  }, [isLoaded, manager, stops, showMarkers, showHalos, currentStopIndex]);

  /**
   * Lógica do tour automático
   */
  useEffect(() => {
    if (!isPlaying || isPaused || !isLoaded) return;

    const currentStop = stops[currentStopIndex];
    if (!currentStop) return;

    // Voar para parada atual
    flyTo(currentStop.location, {
      zoom: currentStop.zoom || 17,
      tilt: currentStop.tilt || 65,
      heading: currentStop.heading || 45,
      duration: transitionDuration,
    });

    // Callback de mudança de parada
    if (onStopChange) {
      onStopChange(currentStop, currentStopIndex);
    }

    // Agendar próxima parada
    const timeout = setTimeout(() => {
      const nextIndex = currentStopIndex + 1;

      if (nextIndex >= stops.length) {
        // Tour completo
        if (loop) {
          setCurrentStopIndex(0);
        } else {
          setIsPlaying(false);
          if (onTourComplete) {
            onTourComplete();
          }
        }
      } else {
        setCurrentStopIndex(nextIndex);
      }
    }, (currentStop.duration || stopDuration) + transitionDuration);

    return () => clearTimeout(timeout);
  }, [
    isPlaying,
    isPaused,
    isLoaded,
    currentStopIndex,
    stops,
    flyTo,
    stopDuration,
    transitionDuration,
    loop,
    onStopChange,
    onTourComplete,
  ]);

  /**
   * Controles
   */
  const play = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStopIndex(0);
  }, []);

  const next = useCallback(() => {
    setCurrentStopIndex((prev) => Math.min(prev + 1, stops.length - 1));
  }, [stops.length]);

  const previous = useCallback(() => {
    setCurrentStopIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const jumpTo = useCallback((index: number) => {
    if (index >= 0 && index < stops.length) {
      setCurrentStopIndex(index);
    }
  }, [stops.length]);

  // Renderizar controles
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl min-w-[400px]">
        {/* Informação da Parada */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-text-muted">
              Parada {currentStopIndex + 1} de {stops.length}
            </span>
            <span className="text-xs text-text-muted">
              {isPlaying && !isPaused ? 'Em tour' : isPaused ? 'Pausado' : 'Parado'}
            </span>
          </div>
          <h3 className="text-base font-bold text-text-main">
            {stops[currentStopIndex]?.name || 'Carregando...'}
          </h3>
          {stops[currentStopIndex]?.description && (
            <p className="text-xs text-text-muted mt-1">
              {stops[currentStopIndex].description}
            </p>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStopIndex + 1) / stops.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          <button
            onClick={previous}
            disabled={currentStopIndex === 0}
            className="p-2 bg-gray-100 text-text-main rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Anterior"
          >
            <span className="material-symbols-outlined">skip_previous</span>
          </button>

          {!isPlaying || isPaused ? (
            <button
              onClick={isPaused ? resume : play}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              {isPaused ? 'Continuar' : 'Iniciar Tour'}
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">pause</span>
              Pausar
            </button>
          )}

          {isPlaying && (
            <button
              onClick={stop}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">stop</span>
              Parar
            </button>
          )}

          <button
            onClick={next}
            disabled={currentStopIndex === stops.length - 1}
            className="p-2 bg-gray-100 text-text-main rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próximo"
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>
        </div>

        {/* Navegação Rápida */}
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {stops.map((stop, index) => (
            <button
              key={stop.id}
              onClick={() => jumpTo(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                index === currentStopIndex
                  ? 'bg-primary text-white'
                  : index < currentStopIndex
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
              title={stop.name}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutoTourController;
