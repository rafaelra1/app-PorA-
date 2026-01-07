# Custom Hooks Documentation

This directory contains reusable custom React hooks for the travel app.

## Available Hooks

### `useModal`
Manages modal state with open, close, and toggle functionality.

```typescript
import { useModal } from '../hooks';

function MyComponent() {
  const modal = useModal();
  
  return (
    <>
      <button onClick={modal.open}>Open Modal</button>
      <Modal isOpen={modal.isOpen} onClose={modal.close}>
        Content
      </Modal>
    </>
  );
}
```

### `useDebounce`
Debounces a value to optimize search inputs and prevent excessive API calls.

```typescript
import { useDebounce } from '../hooks';

function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  useEffect(() => {
    // API call with debouncedSearch
    fetchResults(debouncedSearch);
  }, [debouncedSearch]);
  
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

### `useLocalStorage`
Provides type-safe localStorage with automatic JSON serialization.

```typescript
import { useLocalStorage } from '../hooks';

function SettingsComponent() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  );
}
```

### `useImageGeneration`
Manages AI image generation with loading and error states.

```typescript
import { useImageGeneration } from '../hooks';

function ImageGenerator() {
  const { generateImage, isGenerating, error } = useImageGeneration();
  
  const handleGenerate = async () => {
    const imageUrl = await generateImage('A beautiful sunset', {
      aspectRatio: '16:9',
      imageSize: '2K'
    });
    
    if (imageUrl) {
      // Use the generated image
    }
  };
  
  return (
    <button onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? 'Generating...' : 'Generate Image'}
    </button>
  );
}
```

### `useCityGuide`
Handles fetching and managing city guide data from the AI service.

```typescript
import { useCityGuide } from '../hooks';

function CityGuideComponent({ city }) {
  const { 
    cityGuide, 
    isLoadingGuide, 
    fetchCityGuide 
  } = useCityGuide();
  
  useEffect(() => {
    fetchCityGuide(city);
  }, [city]);
  
  if (isLoadingGuide) return <Loading />;
  if (!cityGuide) return null;
  
  return <div>{/* Render city guide */}</div>;
}
```

## Benefits

- **Code Reusability**: Shared logic across multiple components
- **Separation of Concerns**: Business logic separated from UI components
- **Type Safety**: Full TypeScript support with proper typing
- **Testability**: Hooks can be tested independently
- **Maintainability**: Centralized logic makes updates easier

## Import Methods

You can import hooks individually or all at once:

```typescript
// Individual imports
import { useModal } from '../hooks/useModal';
import { useDebounce } from '../hooks/useDebounce';

// Barrel import (recommended)
import { useModal, useDebounce, useLocalStorage } from '../hooks';
```
