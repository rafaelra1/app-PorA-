import * as THREE from 'three';
import { loadModel } from '../loaders/GLTFModelLoader';

export type MarkerType = 'pin' | 'flag' | 'sphere' | 'custom';

export interface Marker3DOptions {
  type: MarkerType;
  color: number;
  scale: number;
  modelUrl?: string; // URL do modelo GLTF (para type='custom')
  pulseEffect?: boolean;
  floatEffect?: boolean;
  rotateEffect?: boolean;
  label?: string;
  emissiveIntensity?: number;
}

/**
 * Classe para criar marcadores 3D customizados
 */
export class Marker3D {
  public group: THREE.Group;
  private mixer?: THREE.AnimationMixer;
  private animations: {
    pulse?: boolean;
    float?: boolean;
    rotate?: boolean;
  };
  private animationState = {
    pulseScale: 1,
    pulseDirection: 1,
    floatOffset: 0,
    rotationSpeed: 0.01,
  };

  constructor(options: Marker3DOptions) {
    this.group = new THREE.Group();
    this.animations = {
      pulse: options.pulseEffect,
      float: options.floatEffect,
      rotate: options.rotateEffect,
    };

    this.initialize(options);
  }

  /**
   * Inicializa o marcador
   */
  private async initialize(options: Marker3DOptions): Promise<void> {
    if (options.type === 'custom' && options.modelUrl) {
      await this.loadCustomModel(options);
    } else {
      this.createDefaultMarker(options);
    }

    // Adicionar label se fornecido
    if (options.label) {
      this.addLabel(options.label, options.color);
    }
  }

  /**
   * Carrega modelo GLTF customizado
   */
  private async loadCustomModel(options: Marker3DOptions): Promise<void> {
    try {
      const model = await loadModel(options.modelUrl!, {
        scale: options.scale,
        castShadow: true,
        receiveShadow: true,
      });

      this.group.add(model);

      // Configurar mixer se houver animações
      if (model.userData.mixer) {
        this.mixer = model.userData.mixer;
      }
    } catch (error) {
      console.error('Erro ao carregar modelo customizado:', error);
      // Fallback para marcador padrão
      this.createDefaultMarker(options);
    }
  }

  /**
   * Cria marcadores padrão (pin, flag, sphere)
   */
  private createDefaultMarker(options: Marker3DOptions): void {
    const { type, color, scale, emissiveIntensity = 0.4 } = options;

    switch (type) {
      case 'pin':
        this.createPinMarker(color, scale, emissiveIntensity);
        break;
      case 'flag':
        this.createFlagMarker(color, scale, emissiveIntensity);
        break;
      case 'sphere':
        this.createSphereMarker(color, scale, emissiveIntensity);
        break;
      default:
        this.createPinMarker(color, scale, emissiveIntensity);
    }
  }

  /**
   * Cria marcador tipo pin (padrão)
   */
  private createPinMarker(
    color: number,
    scale: number,
    emissiveIntensity: number
  ): void {
    // Base esférica
    const sphereGeometry = new THREE.SphereGeometry(8 * scale, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 40 * scale;
    sphere.castShadow = true;

    // Haste
    const stemGeometry = new THREE.CylinderGeometry(
      2 * scale,
      2 * scale,
      35 * scale,
      8
    );
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 17.5 * scale;
    stem.castShadow = true;

    // Halo de luz no solo
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

    this.group.add(sphere, stem, halo);
  }

  /**
   * Cria marcador tipo bandeira
   */
  private createFlagMarker(
    color: number,
    scale: number,
    emissiveIntensity: number
  ): void {
    // Poste
    const poleGeometry = new THREE.CylinderGeometry(
      1 * scale,
      1 * scale,
      50 * scale,
      8
    );
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 25 * scale;
    pole.castShadow = true;

    // Bandeira
    const flagGeometry = new THREE.PlaneGeometry(20 * scale, 12 * scale);
    const flagMaterial = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(10 * scale, 45 * scale, 0);
    flag.castShadow = true;

    // Base
    const baseGeometry = new THREE.SphereGeometry(5 * scale, 8, 8);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 2.5 * scale;

    this.group.add(pole, flag, base);
  }

  /**
   * Cria marcador tipo esfera
   */
  private createSphereMarker(
    color: number,
    scale: number,
    emissiveIntensity: number
  ): void {
    // Esfera principal
    const sphereGeometry = new THREE.SphereGeometry(15 * scale, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 20 * scale;
    sphere.castShadow = true;

    // Anel orbital
    const ringGeometry = new THREE.TorusGeometry(20 * scale, 2 * scale, 8, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: emissiveIntensity * 0.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = 20 * scale;
    ring.rotation.x = Math.PI / 4;
    ring.castShadow = true;

    this.group.add(sphere, ring);
  }

  /**
   * Adiciona texto label ao marcador
   */
  private addLabel(text: string, color: number): void {
    // Criar canvas para texto
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;

    // Desenhar background
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar texto
    context.font = 'bold 32px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Criar sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(20, 10, 1);
    sprite.position.y = 60;

    this.group.add(sprite);
  }

  /**
   * Atualiza animações do marcador
   */
  update(deltaTime: number): void {
    // Atualizar mixer de animações GLTF
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Efeito de flutuação
    if (this.animations.float) {
      this.animationState.floatOffset += deltaTime * 2;
      this.group.position.y += Math.sin(this.animationState.floatOffset) * 0.3;
    }

    // Efeito de rotação
    if (this.animations.rotate) {
      this.group.rotation.y += this.animationState.rotationSpeed;
    }

    // Efeito de pulso
    if (this.animations.pulse) {
      this.animationState.pulseScale += 0.01 * this.animationState.pulseDirection;

      if (this.animationState.pulseScale > 1.15) {
        this.animationState.pulseDirection = -1;
      } else if (this.animationState.pulseScale < 0.85) {
        this.animationState.pulseDirection = 1;
      }

      this.group.scale.setScalar(this.animationState.pulseScale);
    }
  }

  /**
   * Define a velocidade de rotação
   */
  setRotationSpeed(speed: number): void {
    this.animationState.rotationSpeed = speed;
  }

  /**
   * Ativa/desativa efeito de pulso
   */
  setPulseEffect(enabled: boolean): void {
    this.animations.pulse = enabled;
    if (!enabled) {
      this.group.scale.setScalar(1);
    }
  }

  /**
   * Ativa/desativa efeito de flutuação
   */
  setFloatEffect(enabled: boolean): void {
    this.animations.float = enabled;
  }

  /**
   * Ativa/desativa efeito de rotação
   */
  setRotateEffect(enabled: boolean): void {
    this.animations.rotate = enabled;
  }

  /**
   * Destroy e cleanup
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
  }
}
