import React, { useEffect, useState } from 'react';
import { WebGLMapProvider } from './WebGLMapProvider';
import { useWebGLMap } from './hooks/useWebGLMap';

/**
 * Componente interno que usa o hook useWebGLMap
 * Deve estar dentro do WebGLMapProvider
 */
const MapContent: React.FC = () => {
  const {
    isLoaded,
    error,
    addMarker3D,
    addRoute3D,
    addHalo,
    flyTo,
    rotateCamera,
  } = useWebGLMap();

  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Exemplo: Adicionar marcador em Tokyo
    addMarker3D(
      'tokyo-tower',
      { lat: 35.6586, lng: 139.7454 },
      {
        color: 0xff6b6b,
        height: 50,
        animated: true,
        scale: 1,
      }
    );

    // Exemplo: Adicionar halo
    addHalo(
      'tokyo-halo',
      { lat: 35.6586, lng: 139.7454 },
      {
        color: 0xffd700,
        radius: 30,
        pulseSpeed: 0.002,
      }
    );

    // Exemplo: Adicionar rota
    const routePoints = [
      { lat: 35.6586, lng: 139.7454 }, // Tokyo Tower
      { lat: 35.6762, lng: 139.6503 }, // Shinjuku
      { lat: 35.6895, lng: 139.6917 }, // Shibuya
    ];

    addRoute3D('tokyo-route', routePoints, {
      color: 0x6366f1,
      altitude: 40,
      width: 3,
      opacity: 0.8,
    });
  }, [isLoaded, addMarker3D, addHalo, addRoute3D]);

  const handleFlyToTokyo = () => {
    flyTo(
      { lat: 35.6586, lng: 139.7454 },
      {
        zoom: 17,
        tilt: 60,
        heading: 45,
        duration: 1000,
      }
    );
  };

  const handleRotate = () => {
    setIsRotating(true);
    rotateCamera(360, 5000);
    setTimeout(() => setIsRotating(false), 5000);
  };

  if (error) {
    return null; // Erro já é exibido pelo Provider
  }

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
      <button
        onClick={handleFlyToTokyo}
        disabled={!isLoaded}
        className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">location_on</span>
        Ir para Tokyo Tower
      </button>

      <button
        onClick={handleRotate}
        disabled={!isLoaded || isRotating}
        className="px-4 py-2 bg-white text-text-main rounded-xl font-bold text-sm shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">360</span>
        {isRotating ? 'Girando...' : 'Girar 360°'}
      </button>
    </div>
  );
};

/**
 * Componente exemplo de uso do WebGL Map
 */
const WebGLMapExample: React.FC = () => {
  // Você precisa criar um Map ID no Google Cloud Console
  // com suporte a Vector/WebGL habilitado
  const mapId = import.meta.env.VITE_GOOGLE_MAP_ID || 'YOUR_MAP_ID';

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden">
      <WebGLMapProvider
        mapId={mapId}
        center={{ lat: 35.6586, lng: 139.7454 }} // Tokyo Tower
        zoom={15}
        tilt={60}
        heading={0}
        onMapLoad={(map, manager) => {
          console.log('Mapa WebGL carregado!', { map, manager });
        }}
      >
        <MapContent />
      </WebGLMapProvider>
    </div>
  );
};

export default WebGLMapExample;
