import * as THREE from 'three';

export interface Halo3DOptions {
  color: number;
  radius: number;
  ringCount?: number;
  pulseSpeed?: number;
  rotationSpeed?: number;
  opacity?: number;
  height?: number;
}

/**
 * Classe para criar halos/destaques 3D pulsantes
 */
export class Halo3D {
  public group: THREE.Group;
  private rings: THREE.Mesh[] = [];
  private pulseSpeed: number;
  private rotationSpeed: number;
  private animationTime = 0;

  constructor(options: Halo3DOptions) {
    const {
      color,
      radius,
      ringCount = 3,
      pulseSpeed = 0.003,
      rotationSpeed = 0.005,
      opacity = 0.6,
      height = 5,
    } = options;

    this.group = new THREE.Group();
    this.pulseSpeed = pulseSpeed;
    this.rotationSpeed = rotationSpeed;

    this.createRings(color, radius, ringCount, opacity, height);
  }

  /**
   * Cria anéis concêntricos do halo
   */
  private createRings(
    color: number,
    radius: number,
    ringCount: number,
    opacity: number,
    height: number
  ): void {
    for (let i = 0; i < ringCount; i++) {
      const innerRadius = radius * (1 + i * 0.3);
      const outerRadius = radius * (1.2 + i * 0.3);

      // Anel principal
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: opacity - i * 0.15,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = height;

      this.rings.push(ring);
      this.group.add(ring);

      // Adicionar partículas ao redor do anel
      if (i === 0) {
        this.addParticles(color, innerRadius + (outerRadius - innerRadius) / 2, height);
      }
    }
  }

  /**
   * Adiciona partículas ao redor do halo
   */
  private addParticles(color: number, radius: number, height: number): void {
    const particleCount = 32;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height + (Math.random() - 0.5) * 5;

      positions.push(x, y, z);
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      color,
      size: 3,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.group.add(particles);
  }

  /**
   * Atualiza animações do halo
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    // Pulso dos anéis
    const pulseScale = 1 + Math.sin(this.animationTime * this.pulseSpeed) * 0.2;
    this.rings.forEach((ring, index) => {
      const phaseOffset = index * 0.3;
      const scale = 1 + Math.sin((this.animationTime + phaseOffset) * this.pulseSpeed) * 0.15;
      ring.scale.set(scale, scale, 1);
    });

    // Rotação
    this.group.rotation.y += this.rotationSpeed;

    // Atualizar opacidade pulsante
    this.rings.forEach((ring, index) => {
      const material = ring.material as THREE.MeshBasicMaterial;
      const baseOpacity = 0.6 - index * 0.15;
      material.opacity = baseOpacity + Math.sin(this.animationTime * this.pulseSpeed * 2) * 0.2;
    });
  }

  /**
   * Define a velocidade de pulso
   */
  setPulseSpeed(speed: number): void {
    this.pulseSpeed = speed;
  }

  /**
   * Define a velocidade de rotação
   */
  setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  /**
   * Define a cor do halo
   */
  setColor(color: number): void {
    this.rings.forEach((ring) => {
      const material = ring.material as THREE.MeshBasicMaterial;
      material.color.setHex(color);
    });
  }

  /**
   * Define a opacidade base
   */
  setOpacity(opacity: number): void {
    this.rings.forEach((ring, index) => {
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = opacity - index * 0.15;
    });
  }

  /**
   * Cleanup e dispose
   */
  dispose(): void {
    this.rings.forEach((ring) => {
      ring.geometry.dispose();
      if (ring.material instanceof THREE.Material) {
        ring.material.dispose();
      }
    });
    this.rings = [];
  }
}

/**
 * Variante de halo com efeito de onda expansiva
 */
export class WaveHalo3D extends Halo3D {
  private waves: THREE.Mesh[] = [];
  private waveInterval = 2000; // ms entre ondas
  private lastWaveTime = 0;

  constructor(options: Halo3DOptions) {
    super(options);
    this.createWaveSystem(options.color, options.radius, options.opacity || 0.6);
  }

  /**
   * Cria sistema de ondas expansivas
   */
  private createWaveSystem(color: number, radius: number, opacity: number): void {
    // Criar pool de ondas
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.RingGeometry(radius * 0.5, radius * 0.6, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const wave = new THREE.Mesh(ringGeometry, ringMaterial);
      wave.rotation.x = -Math.PI / 2;
      wave.position.y = 2;
      wave.userData = { active: false, progress: 0 };

      this.waves.push(wave);
      this.group.add(wave);
    }
  }

  /**
   * Atualiza ondas expansivas
   */
  update(deltaTime: number): void {
    super.update(deltaTime);

    const currentTime = Date.now();

    // Criar nova onda se passou o intervalo
    if (currentTime - this.lastWaveTime > this.waveInterval) {
      this.triggerWave();
      this.lastWaveTime = currentTime;
    }

    // Atualizar ondas ativas
    this.waves.forEach((wave) => {
      if (wave.userData.active) {
        wave.userData.progress += deltaTime * 0.001;

        if (wave.userData.progress >= 1) {
          // Onda completou, resetar
          wave.userData.active = false;
          wave.userData.progress = 0;
          const material = wave.material as THREE.MeshBasicMaterial;
          material.opacity = 0;
          wave.scale.set(1, 1, 1);
        } else {
          // Expandir e fade out
          const scale = 1 + wave.userData.progress * 2;
          wave.scale.set(scale, scale, 1);

          const material = wave.material as THREE.MeshBasicMaterial;
          material.opacity = 0.8 * (1 - wave.userData.progress);
        }
      }
    });
  }

  /**
   * Dispara uma nova onda
   */
  private triggerWave(): void {
    // Encontrar onda inativa
    const inactiveWave = this.waves.find((w) => !w.userData.active);
    if (inactiveWave) {
      inactiveWave.userData.active = true;
      inactiveWave.userData.progress = 0;
    }
  }

  /**
   * Cleanup específico de ondas
   */
  dispose(): void {
    super.dispose();
    this.waves.forEach((wave) => {
      wave.geometry.dispose();
      if (wave.material instanceof THREE.Material) {
        wave.material.dispose();
      }
    });
    this.waves = [];
  }
}
