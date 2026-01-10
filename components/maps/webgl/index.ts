// Exportar componentes principais
export { WebGLMapProvider, WebGLMapContext } from './WebGLMapProvider';
export { WebGLOverlayManager } from './WebGLOverlayManager';

// Exportar hooks
export { useWebGLMap } from './hooks/useWebGLMap';
export { useAnimatedRoute } from './hooks/useAnimatedRoute';

// Exportar objetos 3D
export { Marker3D } from './objects/Marker3D';
export { Halo3D, WaveHalo3D } from './objects/Halo3D';
export { Route3D } from './objects/Route3D';
export { Vehicle3D } from './objects/Vehicle3D';

// Exportar loaders
export { GLTFModelLoader, loadModel, getGlobalLoader } from './loaders/GLTFModelLoader';

// Exportar integrações
export {
  ImmersiveAttractionMap,
  ItineraryMap3D,
  AutoTourController,
  IntegrationExample,
} from './integrations';

// Tipos úteis
export type { WebGLObject } from './WebGLOverlayManager';
export type { Marker3DOptions, MarkerType } from './objects/Marker3D';
export type { Halo3DOptions } from './objects/Halo3D';
export type { Route3DOptions, RouteStyle } from './objects/Route3D';
export type { Vehicle3DOptions, VehicleType } from './objects/Vehicle3D';
export type { ModelLoadOptions } from './loaders/GLTFModelLoader';
export type { AnimatedRouteSegment, AnimatedRouteOptions, AnimatedRouteControls } from './hooks/useAnimatedRoute';
export type { ItineraryStop, TourStop, AutoTourControllerProps } from './integrations';
