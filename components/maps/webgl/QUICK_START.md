# 🚀 Quick Start - WebGL Maps

## 1️⃣ Configurar Map ID (2 minutos)

### Google Cloud Console

1. Acesse: https://console.cloud.google.com/google/maps-apis/studio/maps
2. Clique em **"CREATE MAP ID"**
3. Preencha:
   - **Name:** "App Poraí WebGL Map"
   - **Type:** Selecione **"Vector"** ⚠️ (obrigatório para WebGL)
   - **Map style:** Pode usar o padrão
4. Clique em **"SAVE"**
5. Copie o **Map ID** gerado

### Adicionar ao .env.local

```bash
# Em: /app-PorA-/.env.local
VITE_GOOGLE_MAP_ID=SEU_MAP_ID_AQUI
```

## 2️⃣ Exemplo Mínimo (copie e cole)

```tsx
// Em qualquer componente do seu app
import React, { useEffect } from 'react';
import { WebGLMapProvider, useWebGLMap } from './components/maps/webgl';

// Componente interno
function MapContent() {
  const { addMarker3D, isLoaded } = useWebGLMap();

  useEffect(() => {
    if (!isLoaded) return;

    // Adicionar um marcador 3D
    addMarker3D(
      'meu-marcador',
      { lat: -23.5505, lng: -46.6333 }, // São Paulo
      { color: 0xff6b6b, animated: true }
    );
  }, [isLoaded]);

  return null;
}

// Componente principal
export default function MeuMapa() {
  return (
    <div className="w-full h-[600px]">
      <WebGLMapProvider
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
        center={{ lat: -23.5505, lng: -46.6333 }}
        zoom={15}
        tilt={60}
      >
        <MapContent />
      </WebGLMapProvider>
    </div>
  );
}
```

## 3️⃣ Testar

```bash
npm run dev
```

Navegue até o componente que você criou. Você verá:
- 🗺️ Mapa 3D do Google Maps
- 📍 Marcador 3D flutuando e girando
- 🎮 Controles de navegação

## 4️⃣ Adicionar Recursos (opcionais)

### Adicionar Rota 3D

```tsx
const { addRoute3D } = useWebGLMap();

addRoute3D('rota1', [
  { lat: -23.5505, lng: -46.6333 },
  { lat: -23.5629, lng: -46.6544 },
  { lat: -23.5489, lng: -46.6388 }
], {
  color: 0x6366f1,
  altitude: 30,
  width: 3
});
```

### Adicionar Halo Pulsante

```tsx
const { addHalo } = useWebGLMap();

addHalo('halo1', { lat: -23.5505, lng: -46.6333 }, {
  color: 0xffd700,
  radius: 50,
  pulseSpeed: 0.003
});
```

### Animar Câmera

```tsx
const { flyTo, rotateCamera } = useWebGLMap();

// Voar para uma localização
flyTo(
  { lat: -23.5505, lng: -46.6333 },
  { zoom: 18, tilt: 70, duration: 2000 }
);

// Rotacionar 360°
rotateCamera(360, 5000);
```

## 5️⃣ Exemplo Completo com Botões

```tsx
import React, { useEffect } from 'react';
import { WebGLMapProvider, useWebGLMap } from './components/maps/webgl';

function MapControls() {
  const {
    addMarker3D,
    addRoute3D,
    flyTo,
    rotateCamera,
    removeObject,
    isLoaded
  } = useWebGLMap();

  useEffect(() => {
    if (!isLoaded) return;

    // Adicionar marcadores em atrações de São Paulo
    const attractions = [
      { id: 'masp', lat: -23.5614, lng: -46.6558, name: 'MASP' },
      { id: 'ibirapuera', lat: -23.5875, lng: -46.6577, name: 'Ibirapuera' },
      { id: 'paulista', lat: -23.5612, lng: -46.6563, name: 'Av. Paulista' }
    ];

    attractions.forEach((attr, index) => {
      addMarker3D(attr.id, { lat: attr.lat, lng: attr.lng }, {
        color: [0xff6b6b, 0x6366f1, 0x22c55e][index],
        animated: true
      });
    });

    // Conectar com rota
    addRoute3D('tour-route', attractions.map(a => ({ lat: a.lat, lng: a.lng })));
  }, [isLoaded]);

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
      <button
        onClick={() => flyTo({ lat: -23.5614, lng: -46.6558 }, { zoom: 17 })}
        className="px-4 py-2 bg-primary text-white rounded-xl font-bold"
      >
        🎨 Ir para MASP
      </button>

      <button
        onClick={() => rotateCamera(360, 5000)}
        className="px-4 py-2 bg-white rounded-xl font-bold"
      >
        🌀 Girar 360°
      </button>

      <button
        onClick={() => removeObject('masp')}
        className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold"
      >
        ❌ Remover MASP
      </button>
    </div>
  );
}

export default function MapaTuristico() {
  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden">
      <WebGLMapProvider
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
        center={{ lat: -23.5614, lng: -46.6558 }}
        zoom={14}
        tilt={60}
        heading={45}
      >
        <MapControls />
      </WebGLMapProvider>
    </div>
  );
}
```

## 🎨 Cores Pré-definidas

```typescript
const CORES = {
  vermelho: 0xff6b6b,
  azul: 0x3b82f6,
  verde: 0x22c55e,
  roxo: 0x8b5cf6,
  laranja: 0xf97316,
  rosa: 0xec4899,
  dourado: 0xffd700,
  indigo: 0x6366f1,
};
```

## 📱 Integrar com Componentes Existentes

### AttractionMapModal.tsx (exemplo)

```tsx
import { WebGLMapProvider, useWebGLMap } from './components/maps/webgl';

const AttractionMapModal = ({ attractions }) => {
  return (
    <WebGLMapProvider
      mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
      center={attractions[0]?.coordinates}
      zoom={15}
      tilt={60}
    >
      <AttractionMarkers attractions={attractions} />
    </WebGLMapProvider>
  );
};

function AttractionMarkers({ attractions }) {
  const { addMarker3D, isLoaded } = useWebGLMap();

  useEffect(() => {
    if (!isLoaded) return;

    attractions.forEach(attraction => {
      addMarker3D(
        `attraction-${attraction.id}`,
        attraction.coordinates,
        { color: getCategoryColor(attraction.category) }
      );
    });
  }, [isLoaded, attractions]);

  return null;
}
```

## ⚠️ Problemas Comuns

### "Map ID não válido"
→ Certifique-se que selecionou **Vector** ao criar o Map ID

### "Objetos 3D não aparecem"
→ Verifique se `tilt` está configurado (mínimo 45, recomendado 60)

### "Hook error"
→ Certifique-se que `useWebGLMap()` está dentro de `<WebGLMapProvider>`

## 📚 Documentação Completa

- [README.md](./README.md) - Documentação completa da API
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Detalhes técnicos
- [WebGLMapExample.tsx](./WebGLMapExample.tsx) - Exemplo avançado

## 🆘 Precisa de Ajuda?

Consulte os arquivos de documentação ou veja o componente de exemplo completo em `WebGLMapExample.tsx`.

---

**Tempo estimado:** 5 minutos para ter seu primeiro mapa 3D funcionando! 🚀
