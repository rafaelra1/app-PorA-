import React, { createContext, useEffect, useRef, useState, ReactNode } from 'react';
import { WebGLOverlayManager } from './WebGLOverlayManager';

interface WebGLMapContextValue {
  map: google.maps.Map | null;
  manager: WebGLOverlayManager | null;
  isLoaded: boolean;
  error: Error | null;
}

export const WebGLMapContext = createContext<WebGLMapContextValue | null>(null);

interface WebGLMapProviderProps {
  children: ReactNode;
  mapId: string; // Map ID do Google Cloud Console com Vector habilitado
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  tilt?: number;
  heading?: number;
  onMapLoad?: (map: google.maps.Map, manager: WebGLOverlayManager) => void;
  mapContainerClassName?: string;
}

import { useGoogleMapsApi } from '../../../hooks/useGoogleMapsApi';

export const WebGLMapProvider: React.FC<WebGLMapProviderProps> = ({
  children,
  mapId,
  center = { lat: 0, lng: 0 },
  zoom = 15,
  tilt = 60,
  heading = 0,
  onMapLoad,
  mapContainerClassName = 'w-full h-full',
}) => {
  const { isLoaded: isApiLoaded } = useGoogleMapsApi();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [manager, setManager] = useState<WebGLOverlayManager | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mapRef.current || !isApiLoaded) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        // Carregar biblioteca do Google Maps
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

        if (!isMounted) return;

        // Criar mapa com Map ID para suporte WebGL
        const newMap = new Map(mapRef.current!, {
          center,
          zoom,
          tilt,
          heading,
          mapId, // Necessário para WebGL Overlay
          disableDefaultUI: false,
          gestureHandling: 'greedy',
          // Habilitar recursos 3D
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        // Inicializar WebGL Manager
        const webglManager = new WebGLOverlayManager(newMap);

        if (!isMounted) return;

        setMap(newMap);
        setManager(webglManager);
        setIsLoaded(true);

        // Callback de carregamento
        if (onMapLoad) {
          onMapLoad(newMap, webglManager);
        }
      } catch (err) {
        if (!isMounted) return;
        const errorObj = err instanceof Error ? err : new Error('Failed to initialize map');
        setError(errorObj);
        console.error('Erro ao inicializar WebGL Map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (manager) {
        manager.destroy();
      }
    };
  }, [mapId, center.lat, center.lng, zoom, tilt, heading, onMapLoad, isApiLoaded]);

  const contextValue: WebGLMapContextValue = {
    map,
    manager,
    isLoaded,
    error,
  };

  return (
    <WebGLMapContext.Provider value={contextValue}>
      <div className="relative w-full h-full">
        {/* Container do mapa */}
        <div ref={mapRef} className={mapContainerClassName} />

        {/* Loading state */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-text-muted">
                Carregando mapa 3D...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 max-w-md p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-600">
                  error
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-main">
                Erro ao carregar mapa
              </h3>
              <p className="text-sm text-text-muted">
                {error.message}
              </p>
              <p className="text-xs text-text-muted">
                Verifique se o Map ID está configurado corretamente no Google Cloud Console
                com suporte a Vector e WebGL habilitado.
              </p>
            </div>
          </div>
        )}

        {/* Renderizar children somente quando o mapa estiver carregado */}
        {isLoaded && children}
      </div>
    </WebGLMapContext.Provider>
  );
};
