import * as THREE from 'three';

export type RouteStyle = 'solid' | 'dashed' | 'gradient' | 'animated';

export interface Route3DOptions {
  points: THREE.Vector3[];
  color: number;
  width?: number;
  opacity?: number;
  style?: RouteStyle;
  altitude?: number;
  segments?: number;
  gradientColors?: number[];
  animationSpeed?: number;
}

/**
 * Classe para criar rotas 3D elevadas com diferentes estilos
 */
export class Route3D {
  public group: THREE.Group;
  public curve: THREE.CatmullRomCurve3;
  private routeMesh: THREE.Mesh;
  private animationProgress = 0;
  private animationSpeed: number;
  private style: RouteStyle;

  constructor(options: Route3DOptions) {
    const {
      points,
      color,
      width = 3,
      opacity = 0.8,
      style = 'solid',
      segments = 100,
      gradientColors,
      animationSpeed = 0.001,
    } = options;

    this.group = new THREE.Group();
    this.style = style;
    this.animationSpeed = animationSpeed;

    // Criar curva suave
    this.curve = new THREE.CatmullRomCurve3(points);

    // Criar mesh da rota baseado no estilo
    this.routeMesh = this.createRouteMesh(
      color,
      width,
      opacity,
      segments,
      gradientColors
    );
    this.group.add(this.routeMesh);

    // Adicionar marcadores nos pontos principais
    this.addWaypoints(points, color);
  }

  /**
   * Cria o mesh da rota baseado no estilo
   */
  private createRouteMesh(
    color: number,
    width: number,
    opacity: number,
    segments: number,
    gradientColors?: number[]
  ): THREE.Mesh {
    switch (this.style) {
      case 'dashed':
        return this.createDashedRoute(color, width, opacity, segments);
      case 'gradient':
        return this.createGradientRoute(
          gradientColors || [color],
          width,
          opacity,
          segments
        );
      case 'animated':
        return this.createAnimatedRoute(color, width, opacity, segments);
      default:
        return this.createSolidRoute(color, width, opacity, segments);
    }
  }

  /**
   * Cria rota sólida
   */
  private createSolidRoute(
    color: number,
    width: number,
    opacity: number,
    segments: number
  ): THREE.Mesh {
    const geometry = new THREE.TubeGeometry(
      this.curve,
      segments,
      width,
      8,
      false
    );

    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
      emissive: color,
      emissiveIntensity: 0.2,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Cria rota tracejada
   */
  private createDashedRoute(
    color: number,
    width: number,
    opacity: number,
    segments: number
  ): THREE.Mesh {
    const points = this.curve.getPoints(segments);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
      color,
      linewidth: width,
      scale: 1,
      dashSize: 10,
      gapSize: 5,
      transparent: true,
      opacity,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line as any; // Type casting para compatibilidade
  }

  /**
   * Cria rota com gradiente de cores
   */
  private createGradientRoute(
    colors: number[],
    width: number,
    opacity: number,
    segments: number
  ): THREE.Mesh {
    const geometry = new THREE.TubeGeometry(
      this.curve,
      segments,
      width,
      8,
      false
    );

    // Criar array de cores para vértices
    const vertexColors: number[] = [];
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
      const t = i / positionAttribute.count;
      const colorIndex = Math.floor(t * (colors.length - 1));
      const localT = (t * (colors.length - 1)) - colorIndex;

      const color1 = new THREE.Color(colors[colorIndex]);
      const color2 = new THREE.Color(colors[Math.min(colorIndex + 1, colors.length - 1)]);
      const interpolatedColor = color1.clone().lerp(color2, localT);

      vertexColors.push(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b);
    }

    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(vertexColors, 3)
    );

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Cria rota animada com efeito de fluxo
   */
  private createAnimatedRoute(
    color: number,
    width: number,
    opacity: number,
    segments: number
  ): THREE.Mesh {
    const geometry = new THREE.TubeGeometry(
      this.curve,
      segments,
      width,
      8,
      false
    );

    // Shader customizado para animação
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        opacity: { value: opacity },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;

        void main() {
          float flow = fract(vUv.x + time);
          float intensity = smoothstep(0.0, 0.3, flow) * smoothstep(1.0, 0.7, flow);
          vec3 finalColor = color + vec3(intensity * 0.5);
          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Adiciona marcadores nos waypoints
   */
  private addWaypoints(points: THREE.Vector3[], color: number): void {
    points.forEach((point, index) => {
      // Pular primeiro e último ponto (serão marcadores de início/fim)
      if (index === 0 || index === points.length - 1) return;

      const sphereGeometry = new THREE.SphereGeometry(5, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(point);
      sphere.castShadow = true;

      this.group.add(sphere);
    });
  }

  /**
   * Atualiza animações da rota
   */
  update(deltaTime: number): void {
    this.animationProgress += this.animationSpeed;

    // Atualizar shader de animação se for rota animada
    if (this.style === 'animated' && this.routeMesh.material instanceof THREE.ShaderMaterial) {
      this.routeMesh.material.uniforms.time.value = this.animationProgress;
    }
  }

  /**
   * Obtém ponto na rota baseado em progresso (0-1)
   */
  getPointAt(t: number): THREE.Vector3 {
    return this.curve.getPoint(Math.max(0, Math.min(1, t)));
  }

  /**
   * Obtém tangente na rota baseado em progresso (0-1)
   */
  getTangentAt(t: number): THREE.Vector3 {
    return this.curve.getTangent(Math.max(0, Math.min(1, t)));
  }

  /**
   * Obtém comprimento total da rota
   */
  getLength(): number {
    return this.curve.getLength();
  }

  /**
   * Define velocidade de animação
   */
  setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  /**
   * Define cor da rota
   */
  setColor(color: number): void {
    if (this.routeMesh.material instanceof THREE.MeshPhongMaterial) {
      this.routeMesh.material.color.setHex(color);
      this.routeMesh.material.emissive.setHex(color);
    } else if (this.routeMesh.material instanceof THREE.ShaderMaterial) {
      this.routeMesh.material.uniforms.color.value.setHex(color);
    }
  }

  /**
   * Define opacidade da rota
   */
  setOpacity(opacity: number): void {
    if (this.routeMesh.material instanceof THREE.MeshPhongMaterial) {
      this.routeMesh.material.opacity = opacity;
    } else if (this.routeMesh.material instanceof THREE.ShaderMaterial) {
      this.routeMesh.material.uniforms.opacity.value = opacity;
    }
  }

  /**
   * Cleanup e dispose
   */
  dispose(): void {
    this.routeMesh.geometry.dispose();
    if (this.routeMesh.material instanceof THREE.Material) {
      this.routeMesh.material.dispose();
    }

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
