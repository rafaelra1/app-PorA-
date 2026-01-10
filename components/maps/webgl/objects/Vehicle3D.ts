import * as THREE from 'three';
import { loadModel } from '../loaders/GLTFModelLoader';

export type VehicleType = 'flight' | 'car' | 'train' | 'boat' | 'bus' | 'walk' | 'custom';

export interface Vehicle3DOptions {
  type: VehicleType;
  color?: number;
  scale?: number;
  modelUrl?: string; // Para type='custom'
  animationSpeed?: number;
  showTrail?: boolean;
  trailColor?: number;
}

/**
 * Classe para criar veículos 3D animados
 */
export class Vehicle3D {
  public group: THREE.Group;
  private vehicleMesh: THREE.Group | THREE.Mesh;
  private type: VehicleType;
  private trail?: THREE.Line;
  private trailPoints: THREE.Vector3[] = [];
  private maxTrailLength = 50;
  private animationTime = 0;
  private mixer?: THREE.AnimationMixer;

  constructor(options: Vehicle3DOptions) {
    const {
      type,
      color = 0x3b82f6,
      scale = 1,
      modelUrl,
      showTrail = false,
      trailColor = 0x3b82f6,
    } = options;

    this.group = new THREE.Group();
    this.type = type;

    this.initialize(type, color, scale, modelUrl);

    if (showTrail) {
      this.createTrail(trailColor);
    }
  }

  /**
   * Inicializa o veículo
   */
  private async initialize(
    type: VehicleType,
    color: number,
    scale: number,
    modelUrl?: string
  ): Promise<void> {
    if (type === 'custom' && modelUrl) {
      await this.loadCustomVehicle(modelUrl, scale);
    } else {
      this.vehicleMesh = this.createDefaultVehicle(type, color, scale);
      this.group.add(this.vehicleMesh);
    }
  }

  /**
   * Carrega modelo customizado
   */
  private async loadCustomVehicle(url: string, scale: number): Promise<void> {
    try {
      const model = await loadModel(url, { scale });
      this.vehicleMesh = model;
      this.group.add(model);

      if (model.userData.mixer) {
        this.mixer = model.userData.mixer;
      }
    } catch (error) {
      console.error('Erro ao carregar veículo customizado:', error);
      // Fallback
      this.vehicleMesh = this.createDefaultVehicle('flight', 0x3b82f6, scale);
      this.group.add(this.vehicleMesh);
    }
  }

