import { useContext, useCallback } from 'react';
import { WebGLMapContext } from '../WebGLMapProvider';
import * as THREE from 'three';

export function useWebGLMap() {
  const context = useContext(WebGLMapContext);

  if (!context) {
    throw new Error('useWebGLMap must be used within WebGLMapProvider');
  }

  const { manager, map, isLoaded, error } = context;

  /**
   * Adiciona um marcador 3D no mapa
   */
  const addMarker3D = useCallback(
    (
      id: string,
      position: google.maps.LatLngLiteral,
      options?: {
        color?: number;
        height?: number;
        animated?: boolean;
        scale?: number;
      }
    ) => {
      if (!manager) {
        console.warn('Manager not ready');
        return null;
      }

      const {
        color = 0xff6b6b,
        height = 50,
        animated = true,
        scale = 1,
      } = options || {};

      // Criar grupo para o marcador
      const markerGroup = new THREE.Group();

      // Base do pin (esfera)
      const sphereGeometry = new THREE.SphereGeometry(8 * scale, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        shininess: 100,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.y = 40 * scale;

      // Haste do pin
      const stemGeometry = new THREE.CylinderGeometry(
        2 * scale,
        2 * scale,
        35 * scale,
        8
      );
      const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 17.5 * scale;

      // Halo de luz
      const haloGeometry = new THREE.RingGeometry(
        12 * scale,
        20 * scale,
        32
      );
      const haloMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 1;

      markerGroup.add(sphere, stem, halo);

      // Adicionar ao manager
      manager.addObject(id, markerGroup, position, 0);

      // Animação de flutuação
      if (animated) {
        manager.onAnimate((time) => {
          const obj = manager.getObject(id);
          if (obj) {
            obj.mesh.position.y += Math.sin(time * 0.002) * 0.5;
            obj.mesh.rotation.y += 0.01;
          }
        });
      }

      return id;
    },
    [manager]
  );

  /**
   * Adiciona uma rota 3D elevada entre pontos
   */
  const addRoute3D = useCallback(
    (
      id: string,
      points: google.maps.LatLngLiteral[],
      options?: {
        color?: number;
        altitude?: number;
        width?: number;
        opacity?: number;
      }
    ) => {
      if (!manager) {
        console.warn('Manager not ready');
        return null;
      }

      const {
        color = 0x6366f1,
        altitude = 30,
        width = 3,
        opacity = 0.8,
      } = options || {};

      // Converter pontos geográficos para Vector3
      const curvePoints = points.map((p) => {
        return manager.overlay.latLngAltitudeToVector3({
          ...p,
          altitude,
        });
      });

      // Criar curva suave
      const curve = new THREE.CatmullRomCurve3(curvePoints);

      // Criar geometria tubular
      const geometry = new THREE.TubeGeometry(curve, 100, width, 8, false);

      // Material com gradiente
      const colors: number[] = [];
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        const t = i / geometry.attributes.position.count;
        // Gradiente de azul para roxo
        colors.push(
          0.4 + t * 0.4, // R
          0.4 + t * 0.2, // G
          0.9 // B
        );
      }
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
      );

      const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: true,
        opacity,
      });

      const tube = new THREE.Mesh(geometry, material);

      // Adicionar diretamente à cena (não precisa de posição geográfica)
      manager.scene.add(tube);

      return id;
    },
    [manager]
  );

  /**
   * Adiciona um halo/destaque 3D em uma localização
   */
  const addHalo = useCallback(
    (
      id: string,
      position: google.maps.LatLngLiteral,
      options?: {
        color?: number;
        radius?: number;
        pulseSpeed?: number;
      }
    ) => {
      if (!manager) {
        console.warn('Manager not ready');
        return null;
      }

      const { color = 0xffd700, radius = 50, pulseSpeed = 0.003 } = options || {};

      // Criar múltiplos anéis para efeito de onda
      const haloGroup = new THREE.Group();

      for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.RingGeometry(
          radius * (1 + i * 0.3),
          radius * (1.2 + i * 0.3),
          64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.6 - i * 0.2,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        haloGroup.add(ring);
      }

      manager.addObject(id, haloGroup, position, 5);

      // Animação de pulso
      manager.onAnimate((time) => {
        const obj = manager.getObject(id);
        if (obj) {
          const scale = 1 + Math.sin(time * pulseSpeed) * 0.2;
          obj.mesh.scale.set(scale, 1, scale);
          obj.mesh.rotation.y += 0.005;
        }
      });

      return id;
    },
    [manager]
  );

  /**
   * Remove um objeto do mapa
   */
  const removeObject = useCallback(
    (id: string) => {
      if (!manager) return;
      manager.removeObject(id);
    },
    [manager]
  );

  /**
   * Anima a câmera para uma localização
   */
  const flyTo = useCallback(
    (
      position: google.maps.LatLngLiteral,
      options?: {
        zoom?: number;
        tilt?: number;
        heading?: number;
        duration?: number;
      }
    ) => {
      if (!manager) return;
      manager.flyTo(position, options);
    },
    [manager]
  );

  /**
   * Rotaciona a câmera 360 graus
   */
  const rotateCamera = useCallback(
    (degrees: number = 360, duration: number = 5000) => {
      if (!manager) return;
      manager.rotateCamera(degrees, duration);
    },
    [manager]
  );

  /**
   * Limpa todos os objetos 3D
   */
  const clearAll = useCallback(() => {
    if (!manager) return;
    manager.clear();
  }, [manager]);

  return {
    map,
    manager,
    isLoaded,
    error,
    // Métodos de manipulação
    addMarker3D,
    addRoute3D,
    addHalo,
    removeObject,
    flyTo,
    rotateCamera,
    clearAll,
  };
}
