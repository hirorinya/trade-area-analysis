import '@testing-library/jest-dom';

// Mock environment variables
Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_MAPBOX_TOKEN: 'pk.test-token',
        VITE_OPENAI_API_KEY: 'sk-test-key',
        MODE: 'test'
      }
    }
  }
});

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    setLayoutProperty: jest.fn(),
    getSource: jest.fn(),
    getLayer: jest.fn(),
    fitBounds: jest.fn(),
    addControl: jest.fn()
  })),
  NavigationControl: jest.fn(),
  ScaleControl: jest.fn(),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    setPopup: jest.fn().mockReturnThis(),
    remove: jest.fn()
  })),
  Popup: jest.fn(() => ({
    setHTML: jest.fn().mockReturnThis(),
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis()
  })),
  LngLatBounds: jest.fn(() => ({
    extend: jest.fn()
  }))
}));

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn()
  },
  db: {}
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock fetch
global.fetch = jest.fn();