  /**
   * Cria modelo padrão de veículo
   */
  private createDefaultVehicle(
    type: VehicleType,
    color: number,
    scale: number
  ): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (type) {
      case 'flight':
        geometry = this.createAirplaneGeometry(scale);
        material = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.3,
          flatShading: true,
        });
        break;

      case 'car':
        geometry = this.createCarGeometry(scale);
        material = new THREE.MeshPhongMaterial({
          color,
          shininess: 100,
        });
        break;

      case 'train':
        geometry = this.createTrainGeometry(scale);
        material = new THREE.MeshPhongMaterial({
          color,
          shininess: 50,
        });
        break;

      case 'boat':
        geometry = this.createBoatGeometry(scale);
        material = new THREE.MeshPhongMaterial({
          color,
          shininess: 80,
        });
        break;

      case 'bus':
        geometry = this.createBusGeometry(scale);
        material = new THREE.MeshPhongMaterial({
          color,
          shininess: 60,
        });
        break;

      case 'walk':
        geometry = new THREE.SphereGeometry(5 * scale, 16, 16);
        material = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.4,
        });
        break;

      default:
        geometry = new THREE.ConeGeometry(5 * scale, 15 * scale, 4);
        material = new THREE.MeshPhongMaterial({ color });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Cria geometria de avião
   */
  private createAirplaneGeometry(scale: number): THREE.BufferGeometry {
    const group = new THREE.Group();

    // Fuselagem
    const bodyGeometry = new THREE.CylinderGeometry(
      3 * scale,
      3 * scale,
      20 * scale,
      8
    );
    const body = new THREE.Mesh(bodyGeometry);
    body.rotation.z = Math.PI / 2;

    // Asas
    const wingGeometry = new THREE.BoxGeometry(
      30 * scale,
      2 * scale,
      8 * scale
    );
    const wings = new THREE.Mesh(wingGeometry);

    // Cauda
    const tailGeometry = new THREE.ConeGeometry(
      5 * scale,
      10 * scale,
      4
    );
    const tail = new THREE.Mesh(tailGeometry);
    tail.position.set(0, 5 * scale, -10 * scale);
    tail.rotation.x = -Math.PI / 2;

    group.add(body, wings, tail);

    // Combinar geometrias
    const finalGeometry = new THREE.BufferGeometry();
    const merged = new THREE.Geometry();
    group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.updateMatrix();
        merged.merge(new THREE.Geometry().fromBufferGeometry(child.geometry), child.matrix);
      }
    });

    return new THREE.BufferGeometry().fromGeometry(merged);
  }

  /**
   * Cria geometria de carro
   */
  private createCarGeometry(scale: number): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(
      15 * scale,
      8 * scale,
      10 * scale
    );
    return geometry;
  }

  /**
   * Cria geometria de trem
   */
  private createTrainGeometry(scale: number): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(
      25 * scale,
      10 * scale,
      12 * scale
    );
    return geometry;
  }

  /**
   * Cria geometria de barco
   */
  private createBoatGeometry(scale: number): THREE.BufferGeometry {
    const geometry = new THREE.ConeGeometry(
      8 * scale,
      20 * scale,
      4,
      1,
      false
    );
    return geometry;
  }

  /**
   * Cria geometria de ônibus
   */
  private createBusGeometry(scale: number): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(
      20 * scale,
      12 * scale,
      10 * scale
    );
    return geometry;
  }

  /**
   * Cria trilha visual
   */
  private createTrail(color: number): void {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });

    this.trail = new THREE.Line(geometry, material);
    this.group.add(this.trail);
  }

  /**
   * Atualiza posição do veículo e trilha
   */
  setPosition(position: THREE.Vector3): void {
    this.group.position.copy(position);

    // Atualizar trilha
    if (this.trail) {
      this.trailPoints.push(position.clone());

      // Limitar tamanho da trilha
      if (this.trailPoints.length > this.maxTrailLength) {
        this.trailPoints.shift();
      }

      // Atualizar geometria da trilha
      this.trail.geometry.setFromPoints(this.trailPoints);
    }
  }

  /**
   * Orienta o veículo na direção do movimento
   */
  lookAt(direction: THREE.Vector3): void {
    const lookAtPoint = this.group.position.clone().add(direction);
    this.group.lookAt(lookAtPoint);

    // Ajustes específicos por tipo
    switch (this.type) {
      case 'flight':
        // Avião aponta para frente
        this.vehicleMesh.rotation.y = Math.PI / 2;
        break;
      case 'car':
      case 'bus':
        // Carros apontam para frente
        this.vehicleMesh.rotation.y = Math.PI / 2;
        break;
    }
  }

  /**
   * Atualiza animações do veículo
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    // Atualizar mixer de animações GLTF
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Animações específicas por tipo
    switch (this.type) {
      case 'flight':
        // Leve oscilação nas asas
        this.vehicleMesh.rotation.z = Math.sin(this.animationTime * 0.003) * 0.05;
        break;

      case 'boat':
        // Balanço na água
        this.vehicleMesh.rotation.x = Math.sin(this.animationTime * 0.002) * 0.1;
        this.vehicleMesh.rotation.z = Math.cos(this.animationTime * 0.0015) * 0.08;
        break;

      case 'walk':
        // Pequeno salto
        this.vehicleMesh.position.y = Math.abs(Math.sin(this.animationTime * 0.005)) * 3;
        break;
    }

    // Fade da trilha
    if (this.trail && this.trail.material instanceof THREE.LineBasicMaterial) {
      this.trail.material.opacity = 0.5 + Math.sin(this.animationTime * 0.002) * 0.2;
    }
  }

  /**
   * Define cor do veículo
   */
  setColor(color: number): void {
    if (this.vehicleMesh instanceof THREE.Mesh) {
      const material = this.vehicleMesh.material as THREE.MeshPhongMaterial;
      material.color.setHex(color);
    }
  }

  /**
   * Mostra/esconde trilha
   */
  setTrailVisible(visible: boolean): void {
    if (this.trail) {
      this.trail.visible = visible;
    }
  }

  /**
   * Limpa trilha
   */
  clearTrail(): void {
    this.trailPoints = [];
    if (this.trail) {
      this.trail.geometry.setFromPoints([]);
    }
  }

  /**
   * Cleanup e dispose
   */
  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    if (this.trail) {
      this.trail.geometry.dispose();
      if (this.trail.material instanceof THREE.Material) {
        this.trail.material.dispose();
      }
    }
  }
}
