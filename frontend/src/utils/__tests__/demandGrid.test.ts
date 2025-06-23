import { 
  generateDemandGrid, 
  calculateDemandCapture, 
  calculateStorePerformance 
} from '../demandGrid';

describe('demandGrid utilities', () => {
  const mockBounds = {
    north: 35.7,
    south: 35.6,
    east: 139.8,
    west: 139.7
  };

  const mockStores = [
    {
      id: 'store1',
      name: 'Test Store 1',
      latitude: 35.65,
      longitude: 139.75,
      location_type: 'store' as const
    },
    {
      id: 'store2',
      name: 'Test Store 2',
      latitude: 35.68,
      longitude: 139.77,
      location_type: 'store' as const
    }
  ];

  describe('generateDemandGrid', () => {
    it('should generate grid meshes within bounds', () => {
      const meshes = generateDemandGrid(mockBounds, 1000);
      
      expect(meshes).toBeInstanceOf(Array);
      expect(meshes.length).toBeGreaterThan(0);
      
      // Check that all meshes are within bounds
      meshes.forEach(mesh => {
        expect(mesh.bounds.north).toBeLessThanOrEqual(mockBounds.north);
        expect(mesh.bounds.south).toBeGreaterThanOrEqual(mockBounds.south);
        expect(mesh.bounds.east).toBeLessThanOrEqual(mockBounds.east);
        expect(mesh.bounds.west).toBeGreaterThanOrEqual(mockBounds.west);
        
        // Check mesh properties
        expect(mesh).toHaveProperty('id');
        expect(mesh).toHaveProperty('population');
        expect(mesh).toHaveProperty('demand');
        expect(mesh).toHaveProperty('bounds');
        expect(mesh.population).toBeGreaterThanOrEqual(0);
        expect(mesh.demand).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate fewer meshes with larger mesh size', () => {
      const largeMeshes = generateDemandGrid(mockBounds, 2000);
      const smallMeshes = generateDemandGrid(mockBounds, 1000);
      
      expect(largeMeshes.length).toBeLessThan(smallMeshes.length);
    });

    it('should handle edge cases', () => {
      // Very small bounds
      const smallBounds = {
        north: 35.6001,
        south: 35.6,
        east: 139.7001,
        west: 139.7
      };
      
      const meshes = generateDemandGrid(smallBounds, 100);
      expect(meshes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateDemandCapture', () => {
    let meshes: any[];

    beforeEach(() => {
      meshes = generateDemandGrid(mockBounds, 1000);
    });

    it('should calculate demand capture for stores', () => {
      const updatedMeshes = calculateDemandCapture(meshes, mockStores, 2.0, 1.5);
      
      expect(updatedMeshes).toBeInstanceOf(Array);
      expect(updatedMeshes.length).toBe(meshes.length);
      
      // Check that some meshes have been captured
      const capturedMeshes = updatedMeshes.filter(mesh => mesh.capturedBy.length > 0);
      expect(capturedMeshes.length).toBeGreaterThan(0);
      
      // Check capture properties
      updatedMeshes.forEach(mesh => {
        expect(mesh).toHaveProperty('capturedBy');
        expect(mesh).toHaveProperty('captureRatio');
        expect(Array.isArray(mesh.capturedBy)).toBe(true);
        expect(mesh.captureRatio).toBeGreaterThanOrEqual(0);
        expect(mesh.captureRatio).toBeLessThanOrEqual(1);
      });
    });

    it('should respect maximum radius parameter', () => {
      const smallRadiusMeshes = calculateDemandCapture(meshes, mockStores, 1.0, 1.5);
      const largeRadiusMeshes = calculateDemandCapture(meshes, mockStores, 5.0, 1.5);
      
      const smallCaptured = smallRadiusMeshes.filter(m => m.capturedBy.length > 0).length;
      const largeCaptured = largeRadiusMeshes.filter(m => m.capturedBy.length > 0).length;
      
      expect(largeCaptured).toBeGreaterThanOrEqual(smallCaptured);
    });

    it('should handle empty store list', () => {
      const updatedMeshes = calculateDemandCapture(meshes, [], 2.0, 1.5);
      
      updatedMeshes.forEach(mesh => {
        expect(mesh.capturedBy).toEqual([]);
        expect(mesh.captureRatio).toBe(0);
      });
    });
  });

  describe('calculateStorePerformance', () => {
    let meshes: any[];

    beforeEach(() => {
      meshes = generateDemandGrid(mockBounds, 1000);
      meshes = calculateDemandCapture(meshes, mockStores, 2.0, 1.5);
    });

    it('should calculate performance metrics for stores', () => {
      const performance = calculateStorePerformance(meshes, mockStores);
      
      expect(performance).toHaveProperty('totalCapturedDemand');
      expect(performance).toHaveProperty('storeMetrics');
      expect(performance).toHaveProperty('overlapAnalysis');
      
      expect(performance.totalCapturedDemand).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(performance.storeMetrics)).toBe(true);
      expect(Array.isArray(performance.overlapAnalysis)).toBe(true);
      
      // Check store metrics
      performance.storeMetrics.forEach(metric => {
        expect(metric).toHaveProperty('storeId');
        expect(metric).toHaveProperty('capturedDemand');
        expect(metric).toHaveProperty('capturedMeshes');
        expect(metric).toHaveProperty('avgDistance');
        expect(metric.capturedDemand).toBeGreaterThanOrEqual(0);
        expect(metric.capturedMeshes).toBeGreaterThanOrEqual(0);
        expect(metric.avgDistance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle stores with no captured demand', () => {
      const farStores = [
        {
          id: 'far-store',
          name: 'Far Store',
          latitude: 40.0, // Very far from bounds
          longitude: 140.0,
          location_type: 'store' as const
        }
      ];
      
      const performance = calculateStorePerformance(meshes, farStores);
      expect(performance.storeMetrics).toHaveLength(1);
      expect(performance.storeMetrics[0].capturedDemand).toBe(0);
    });

    it('should calculate overlap analysis correctly', () => {
      const performance = calculateStorePerformance(meshes, mockStores);
      
      if (performance.overlapAnalysis.length > 0) {
        performance.overlapAnalysis.forEach(overlap => {
          expect(overlap).toHaveProperty('store1');
          expect(overlap).toHaveProperty('store2');
          expect(overlap).toHaveProperty('sharedMeshes');
          expect(overlap).toHaveProperty('sharedDemand');
          expect(overlap.sharedMeshes).toBeGreaterThan(0);
          expect(overlap.sharedDemand).toBeGreaterThan(0);
        });
      }
    });
  });
});