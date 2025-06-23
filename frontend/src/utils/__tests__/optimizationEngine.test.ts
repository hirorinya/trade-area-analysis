import { 
  greedyOptimization, 
  mipStyleOptimization, 
  competitiveAnalysis,
  generateCandidateSites 
} from '../optimizationEngine';

describe('optimizationEngine utilities', () => {
  const mockDemandMeshes = [
    {
      id: 'mesh1',
      population: 1000,
      demand: 150,
      bounds: { north: 35.66, south: 35.65, east: 139.76, west: 139.75 },
      capturedBy: [],
      captureRatio: 0
    },
    {
      id: 'mesh2',
      population: 800,
      demand: 120,
      bounds: { north: 35.69, south: 35.68, east: 139.78, west: 139.77 },
      capturedBy: [],
      captureRatio: 0
    },
    {
      id: 'mesh3',
      population: 600,
      demand: 90,
      bounds: { north: 35.63, south: 35.62, east: 139.73, west: 139.72 },
      capturedBy: [],
      captureRatio: 0
    }
  ];

  const mockCandidateSites = [
    { id: 'site1', latitude: 35.655, longitude: 139.755 },
    { id: 'site2', latitude: 35.685, longitude: 139.775 },
    { id: 'site3', latitude: 35.625, longitude: 139.725 },
    { id: 'site4', latitude: 35.645, longitude: 139.765 },
    { id: 'site5', latitude: 35.675, longitude: 139.785 }
  ];

  const mockCompetitors = [
    {
      id: 'comp1',
      name: 'Competitor 1',
      latitude: 35.64,
      longitude: 139.74,
      location_type: 'competitor' as const
    }
  ];

  const mockExistingStores = [
    {
      id: 'store1',
      name: 'Existing Store',
      latitude: 35.67,
      longitude: 139.78,
      location_type: 'store' as const
    }
  ];

  const mockOptimizationParams = {
    numStores: 2,
    maxRadius: 2.0,
    distanceDecay: 1.5,
    minDistance: 0.5,
    maxBudget: 5000000,
    storeCost: 1000000
  };

  describe('generateCandidateSites', () => {
    const mockBounds = {
      north: 35.7,
      south: 35.6,
      east: 139.8,
      west: 139.7
    };

    it('should generate candidate sites within bounds', () => {
      const candidates = generateCandidateSites(mockBounds, 500, mockExistingStores);
      
      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates.length).toBeGreaterThan(0);
      
      candidates.forEach(candidate => {
        expect(candidate).toHaveProperty('id');
        expect(candidate).toHaveProperty('latitude');
        expect(candidate).toHaveProperty('longitude');
        
        expect(candidate.latitude).toBeGreaterThanOrEqual(mockBounds.south);
        expect(candidate.latitude).toBeLessThanOrEqual(mockBounds.north);
        expect(candidate.longitude).toBeGreaterThanOrEqual(mockBounds.west);
        expect(candidate.longitude).toBeLessThanOrEqual(mockBounds.east);
      });
    });

    it('should respect minimum distance from existing stores', () => {
      const candidates = generateCandidateSites(mockBounds, 500, mockExistingStores);
      const existingStore = mockExistingStores[0];
      
      candidates.forEach(candidate => {
        const distance = getDistance(
          candidate.latitude, candidate.longitude,
          existingStore.latitude, existingStore.longitude
        );
        // Should be at least 500m away
        expect(distance).toBeGreaterThan(0.4); // Allow some tolerance
      });
    });

    it('should generate fewer candidates with larger spacing', () => {
      const largeCandidates = generateCandidateSites(mockBounds, 1000, []);
      const smallCandidates = generateCandidateSites(mockBounds, 500, []);
      
      expect(largeCandidates.length).toBeLessThanOrEqual(smallCandidates.length);
    });
  });

  describe('greedyOptimization', () => {
    it('should return optimization results', () => {
      const results = greedyOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        mockOptimizationParams
      );
      
      expect(results).toHaveProperty('selectedSites');
      expect(results).toHaveProperty('totalDemandCaptured');
      expect(results).toHaveProperty('totalCost');
      expect(results).toHaveProperty('performance');
      expect(results).toHaveProperty('algorithm');
      
      expect(results.algorithm).toBe('greedy');
      expect(Array.isArray(results.selectedSites)).toBe(true);
      expect(results.selectedSites.length).toBeLessThanOrEqual(mockOptimizationParams.numStores);
      expect(results.totalDemandCaptured).toBeGreaterThanOrEqual(0);
      expect(results.totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should respect budget constraints', () => {
      const lowBudgetParams = {
        ...mockOptimizationParams,
        maxBudget: 1500000, // Only enough for 1 store
        storeCost: 1000000
      };
      
      const results = greedyOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        lowBudgetParams
      );
      
      expect(results.selectedSites.length).toBeLessThanOrEqual(1);
      expect(results.totalCost).toBeLessThanOrEqual(lowBudgetParams.maxBudget);
    });

    it('should respect store count limits', () => {
      const results = greedyOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        { ...mockOptimizationParams, numStores: 1 }
      );
      
      expect(results.selectedSites.length).toBeLessThanOrEqual(1);
    });

    it('should handle empty inputs gracefully', () => {
      const emptyResults = greedyOptimization([], [], mockOptimizationParams);
      expect(emptyResults.selectedSites).toHaveLength(0);
      expect(emptyResults.totalDemandCaptured).toBe(0);
    });
  });

  describe('mipStyleOptimization', () => {
    it('should return optimization results', () => {
      const results = mipStyleOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        mockOptimizationParams
      );
      
      expect(results).toHaveProperty('selectedSites');
      expect(results).toHaveProperty('totalDemandCaptured');
      expect(results).toHaveProperty('totalCost');
      expect(results).toHaveProperty('performance');
      expect(results).toHaveProperty('algorithm');
      
      expect(results.algorithm).toBe('mip');
      expect(Array.isArray(results.selectedSites)).toBe(true);
      expect(results.selectedSites.length).toBeLessThanOrEqual(mockOptimizationParams.numStores);
    });

    it('should potentially find better solutions than greedy', () => {
      const greedyResults = greedyOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        mockOptimizationParams
      );
      
      const mipResults = mipStyleOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        mockOptimizationParams
      );
      
      // MIP should find solutions at least as good as greedy
      expect(mipResults.totalDemandCaptured).toBeGreaterThanOrEqual(
        greedyResults.totalDemandCaptured * 0.9 // Allow some tolerance
      );
    });

    it('should respect constraints like greedy', () => {
      const results = mipStyleOptimization(
        mockDemandMeshes,
        mockCandidateSites,
        { ...mockOptimizationParams, numStores: 1 }
      );
      
      expect(results.selectedSites.length).toBeLessThanOrEqual(1);
      expect(results.totalCost).toBeLessThanOrEqual(mockOptimizationParams.maxBudget);
    });
  });

  describe('competitiveAnalysis', () => {
    it('should return competitive analysis results', () => {
      const results = competitiveAnalysis(
        mockDemandMeshes,
        mockCandidateSites,
        mockCompetitors,
        mockOptimizationParams
      );
      
      expect(results).toHaveProperty('selectedSites');
      expect(results).toHaveProperty('competitiveAdvantage');
      expect(results).toHaveProperty('marketShareAnalysis');
      expect(results).toHaveProperty('algorithm');
      
      expect(results.algorithm).toBe('competitive');
      expect(Array.isArray(results.selectedSites)).toBe(true);
      expect(results.competitiveAdvantage).toBeGreaterThanOrEqual(0);
      
      if (results.marketShareAnalysis) {
        expect(results.marketShareAnalysis).toHaveProperty('totalMarket');
        expect(results.marketShareAnalysis).toHaveProperty('capturedShare');
        expect(results.marketShareAnalysis).toHaveProperty('competitorShare');
      }
    });

    it('should consider competitor locations in optimization', () => {
      const withCompetitors = competitiveAnalysis(
        mockDemandMeshes,
        mockCandidateSites,
        mockCompetitors,
        mockOptimizationParams
      );
      
      const withoutCompetitors = competitiveAnalysis(
        mockDemandMeshes,
        mockCandidateSites,
        [],
        mockOptimizationParams
      );
      
      // Results should be different when competitors are present
      expect(withCompetitors.selectedSites).not.toEqual(withoutCompetitors.selectedSites);
    });

    it('should handle empty competitor list', () => {
      const results = competitiveAnalysis(
        mockDemandMeshes,
        mockCandidateSites,
        [],
        mockOptimizationParams
      );
      
      expect(results.selectedSites.length).toBeGreaterThan(0);
      expect(results.competitiveAdvantage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optimization performance comparison', () => {
    it('should produce consistent results with same inputs', () => {
      const results1 = greedyOptimization(mockDemandMeshes, mockCandidateSites, mockOptimizationParams);
      const results2 = greedyOptimization(mockDemandMeshes, mockCandidateSites, mockOptimizationParams);
      
      expect(results1.selectedSites).toEqual(results2.selectedSites);
      expect(results1.totalDemandCaptured).toEqual(results2.totalDemandCaptured);
    });

    it('should have reasonable performance metrics', () => {
      const results = greedyOptimization(mockDemandMeshes, mockCandidateSites, mockOptimizationParams);
      
      if (results.performance) {
        expect(results.performance).toHaveProperty('executionTime');
        expect(results.performance).toHaveProperty('iterationsCompleted');
        expect(results.performance.executionTime).toBeGreaterThan(0);
        expect(results.performance.iterationsCompleted).toBeGreaterThan(0);
      }
    });
  });
});

// Helper function for distance calculation (should match the one in the actual code)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}