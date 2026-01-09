import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock Google Maps
(window as any).google = {
  maps: {
    places: {
      PlacesService: vi.fn().mockImplementation(() => ({
        getDetails: vi.fn((request, callback) => {
          callback({
            name: 'Test Place',
            address_components: [{ types: ['country'], long_name: 'Brazil' }],
            photos: [{ getUrl: () => 'https://example.com/photo.jpg' }]
          }, 'OK');
        }),
      })),
      PlacesServiceStatus: { OK: 'OK' },
      AutocompleteService: vi.fn().mockImplementation(() => ({
        getPlacePredictions: vi.fn(),
      })),
    },
    Geocoder: vi.fn(),
    LatLng: vi.fn(),
    Map: vi.fn(),
    Marker: vi.fn(),
  },
};

// Suppress console errors during tests (optional)
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') ||
      args[0].includes('Error:') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalError.apply(console, args);
};
