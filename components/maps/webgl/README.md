# WebGL Overlay Infrastructure

Infraestrutura base para renderização 3D no Google Maps usando Three.js e WebGL Overlay View.

## 📁 Estrutura

```
webgl/
├── WebGLOverlayManager.ts    # Gerenciador central do overlay
├── WebGLMapProvider.tsx       # Context provider React
├── WebGLMapExample.tsx        # Componente de exemplo
├── index.ts                   # Exportações principais
├── hooks/
│   └── useWebGLMap.ts        # Hook principal
├── objects/                   # Componentes 3D (futura fase 2)
└── loaders/                   # Carregadores de modelos (futura fase 2)
```

## 🚀 Instalação

As dependências já foram instaladas:

```bash
npm install three @types/three @googlemaps/three
```

## ⚙️ Configuração

### 1. Map ID do Google Cloud

Você precisa criar um Map ID no Google Cloud Console com suporte a Vector/WebGL:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para **APIs & Services > Maps Management**
3. Clique em **Create Map ID**
4. Selecione **Vector** como tipo
5. Configure o estilo (pode usar o padrão)
6. Copie o Map ID gerado

### 2. Variável de Ambiente

Adicione ao arquivo `.env.local`:

```env
VITE_GOOGLE_MAP_ID=your_map_id_here
```

## 📖 Uso Básico

### Exemplo Completo

```tsx
import React from 'react';
import { WebGLMapProvider, useWebGLMap } from './components/maps/webgl';

const MyMapContent = () => {
  const { addMarker3D, addRoute3D, flyTo } = useWebGLMap();

  useEffect(() => {
    // Adicionar marcador
    addMarker3D('marker1', { lat: 35.6586, lng: 139.7454 }, {
      color: 0xff6b6b,
      animated: true
    });

    // Adicionar rota
    addRoute3D('route1', [
      { lat: 35.6586, lng: 139.7454 },
      { lat: 35.6762, lng: 139.6503 }
    ]);
  }, []);

  return (
    <button onClick={() => flyTo({ lat: 35.6586, lng: 139.7454 })}>
      Ir para Tokyo
    </button>
  );
};

const App = () => (
  <WebGLMapProvider
    mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
    center={{ lat: 35.6586, lng: 139.7454 }}
    zoom={15}
    tilt={60}
  >
    <MyMapContent />
  </WebGLMapProvider>
);
```

## 🎨 API Reference

### WebGLMapProvider

Componente Provider que inicializa o mapa e o overlay.

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `mapId` | `string` | **required** | Map ID do Google Cloud |
| `center` | `LatLngLiteral` | `{lat:0, lng:0}` | Centro inicial |
| `zoom` | `number` | `15` | Zoom inicial |
| `tilt` | `number` | `60` | Inclinação da câmera |
| `heading` | `number` | `0` | Rotação da câmera |
| `onMapLoad` | `function` | - | Callback ao carregar |

### useWebGLMap Hook

Hook para interagir com o mapa e overlay.

**Retorna:**

```typescript
{
  map: google.maps.Map | null;
  manager: WebGLOverlayManager | null;
  isLoaded: boolean;
  error: Error | null;

  // Métodos
  addMarker3D(id, position, options?): string | null;
  addRoute3D(id, points, options?): string | null;
  addHalo(id, position, options?): string | null;
  removeObject(id): void;
  flyTo(position, options?): void;
  rotateCamera(degrees?, duration?): void;
  clearAll(): void;
}
```

### addMarker3D

Adiciona um marcador 3D animado.

```typescript
addMarker3D(
  id: string,
  position: { lat: number; lng: number },
  options?: {
    color?: number;      // Cor hex (ex: 0xff6b6b)
    height?: number;     // Altura em metros
    animated?: boolean;  // Animação de flutuação
    scale?: number;      // Escala (1 = padrão)
  }
)
```

### addRoute3D

Adiciona uma rota 3D elevada entre pontos.

```typescript
addRoute3D(
  id: string,
  points: Array<{ lat: number; lng: number }>,
  options?: {
    color?: number;      // Cor hex
    altitude?: number;   // Altitude em metros
    width?: number;      // Largura do tubo
    opacity?: number;    // Opacidade (0-1)
  }
)
```

### addHalo

Adiciona um efeito de halo pulsante.

```typescript
addHalo(
  id: string,
  position: { lat: number; lng: number },
  options?: {
    color?: number;       // Cor hex
    radius?: number;      // Raio em metros
    pulseSpeed?: number;  // Velocidade do pulso
  }
)
```

### flyTo

Anima a câmera para uma posição.

```typescript
flyTo(
  position: { lat: number; lng: number },
  options?: {
    zoom?: number;
    tilt?: number;
    heading?: number;
    duration?: number;  // ms
  }
)
```

### rotateCamera

Rotaciona a câmera ao redor do ponto atual.

```typescript
rotateCamera(
  degrees?: number,    // Default: 360
  duration?: number    // Default: 5000ms
)
```

## 🎯 WebGLOverlayManager

Classe de baixo nível para controle direto do overlay.

```typescript
const manager = new WebGLOverlayManager(map);

// Adicionar objeto Three.js customizado
const mesh = new THREE.Mesh(geometry, material);
manager.addObject('id', mesh, { lat: 0, lng: 0 }, altitude);

// Callback de animação
manager.onAnimate((time) => {
  mesh.rotation.y += 0.01;
});

// Remover objeto
manager.removeObject('id');

// Limpar tudo
manager.clear();

// Destruir
manager.destroy();
```

## 🎨 Cores Comuns

```typescript
const COLORS = {
  red: 0xff6b6b,
  blue: 0x3b82f6,
  green: 0x22c55e,
  purple: 0x8b5cf6,
  orange: 0xf97316,
  pink: 0xec4899,
  gold: 0xffd700,
  indigo: 0x6366f1,
};
```

## 🐛 Troubleshooting

### Erro: "Map ID não válido"

- Verifique se o Map ID está correto no `.env.local`
- Confirme que o Map ID tem suporte a **Vector** habilitado
- Verifique se a API está habilitada e o billing ativo

### Erro: "Manager not ready"

- O hook está sendo chamado antes do mapa carregar
- Use `isLoaded` para verificar:

```tsx
const { isLoaded, addMarker3D } = useWebGLMap();

useEffect(() => {
  if (!isLoaded) return;
  addMarker3D(...);
}, [isLoaded]);
```

### Objetos 3D não aparecem

- Verifique se o `mapId` tem suporte a 3D/tilt
- Confirme que `tilt` está configurado (recomendado: 60)
- Verifique a altitude dos objetos

### Performance ruim

- Limite o número de objetos 3D (recomendado: < 100)
- Use geometrias simples
- Evite texturas grandes
- Considere usar instâncias para objetos repetidos

## 📊 Próximas Fases

- **Fase 2**: Componentes 3D avançados (Marker3D, Route3D, Vehicle3D)
- **Fase 3**: Integração com componentes existentes do app
- **Fase 4**: Tour automático e animações complexas

## 📝 Notas

- Requer Google Maps API Key com billing ativo
- Funciona apenas em navegadores que suportam WebGL
- Performance otimizada para até 100 objetos 3D simultâneos
