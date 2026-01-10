import React, { useEffect, useState, useCallback } from 'react';
import { WebGLMapProvider } from '../WebGLMapProvider';
import { useWebGLMap } from '../hooks/useWebGLMap';
import { Marker3D } from '../objects/Marker3D';
import { Halo3D, WaveHalo3D } from '../objects/Halo3D';
import { Attraction, City } from '../../../../types';

interface ImmersiveAttractionMapProps {
  city: City;
  attractions: Attraction[];
  onAttractionClick?: (attraction: Attraction) => void;
  autoFlyIn?: boolean;
  show3DBuildings?: boolean;
}

/**
 * Cores por categoria de atração
 */
const ATTRACTION_COLORS: Record<string, number> = {
  culture: 0x8b5cf6,    // Roxo
  nature: 0x22c55e,     // Verde
  food: 0xf97316,       // Laranja
  shopping: 0xec4899,   // Rosa
  sightseeing: 0x3b82f6, // Azul
  nightlife: 0x6366f1,  // Índigo
  entertainment: 0xf59e0b, // Amarelo
  default: 0xef4444     // Vermelho
};

/**
 * Componente interno com lógica 3D
 */
const AttractionMapContent: React.FC<{
  city: City;
  attractions: Attraction[];
  onAttractionClick?: (attraction: Attraction) => void;
  autoFlyIn: boolean;
}> = ({ city, attractions, onAttractionClick, autoFlyIn }) => {
  const { manager, map, isLoaded, flyTo, rotateCamera } = useWebGLMap();
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [flyInComplete, setFlyInComplete] = useState(false);

  /**
   * Geocodificar cidade e fazer fly-in inicial
   */
  useEffect(() => {
    if (!isLoaded || !map || !city || !autoFlyIn || flyInComplete) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: `${city.name}, ${city.country}` },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;

          // Iniciar alto e plano
          map.setCenter(location);
          map.setZoom(12);
          if (map.setTilt) map.setTilt(0);

          // Fly-in cinemático após delay
          setTimeout(() => {
            flyTo(
              { lat: location.lat(), lng: location.lng() },
              {
                zoom: 17,
                tilt: 67.5,
                heading: 45,
                duration: 3500,
              }
            );
            setFlyInComplete(true);
          }, 500);
        }
      }
    );
  }, [isLoaded, map, city, autoFlyIn, flyTo, flyInComplete]);

  /**
   * Adicionar marcadores 3D e halos para atrações
   */
  useEffect(() => {
    if (!isLoaded || !manager || !map || attractions.length === 0) return;

    const markers: Marker3D[] = [];
    const halos: (Halo3D | WaveHalo3D)[] = [];
    const geocoder = new google.maps.Geocoder();

    attractions.forEach((attraction, index) => {
      geocoder.geocode(
        { address: `${attraction.name}, ${city.name}, ${city.country}` },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            const color = ATTRACTION_COLORS[attraction.type || 'default'];
            const isSelected = selectedAttractionId === attraction.id;

            // Criar marcador 3D
            const markerType = index === 0 ? 'flag' : index === attractions.length - 1 ? 'sphere' : 'pin';
            const marker = new Marker3D({
              type: markerType,
              color,
              scale: isSelected ? 1.3 : 1,
              pulseEffect: isSelected,
              floatEffect: true,
              rotateEffect: index % 2 === 0,
              label: (index + 1).toString(),
              emissiveIntensity: isSelected ? 0.6 : 0.4,
            });

            // Posicionar marcador
            const position = manager.overlay.latLngAltitudeToVector3({
              lat: location.lat(),
              lng: location.lng(),
              altitude: 0,
            });
            marker.group.position.copy(position);

            // Click handler (raycasting)
            marker.group.userData = {
              attraction,
              clickable: true,
            };

            manager.scene.add(marker.group);
            markers.push(marker);

            // Criar halo
            const HaloClass = isSelected ? WaveHalo3D : Halo3D;
            const halo = new HaloClass({
              color,
              radius: isSelected ? 60 : 40,
              pulseSpeed: isSelected ? 0.004 : 0.002,
              rotationSpeed: isSelected ? 0.006 : 0.003,
              opacity: isSelected ? 0.7 : 0.5,
              ringCount: isSelected ? 4 : 3,
            });

            halo.group.position.copy(position);
            manager.scene.add(halo.group);
            halos.push(halo);
          }
        }
      );
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
  }, [isLoaded, manager, map, city, attractions, selectedAttractionId]);

  /**
   * Voar para atração selecionada
   */
  const handleAttractionClick = useCallback(
    (attraction: Attraction, index: number) => {
      setSelectedAttractionId(attraction.id);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: `${attraction.name}, ${city.name}` },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            flyTo(
              { lat: location.lat(), lng: location.lng() },
              {
                zoom: 18,
                tilt: 70,
                heading: 45 + index * 30,
                duration: 2000,
              }
            );
          }
        }
      );

      if (onAttractionClick) {
        onAttractionClick(attraction);
      }
    },
    [city, flyTo, onAttractionClick]
  );

  /**
   * Rotacionar câmera 360°
   */
  const handleRotate = useCallback(() => {
    setIsRotating(true);
    rotateCamera(360, 5000);
    setTimeout(() => setIsRotating(false), 5000);
  }, [rotateCamera]);

  /**
   * Voltar à visão geral
   */
  const handleOverview = useCallback(() => {
    setSelectedAttractionId(null);
    if (map) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: `${city.name}, ${city.country}` },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            flyTo(
              { lat: location.lat(), lng: location.lng() },
              {
                zoom: 15,
                tilt: 60,
                heading: 0,
                duration: 2000,
              }
            );
          }
        }
      );
    }
  }, [city, map, flyTo]);

  if (!isLoaded) {
    return null; // Loading já é mostrado pelo Provider
  }

  return (
    <>
      {/* Controles */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleRotate}
          disabled={isRotating}
          className="px-4 py-2 bg-white text-text-main rounded-xl font-bold text-sm shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">360</span>
          {isRotating ? 'Girando...' : 'Vista 360°'}
        </button>

        {selectedAttractionId && (
          <button
            onClick={handleOverview}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">zoom_out_map</span>
            Visão Geral
          </button>
        )}
      </div>

      {/* Lista de Atrações */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-bold text-text-main mb-3">
            📍 Atrações em {city.name}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {attractions.map((attraction, index) => (
              <button
                key={attraction.id}
                onClick={() => handleAttractionClick(attraction, index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedAttractionId === attraction.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-text-main hover:bg-gray-50 shadow'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{
                    backgroundColor: `#${(ATTRACTION_COLORS[attraction.type || 'default'])
                      .toString(16)
                      .padStart(6, '0')}`,
                  }}
                >
                  {index + 1}
                </span>
                {attraction.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda de Categorias */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10">
        <h4 className="text-xs font-bold text-text-main mb-2">Categorias</h4>
        <div className="flex flex-col gap-1">
          {Array.from(new Set(attractions.map(a => a.type || 'default'))).map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: `#${(ATTRACTION_COLORS[type])
                    .toString(16)
                    .padStart(6, '0')}`,
                }}
              />
              <span className="text-xs text-text-muted capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/**
 * Componente principal de mapa imersivo de atrações
 */
const ImmersiveAttractionMap: React.FC<ImmersiveAttractionMapProps> = ({
  city,
  attractions,
  onAttractionClick,
  autoFlyIn = true,
  show3DBuildings = true,
}) => {
  return (
    <div className="w-full h-full relative">
      <WebGLMapProvider
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID || ''}
        center={{ lat: 0, lng: 0 }}
        zoom={15}
        tilt={show3DBuildings ? 60 : 0}
        heading={0}
        onMapLoad={(map, manager) => {
          console.log('ImmersiveAttractionMap loaded', { map, manager });
        }}
      >
        <AttractionMapContent
          city={city}
          attractions={attractions}
          onAttractionClick={onAttractionClick}
          autoFlyIn={autoFlyIn}
        />
      </WebGLMapProvider>
    </div>
  );
};

export default ImmersiveAttractionMap;
