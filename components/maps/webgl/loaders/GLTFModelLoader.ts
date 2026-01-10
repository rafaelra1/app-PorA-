import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

/**
 * Cache de modelos GLTF carregados
 */
const modelCache = new Map<string, THREE.Group>();

/**
 * Opções de carregamento de modelo
 */
export interface ModelLoadOptions {
  scale?: number;
  rotation?: { x?: number; y?: number; z?: number };
  position?: { x?: number; y?: number; z?: number };
  useDraco?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Carregador de modelos GLTF com cache e suporte a Draco
 */
export class GLTFModelLoader {
  private loader: GLTFLoader;
  private dracoLoader?: DRACOLoader;

  constructor(dracoPath?: string) {
    this.loader = new GLTFLoader();

    // Configurar Draco loader para modelos comprimidos
    if (dracoPath) {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath(dracoPath);
      this.loader.setDRACOLoader(this.dracoLoader);
    }
  }

  /**
   * Carrega um modelo GLTF (com cache)
   */
  async load(
    url: string,
    options: ModelLoadOptions = {}
  ): Promise<THREE.Group> {
    // Verificar cache
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    if (modelCache.has(cacheKey)) {
      // Retornar clone do modelo em cache
      return modelCache.get(cacheKey)!.clone();
    }

    try {
      // Carregar modelo
      const gltf = await this.loader.loadAsync(url);
      const model = gltf.scene;

      // Aplicar transformações
      this.applyOptions(model, options);

      // Processar animações se existirem
      if (gltf.animations && gltf.animations.length > 0) {
        // Armazenar animações no userData para uso posterior
        model.userData.animations = gltf.animations;
        model.userData.mixer = new THREE.AnimationMixer(model);

        // Auto-play da primeira animação por padrão
        const action = model.userData.mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      // Adicionar ao cache
      modelCache.set(cacheKey, model);

      return model.clone();
    } catch (error) {
      console.error(`Erro ao carregar modelo GLTF: ${url}`, error);
      // Retornar um placeholder em caso de erro
      return this.createPlaceholder(options);
    }
  }

  /**
   * Aplica opções ao modelo
   */
  private applyOptions(model: THREE.Group, options: ModelLoadOptions): void {
    const {
      scale = 1,
      rotation = {},
      position = {},
      castShadow = true,
      receiveShadow = true,
    } = options;

    // Escala
    model.scale.setScalar(scale);

    // Rotação
    if (rotation.x !== undefined) model.rotation.x = rotation.x;
    if (rotation.y !== undefined) model.rotation.y = rotation.y;
    if (rotation.z !== undefined) model.rotation.z = rotation.z;

    // Posição
    if (position.x !== undefined) model.position.x = position.x;
    if (position.y !== undefined) model.position.y = position.y;
    if (position.z !== undefined) model.position.z = position.z;

    // Sombras
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
  }

  /**
   * Cria um placeholder simples quando o modelo falha ao carregar
   */
  private createPlaceholder(options: ModelLoadOptions): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    this.applyOptions(group, options);

    return group;
  }

  /**
   * Limpa o cache de modelos
   */
  static clearCache(): void {
    modelCache.clear();
  }

  /**
   * Remove um modelo específico do cache
   */
  static removeCached(url: string): void {
    for (const key of modelCache.keys()) {
      if (key.startsWith(url)) {
        modelCache.delete(key);
      }
    }
  }

  /**
   * Dispose do loader e recursos
   */
  dispose(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
  }
}

/**
 * Loader singleton global
 */
let globalLoader: GLTFModelLoader | null = null;

/**
 * Obtém o loader global (singleton)
 */
export function getGlobalLoader(): GLTFModelLoader {
  if (!globalLoader) {
    // Configurar caminho do Draco (CDN)
    globalLoader = new GLTFModelLoader(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'
    );
  }
  return globalLoader;
}

/**
 * Helper function para carregar modelo rapidamente
 */
export async function loadModel(
  url: string,
  options?: ModelLoadOptions
): Promise<THREE.Group> {
  const loader = getGlobalLoader();
  return loader.load(url, options);
}
