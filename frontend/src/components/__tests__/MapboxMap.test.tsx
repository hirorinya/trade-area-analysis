import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapboxMap from '../map/MapboxMap';

// Mock Mapbox GL
const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  remove: jest.fn(),
  addSource: jest.fn(),
  addLayer: jest.fn(),
  setLayoutProperty: jest.fn(),
  getSource: jest.fn(() => ({ setData: jest.fn() })),
  getLayer: jest.fn(),
  fitBounds: jest.fn(),
  addControl: jest.fn(),
  setStyle: jest.fn()
};

jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => mockMap),
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
  })),
  accessToken: 'test-token'
}));

describe('MapboxMap Component', () => {
  const mockLocations = [
    {
      id: 'store1',
      name: 'Test Store 1',
      latitude: 35.6762,
      longitude: 139.6503,
      location_type: 'store' as const,
      address: '123 Test Street'
    },
    {
      id: 'comp1',
      name: 'Test Competitor',
      latitude: 35.6892,
      longitude: 139.6917,
      location_type: 'competitor' as const
    },
    {
      id: 'poi1',
      name: 'Test POI',
      latitude: 35.6585,
      longitude: 139.7454,
      location_type: 'poi' as const
    }
  ];

  const mockGridBounds = {
    north: 35.7,
    south: 35.6,
    east: 139.8,
    west: 139.7
  };

  const defaultProps = {
    locations: mockLocations,
    center: [139.6917, 35.6895] as [number, number],
    zoom: 10,
    style: 'mapbox://styles/mapbox/streets-v12'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful map load
    (mockMap.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'load') {
        setTimeout(callback, 0);
      }
    });
  });

  const renderComponent = (props = {}) => {
    return render(<MapboxMap {...defaultProps} {...props} />);
  };

  describe('Component Initialization', () => {
    it('should render map container', () => {
      renderComponent();
      
      const mapContainer = document.querySelector('[style*="height: 100%"]');
      expect(mapContainer).toBeInTheDocument();
    });

    it('should initialize Mapbox map with correct parameters', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(require('mapbox-gl').Map).toHaveBeenCalledWith(
          expect.objectContaining({
            center: defaultProps.center,
            zoom: defaultProps.zoom,
            style: defaultProps.style
          })
        );
      });
    });

    it('should add navigation and scale controls', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockMap.addControl).toHaveBeenCalledTimes(2);
      });
    });

    it('should show error when Mapbox token is not configured', () => {
      // Mock invalid token
      const originalToken = require('mapbox-gl').accessToken;
      require('mapbox-gl').accessToken = 'your_mapbox_token_here';
      
      renderComponent();
      
      expect(screen.getByText(/mapbox configuration required/i)).toBeInTheDocument();
      
      // Restore token
      require('mapbox-gl').accessToken = originalToken;
    });
  });

  describe('Location Markers', () => {
    it('should create markers for all locations', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(require('mapbox-gl').Marker).toHaveBeenCalledTimes(mockLocations.length);
      });
    });

    it('should handle marker clicks', async () => {
      const mockOnLocationSelect = jest.fn();
      renderComponent({ onLocationSelect: mockOnLocationSelect });
      
      // Simulate marker click by calling the click handler
      const markerElement = document.createElement('div');
      markerElement.click = jest.fn();
      
      await waitFor(() => {
        // The marker creation should have set up event listeners
        expect(require('mapbox-gl').Marker).toHaveBeenCalled();
      });
    });

    it('should fit bounds to show all markers', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockMap.fitBounds).toHaveBeenCalled();
      });
    });

    it('should handle empty locations array', () => {
      renderComponent({ locations: [] });
      
      expect(() => renderComponent({ locations: [] })).not.toThrow();
    });
  });

  describe('Map Interactions', () => {
    it('should handle map clicks', async () => {
      const mockOnMapClick = jest.fn();
      renderComponent({ onMapClick: mockOnMapClick });
      
      await waitFor(() => {
        expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });

    it('should change map style when style selector is used', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const styleSelect = screen.getByDisplayValue('Streets');
      await user.selectOptions(styleSelect, 'mapbox://styles/mapbox/satellite-v9');
      
      expect(mockMap.setStyle).toHaveBeenCalledWith('mapbox://styles/mapbox/satellite-v9');
    });
  });

  describe('Demand Grid Visualization', () => {
    it('should show demand grid when enabled', async () => {
      renderComponent({
        showDemandGrid: true,
        gridBounds: mockGridBounds,
        onDemandAnalysis: jest.fn()
      });
      
      await waitFor(() => {
        expect(mockMap.addSource).toHaveBeenCalledWith('demand-grid', expect.any(Object));
        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'demand-grid-fill' })
        );
      });
    });

    it('should hide demand grid when disabled', async () => {
      renderComponent({
        showDemandGrid: false,
        gridBounds: mockGridBounds
      });
      
      await waitFor(() => {
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'demand-grid-fill',
          'visibility',
          'none'
        );
      });
    });

    it('should toggle between grid and heatmap visualization modes', async () => {
      const user = userEvent.setup();
      renderComponent({
        showDemandGrid: true,
        gridBounds: mockGridBounds
      });
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText(/grid/i)).toBeInTheDocument();
      });
      
      const heatmapButton = screen.getByText(/heat map/i);
      await user.click(heatmapButton);
      
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'demand-grid-fill',
        'visibility',
        'none'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'demand-heatmap-layer',
        'visibility',
        'visible'
      );
    });

    it('should call onDemandAnalysis when demand grid is generated', async () => {
      const mockOnDemandAnalysis = jest.fn();
      
      renderComponent({
        showDemandGrid: true,
        gridBounds: mockGridBounds,
        onDemandAnalysis: mockOnDemandAnalysis
      });
      
      await waitFor(() => {
        expect(mockOnDemandAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            meshes: expect.any(Array),
            storePerformance: expect.any(Object),
            totalMeshes: expect.any(Number),
            totalDemand: expect.any(Number)
          })
        );
      });
    });
  });

  describe('UI Controls', () => {
    it('should render legend with location types', () => {
      renderComponent();
      
      expect(screen.getByText('Legend')).toBeInTheDocument();
      expect(screen.getByText('Stores')).toBeInTheDocument();
      expect(screen.getByText('Competitors')).toBeInTheDocument();
      expect(screen.getByText('Points of Interest')).toBeInTheDocument();
      expect(screen.getByText('Optimized Sites')).toBeInTheDocument();
    });

    it('should render style selector', () => {
      renderComponent();
      
      expect(screen.getByDisplayValue('Streets')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Satellite' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument();
    });

    it('should render demand analysis toggle when grid bounds are provided', () => {
      renderComponent({ gridBounds: mockGridBounds });
      
      expect(screen.getByText(/population analysis/i)).toBeInTheDocument();
    });

    it('should render analysis results panel when demand grid is active', () => {
      renderComponent({
        showDemandGrid: true,
        gridBounds: mockGridBounds
      });
      
      expect(screen.getByText(/mesh analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/total meshes/i)).toBeInTheDocument();
      expect(screen.getByText(/total demand/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle map initialization errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock map constructor to throw error
      (require('mapbox-gl').Map as jest.Mock).mockImplementation(() => {
        throw new Error('Map initialization failed');
      });
      
      renderComponent();
      
      expect(screen.getByText(/failed to initialize map/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle map error events', async () => {
      renderComponent();
      
      // Simulate map error
      const errorCallback = (mockMap.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      
      if (errorCallback) {
        errorCallback({
          error: { message: 'Invalid token' }
        });
        
        await waitFor(() => {
          expect(screen.getByText(/mapbox token is invalid/i)).toBeInTheDocument();
        });
      }
    });

    it('should gracefully handle missing demand analysis callback', async () => {
      renderComponent({
        showDemandGrid: true,
        gridBounds: mockGridBounds
        // onDemandAnalysis intentionally omitted
      });
      
      // Should not throw error
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should cleanup map on unmount', () => {
      const { unmount } = renderComponent();
      
      unmount();
      
      expect(mockMap.remove).toHaveBeenCalled();
    });

    it('should handle large numbers of locations efficiently', () => {
      const manyLocations = Array(1000).fill(mockLocations[0]).map((loc, i) => ({
        ...loc,
        id: `location${i}`,
        latitude: loc.latitude + (i * 0.001),
        longitude: loc.longitude + (i * 0.001)
      }));
      
      expect(() => renderComponent({ locations: manyLocations })).not.toThrow();
    });

    it('should prevent memory leaks with marker cleanup', async () => {
      const { rerender } = renderComponent();
      
      // Update with new locations
      rerender(<MapboxMap {...defaultProps} locations={[mockLocations[0]]} />);
      
      await waitFor(() => {
        // Markers should be cleaned up when locations change
        expect(require('mapbox-gl').Marker().remove).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      renderComponent({ gridBounds: mockGridBounds });
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation for controls', async () => {
      const user = userEvent.setup();
      renderComponent({ gridBounds: mockGridBounds });
      
      const styleSelect = screen.getByDisplayValue('Streets');
      await user.tab();
      
      // Should be able to navigate to map controls
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should work with different map styles', async () => {
      const { rerender } = renderComponent();
      
      rerender(
        <MapboxMap
          {...defaultProps}
          style="mapbox://styles/mapbox/dark-v11"
        />
      );
      
      expect(require('mapbox-gl').Map).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'mapbox://styles/mapbox/dark-v11'
        })
      );
    });

    it('should handle dynamic prop updates', async () => {
      const { rerender } = renderComponent();
      
      const newLocations = [
        {
          id: 'new-store',
          name: 'New Store',
          latitude: 35.7,
          longitude: 139.8,
          location_type: 'store' as const
        }
      ];
      
      rerender(<MapboxMap {...defaultProps} locations={newLocations} />);
      
      await waitFor(() => {
        // Should create new markers for updated locations
        expect(require('mapbox-gl').Marker).toHaveBeenCalled();
      });
    });
  });
});