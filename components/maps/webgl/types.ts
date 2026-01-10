import * as THREE from 'three';
import { ReactNode } from 'react';

/**
 * Objeto 3D no mapa
 */
export interface WebGLObject {
  id: string;
  mesh: THREE.Object3D;
  latLng: google.maps.LatLngLiteral;
  altitude: number;
}

/**
 * Opções para marcador 3D
 */
export interface Marker3DOptions {
  color?: number;
  height?: number;
  animated?: boolean;
  scale?: number;
}

/**
 * Opções para rota 3D
 */
export interface Route3DOptions {
  color?: number;
  altitude?: number;
  width?: number;
  opacity?: number;
}

/**
 * Opções para halo
 */
export interface HaloOptions {
  color?: number;
  radius?: number;
  pulseSpeed?: number;
}

/**
 * Opções para flyTo
 */
export interface FlyToOptions {
  zoom?: number;
  tilt?: number;
  heading?: number;
  duration?: number;
}

/**
 * Callback de animação
 */
export type AnimationCallback = (time: number) => void;

/**
 * Props do WebGLMapProvider
 */
export interface WebGLMapProviderProps {
  children: ReactNode;
  mapId: string;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  tilt?: number;
  heading?: number;
  onMapLoad?: (map: google.maps.Map, manager: any) => void;
  mapContainerClassName?: string;
}

/**
 * Valor do contexto WebGLMap
 */
export interface WebGLMapContextValue {
  map: google.maps.Map | null;
  manager: any | null;
  isLoaded: boolean;
  error: Error | null;
}
