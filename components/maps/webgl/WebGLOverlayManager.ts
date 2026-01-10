import * as THREE from 'three';
// @ts-ignore - @googlemaps/three tem problemas com exports no package.json
import { ThreeJSOverlayView } from '@googlemaps/three';

export interface WebGLObject {
  id: string;
  mesh: THREE.Object3D;
  latLng: google.maps.LatLngLiteral;
  altitude: number;
}

export class WebGLOverlayManager {
  public overlay: ThreeJSOverlayView;
  public scene: THREE.Scene;
  private objects: Map<string, WebGLObject> = new Map();
  private animationCallbacks: Array<(time: number) => void> = [];
  private map: google.maps.Map;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.scene = new THREE.Scene();

    // Configurar iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Criar overlay usando @googlemaps/three
    this.overlay = new ThreeJSOverlayView({
      map,
      scene: this.scene,
      anchor: { lat: 0, lng: 0, altitude: 0 },
      THREE,
    });

    // Configurar loop de animação
    this.overlay.onDraw = ({ time }) => {
      this.animationCallbacks.forEach(cb => cb(time));
      this.overlay.requestRedraw();
    };
  }

  /**
   * Adiciona um objeto 3D ao mapa
   */
  addObject(
    id: string,
    mesh: THREE.Object3D,
    latLng: google.maps.LatLngLiteral,
    altitude: number = 0
  ): void {
    // Posicionar o objeto no mundo usando coordenadas geográficas
    const position = this.overlay.latLngAltitudeToVector3(
      { ...latLng, altitude }
    );
    mesh.position.copy(position);

    this.scene.add(mesh);
    this.objects.set(id, { id, mesh, latLng, altitude });
    this.overlay.requestRedraw();
  }

  /**
   * Remove um objeto 3D do mapa
   */
  removeObject(id: string): void {
    const obj = this.objects.get(id);
    if (obj) {
      this.scene.remove(obj.mesh);
      this.objects.delete(id);
      this.overlay.requestRedraw();
    }
  }

  /**
   * Atualiza a posição de um objeto
   */
  updateObjectPosition(
    id: string,
    latLng: google.maps.LatLngLiteral,
    altitude?: number
  ): void {
    const obj = this.objects.get(id);
    if (obj) {
      const newAltitude = altitude ?? obj.altitude;
      const position = this.overlay.latLngAltitudeToVector3(
        { ...latLng, altitude: newAltitude }
      );
      obj.mesh.position.copy(position);
      obj.latLng = latLng;
      obj.altitude = newAltitude;
      this.overlay.requestRedraw();
    }
  }

  /**
   * Registra callback de animação
   */
  onAnimate(callback: (time: number) => void): void {
    this.animationCallbacks.push(callback);
  }

  /**
   * Remove callback de animação
   */
  removeAnimateCallback(callback: (time: number) => void): void {
    const index = this.animationCallbacks.indexOf(callback);
    if (index > -1) {
      this.animationCallbacks.splice(index, 1);
    }
  }

  /**
   * Obtém um objeto pelo ID
   */
  getObject(id: string): WebGLObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Obtém todos os objetos
   */
  getAllObjects(): Map<string, WebGLObject> {
    return this.objects;
  }

  /**
   * Remove todos os objetos
   */
  clear(): void {
    this.objects.forEach(obj => {
      this.scene.remove(obj.mesh);
    });
    this.objects.clear();
    this.overlay.requestRedraw();
  }

  /**
   * Destrói o manager e libera recursos
   */
  destroy(): void {
    this.clear();
    this.animationCallbacks = [];
    this.overlay.setMap(null);
  }

  /**
   * Anima a câmera para uma posição
   */
  flyTo(
    position: google.maps.LatLngLiteral,
    options?: {
      zoom?: number;
      tilt?: number;
      heading?: number;
      duration?: number;
    }
  ): void {
    const { zoom = 17, tilt = 60, heading = 0, duration = 1000 } = options || {};

    // Animar suavemente
    this.map.panTo(position);

    // Aplicar zoom e tilt
    setTimeout(() => {
      this.map.setZoom(zoom);
      if (this.map.setTilt) this.map.setTilt(tilt);
      if (this.map.setHeading) this.map.setHeading(heading);
    }, duration / 2);
  }

  /**
   * Rotaciona a câmera ao redor do ponto atual
   */
  rotateCamera(degrees: number = 360, duration: number = 5000): void {
    const currentHeading = this.map.getHeading() || 0;
    const steps = 60;
    const stepDuration = duration / steps;
    const stepAngle = degrees / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(interval);
        return;
      }

      const newHeading = currentHeading + (stepAngle * currentStep);
      if (this.map.setHeading) {
        this.map.setHeading(newHeading);
      }
      currentStep++;
    }, stepDuration);
  }
}
