import React, { useEffect, useState } from 'react';
import { WebGLMapProvider } from './WebGLMapProvider';
import { useWebGLMap } from './hooks/useWebGLMap';
import { useAnimatedRoute } from './hooks/useAnimatedRoute';
import { Marker3D } from './objects/Marker3D';
import { Halo3D, WaveHalo3D } from './objects/Halo3D';

/**
 * Componente de conteúdo com rotas animadas
 */
const AnimatedTripContent: React.FC = () => {
  const { manager, isLoaded } = useWebGLMap();
  const [selectedAttractionIndex, setSelectedAttractionIndex] = useState(0);

  // Dados de exemplo: Roteiro em São Paulo
  const attractions = [
    { name: 'Aeroporto GRU', lat: -23.4356, lng: -46.4731, type: 'airport' },
    { name: 'MASP', lat: -23.5614, lng: -46.6558, type: 'culture' },
    { name: 'Ibirapuera', lat: -23.5875, lng: -46.6577, type: 'nature' },
    { name: 'Liberdade', lat: -23.5589, lng: -46.6328, type: 'food' },
  ];

  // Configurar rota animada
  const routeControls = useAnimatedRoute('trip-route', {
    segments: [
      {
        points: [attractions[0], attractions[1]],
        transportType: 'car',
        color: 0xef4444,
        duration: 4000,
      },
      {
        points: [attractions[1], attractions[2]],
        transportType: 'walk',
        color: 0x8b5cf6,
        duration: 3000,
      },
      {
        points: [attractions[2], attractions[3]],
        transportType: 'bus',
        color: 0xf59e0b,
        duration: 3500,
      },
    ],
    autoPlay: false,
    loop: true,
    onSegmentStart: (index) => {
      console.log(`Iniciou segmento ${index + 1}`);
      setSelectedAttractionIndex(index);
    },
    onSegmentEnd: (index) => {
      console.log(`Completou segmento ${index + 1}`);
    },
    onRouteComplete: () => {
      console.log('Rota completa!');
    },
  });

  // Adicionar marcadores quando carregar
  useEffect(() => {
    if (!isLoaded || !manager) return;

    const markers: Marker3D[] = [];
    const halos: (Halo3D | WaveHalo3D)[] = [];

    attractions.forEach((attraction, index) => {
      // Criar marcador 3D
      const marker = new Marker3D({
        type: index === 0 ? 'flag' : index === attractions.length - 1 ? 'sphere' : 'pin',
        color: getAttractionColor(attraction.type),
        scale: 1,
        pulseEffect: true,
        floatEffect: true,
        rotateEffect: index % 2 === 0,
        label: (index + 1).toString(),
      });

      // Posicionar marcador
      const position = manager.overlay.latLngAltitudeToVector3({
        lat: attraction.lat,
        lng: attraction.lng,
        altitude: 0,
      });
      marker.group.position.copy(position);
      manager.scene.add(marker.group);
      markers.push(marker);

      // Criar halo
      const halo = index === selectedAttractionIndex
        ? new WaveHalo3D({
            color: getAttractionColor(attraction.type),
            radius: 50,
            pulseSpeed: 0.003,
            rotationSpeed: 0.005,
            opacity: 0.7,
          })
        : new Halo3D({
            color: getAttractionColor(attraction.type),
            radius: 40,
            pulseSpeed: 0.002,
            rotationSpeed: 0.003,
            opacity: 0.5,
          });

      halo.group.position.copy(position);
      manager.scene.add(halo.group);
      halos.push(halo);
    });

    // Callback de animação para marcadores e halos
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
  }, [isLoaded, manager, selectedAttractionIndex]);

  return (
    <>
      {/* Controles da Rota */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
        {/* Barra de Progresso */}
        <div className="bg-white/90 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-text-main">
              Segmento {routeControls.currentSegment + 1} de{' '}
              {attractions.length - 1}
            </span>
            <span className="text-xs text-text-muted">
              {Math.round(routeControls.progress * 100)}%
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${routeControls.progress * 100}%` }}
            />
          </div>

          {/* Segmentos */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {attractions.slice(0, -1).map((attraction, index) => (
              <button
                key={index}
                onClick={() => routeControls.jumpToSegment(index)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  index === routeControls.currentSegment
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                }`}
              >
                {attraction.name} → {attractions[index + 1].name}
              </button>
            ))}
          </div>
        </div>

        {/* Botões de Controle */}
        <div className="flex gap-2">
          <button
            onClick={routeControls.isPlaying ? routeControls.pause : routeControls.play}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              {routeControls.isPlaying ? 'pause' : 'play_arrow'}
            </span>
            {routeControls.isPlaying ? 'Pausar Tour' : 'Iniciar Tour'}
          </button>

          <button
            onClick={routeControls.reset}
            className="px-4 py-3 bg-white text-text-main rounded-xl font-bold text-sm shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
            Reiniciar
          </button>

          {/* Velocidade */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-lg">
            <span className="text-xs font-bold text-text-muted">Velocidade:</span>
            <select
              onChange={(e) => routeControls.setSpeed(Number(e.target.value))}
              className="text-xs font-bold bg-transparent border-none focus:outline-none"
              defaultValue="1"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Atrações */}
      <div className="absolute top-4 left-4 bg-white/90 rounded-xl p-4 shadow-lg max-w-xs">
        <h3 className="text-sm font-bold text-text-main mb-3">
          📍 Roteiro de Viagem
        </h3>
        <div className="space-y-2">
          {attractions.map((attraction, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                index === selectedAttractionIndex
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-gray-50'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: `#${getAttractionColor(attraction.type)
                    .toString(16)
                    .padStart(6, '0')}`,
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-text-main">
                  {attraction.name}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  {attraction.type}
                </p>
              </div>
              {index === selectedAttractionIndex && (
                <span className="material-symbols-outlined text-primary text-sm">
                  location_on
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda de Tipos */}
      <div className="absolute top-4 right-4 bg-white/90 rounded-xl p-3 shadow-lg">
        <h4 className="text-xs font-bold text-text-main mb-2">Legendas</h4>
        <div className="space-y-1">
          {['airport', 'culture', 'nature', 'food'].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: `#${getAttractionColor(type)
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
 * Componente principal do exemplo avançado
 */
const AdvancedWebGLExample: React.FC = () => {
  return (
    <div className="w-full h-[700px] rounded-2xl overflow-hidden relative">
      <WebGLMapProvider
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID || 'YOUR_MAP_ID'}
        center={{ lat: -23.5505, lng: -46.6333 }} // São Paulo
        zoom={12}
        tilt={60}
        heading={0}
        onMapLoad={(map, manager) => {
          console.log('Mapa WebGL Avançado carregado!', { map, manager });
        }}
      >
        <AnimatedTripContent />
      </WebGLMapProvider>
    </div>
  );
};

/**
 * Helper: Retorna cor baseada no tipo de atração
 */
function getAttractionColor(type: string): number {
  const colors: Record<string, number> = {
    airport: 0x3b82f6, // Azul
    culture: 0x8b5cf6, // Roxo
    nature: 0x22c55e, // Verde
    food: 0xf97316, // Laranja
    shopping: 0xec4899, // Rosa
    nightlife: 0x6366f1, // Índigo
    default: 0xef4444, // Vermelho
  };

  return colors[type] || colors.default;
}

export default AdvancedWebGLExample;
