import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useWebGLMap } from './useWebGLMap';
import { Route3D, Route3DOptions } from '../objects/Route3D';
import { Vehicle3D, Vehicle3DOptions, VehicleType } from '../objects/Vehicle3D';

export interface AnimatedRouteSegment {
  points: google.maps.LatLngLiteral[];
  transportType: VehicleType;
  color?: number;
  duration?: number; // ms para percorrer este segmento
}

export interface AnimatedRouteOptions {
  segments: AnimatedRouteSegment[];
  autoPlay?: boolean;
  loop?: boolean;
  onSegmentStart?: (segmentIndex: number) => void;
  onSegmentEnd?: (segmentIndex: number) => void;
  onRouteComplete?: () => void;
}

export interface AnimatedRouteControls {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  jumpToSegment: (index: number) => void;
  isPlaying: boolean;
  progress: number; // 0-1
  currentSegment: number;
}

/**
 * Hook para criar rotas animadas com veículos
 */
export function useAnimatedRoute(
  routeId: string,
  options: AnimatedRouteOptions
): AnimatedRouteControls {
  const { manager, isLoaded } = useWebGLMap();

  const [isPlaying, setIsPlaying] = useState(options.autoPlay || false);
  const [progress, setProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);

  const routesRef = useRef<Route3D[]>([]);
  const vehiclesRef = useRef<Vehicle3D[]>([]);
  const speedRef = useRef(1);
  const progressRef = useRef(0);
  const segmentProgressRef = useRef(0);

  /**
   * Inicializa rotas e veículos
   */
  useEffect(() => {
    if (!isLoaded || !manager) return;

    const routes: Route3D[] = [];
    const vehicles: Vehicle3D[] = [];

    // Criar cada segmento
    options.segments.forEach((segment, index) => {
      // Converter pontos geográficos para Vector3
      const points = segment.points.map((p) =>
        manager.overlay.latLngAltitudeToVector3({
          lat: p.lat,
          lng: p.lng,
          altitude: 30,
        })
      );

      // Criar rota
      const routeOptions: Route3DOptions = {
        points,
        color: segment.color || getColorForTransport(segment.transportType),
        width: 3,
        opacity: 0.7,
        style: 'animated',
        segments: 100,
        animationSpeed: 0.001,
      };

      const route = new Route3D(routeOptions);
      routes.push(route);
      manager.scene.add(route.group);

      // Criar veículo
      const vehicleOptions: Vehicle3DOptions = {
        type: segment.transportType,
        color: segment.color || getColorForTransport(segment.transportType),
        scale: getScaleForTransport(segment.transportType),
        showTrail: true,
        trailColor: segment.color || getColorForTransport(segment.transportType),
      };

      const vehicle = new Vehicle3D(vehicleOptions);
      vehicles.push(vehicle);
      manager.scene.add(vehicle.group);

      // Posicionar veículo no início (invisível até começar)
      vehicle.group.visible = index === 0;
      if (index === 0) {
        const startPos = route.getPointAt(0);
        vehicle.setPosition(startPos);
      }
    });

    routesRef.current = routes;
    vehiclesRef.current = vehicles;

    // Callback de animação
    const animationCallback = (deltaTime: number) => {
      if (!isPlaying) return;

      const currentRoute = routes[currentSegment];
      const currentVehicle = vehicles[currentSegment];
      const segment = options.segments[currentSegment];

      if (!currentRoute || !currentVehicle) return;

      // Calcular velocidade baseada na duração do segmento
      const duration = segment.duration || 5000; // ms
      const speed = (1000 / duration) * speedRef.current;

      // Atualizar progresso do segmento
      segmentProgressRef.current += deltaTime * speed;

      if (segmentProgressRef.current >= 1) {
        // Segmento completado
        segmentProgressRef.current = 1;
        currentVehicle.group.visible = false;

        if (options.onSegmentEnd) {
          options.onSegmentEnd(currentSegment);
        }

        // Próximo segmento
        if (currentSegment < options.segments.length - 1) {
          setCurrentSegment((prev) => prev + 1);
          segmentProgressRef.current = 0;

          if (options.onSegmentStart) {
            options.onSegmentStart(currentSegment + 1);
          }
        } else {
          // Rota completa
          if (options.loop) {
            setCurrentSegment(0);
            segmentProgressRef.current = 0;
            vehiclesRef.current.forEach((v) => v.clearTrail());

            if (options.onSegmentStart) {
              options.onSegmentStart(0);
            }
          } else {
            setIsPlaying(false);
            if (options.onRouteComplete) {
              options.onRouteComplete();
            }
          }
        }
      }

      // Atualizar posição do veículo
      const position = currentRoute.getPointAt(segmentProgressRef.current);
      const tangent = currentRoute.getTangentAt(segmentProgressRef.current);

      currentVehicle.setPosition(position);
      currentVehicle.lookAt(tangent);
      currentVehicle.update(deltaTime);

      // Atualizar rota
      currentRoute.update(deltaTime);

      // Atualizar progresso global
      const totalSegments = options.segments.length;
      const globalProgress =
        (currentSegment + segmentProgressRef.current) / totalSegments;
      progressRef.current = globalProgress;
      setProgress(globalProgress);
    };

    manager.onAnimate(animationCallback);

    // Cleanup
    return () => {
      routes.forEach((route) => {
        manager.scene.remove(route.group);
        route.dispose();
      });

      vehicles.forEach((vehicle) => {
        manager.scene.remove(vehicle.group);
        vehicle.dispose();
      });

      manager.removeAnimateCallback(animationCallback);
    };
  }, [isLoaded, manager, options.segments, currentSegment]);

  /**
   * Atualiza visibilidade dos veículos quando muda o segmento
   */
  useEffect(() => {
    vehiclesRef.current.forEach((vehicle, index) => {
      vehicle.group.visible = index === currentSegment && isPlaying;

      if (index === currentSegment && isPlaying) {
        const route = routesRef.current[index];
        if (route) {
          const startPos = route.getPointAt(segmentProgressRef.current);
          vehicle.setPosition(startPos);
        }
      }
    });
  }, [currentSegment, isPlaying]);

  /**
   * Play
   */
  const play = useCallback(() => {
    setIsPlaying(true);

    if (currentSegment === 0 && options.onSegmentStart) {
      options.onSegmentStart(0);
    }
  }, [currentSegment, options]);

  /**
   * Pause
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * Reset
   */
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentSegment(0);
    setProgress(0);
    segmentProgressRef.current = 0;
    progressRef.current = 0;

    // Limpar trilhas
    vehiclesRef.current.forEach((vehicle) => {
      vehicle.clearTrail();
      vehicle.group.visible = false;
    });

    // Reposicionar primeiro veículo
    if (vehiclesRef.current[0] && routesRef.current[0]) {
      const startPos = routesRef.current[0].getPointAt(0);
      vehiclesRef.current[0].setPosition(startPos);
    }
  }, []);

  /**
   * Set Speed
   */
  const setSpeed = useCallback((speed: number) => {
    speedRef.current = Math.max(0.1, Math.min(5, speed)); // Limitar entre 0.1x e 5x
  }, []);

  /**
   * Jump to Segment
   */
  const jumpToSegment = useCallback(
    (index: number) => {
      if (index >= 0 && index < options.segments.length) {
        setCurrentSegment(index);
        segmentProgressRef.current = 0;

        // Limpar trilhas
        vehiclesRef.current.forEach((vehicle) => vehicle.clearTrail());

        // Reposicionar veículo
        if (vehiclesRef.current[index] && routesRef.current[index]) {
          const startPos = routesRef.current[index].getPointAt(0);
          vehiclesRef.current[index].setPosition(startPos);
        }

        if (options.onSegmentStart) {
          options.onSegmentStart(index);
        }
      }
    },
    [options]
  );

  return {
    play,
    pause,
    reset,
    setSpeed,
    jumpToSegment,
    isPlaying,
    progress,
    currentSegment,
  };
}

/**
 * Helper: Cor padrão por tipo de transporte
 */
function getColorForTransport(type: VehicleType): number {
  const colors: Record<VehicleType, number> = {
    flight: 0x3b82f6, // Azul
    car: 0xef4444, // Vermelho
    train: 0x22c55e, // Verde
    boat: 0x06b6d4, // Ciano
    bus: 0xf59e0b, // Laranja
    walk: 0x8b5cf6, // Roxo
    custom: 0x6366f1, // Índigo
  };

  return colors[type] || 0x6366f1;
}

/**
 * Helper: Escala padrão por tipo de transporte
 */
function getScaleForTransport(type: VehicleType): number {
  const scales: Record<VehicleType, number> = {
    flight: 2,
    car: 1.5,
    train: 2.5,
    boat: 1.8,
    bus: 2,
    walk: 1,
    custom: 1,
  };

  return scales[type] || 1;
}
