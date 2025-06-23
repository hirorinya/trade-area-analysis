import { analyzeHistoricalPatterns } from '../historicalAnalysis';

describe('historicalAnalysis utilities', () => {
  const mockHistoricalData = [
    {
      id: 'store1',
      name: 'High Performer',
      latitude: 35.65,
      longitude: 139.75,
      revenue: 2000000,
      profit: 300000,
      customerCount: 500,
      marketShare: 0.25,
      growthRate: 15
    },
    {
      id: 'store2',
      name: 'Average Performer',
      latitude: 35.68,
      longitude: 139.77,
      revenue: 1000000,
      profit: 100000,
      customerCount: 300,
      marketShare: 0.15,
      growthRate: 8
    },
    {
      id: 'store3',
      name: 'Under Performer',
      latitude: 35.62,
      longitude: 139.72,
      revenue: 500000,
      profit: 20000,
      customerCount: 150,
      marketShare: 0.05,
      growthRate: -2
    }
  ];

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

  describe('analyzeHistoricalPatterns', () => {
    it('should return comprehensive analysis results', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      
      expect(results).toHaveProperty('performanceCategories');
      expect(results).toHaveProperty('featureImportance');
      expect(results).toHaveProperty('winningPatterns');
      expect(results).toHaveProperty('siteRecommendations');
      expect(results).toHaveProperty('financialForecasts');
      expect(results).toHaveProperty('metadata');
      
      // Check metadata
      expect(results.metadata.totalStoresAnalyzed).toBe(mockHistoricalData.length);
      expect(results.metadata).toHaveProperty('analysisDate');
      expect(results.metadata).toHaveProperty('confidenceLevel');
    });

    it('should categorize stores by performance correctly', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      const { performanceCategories } = results;
      
      expect(performanceCategories).toHaveProperty('highPerformers');
      expect(performanceCategories).toHaveProperty('averagePerformers');
      expect(performanceCategories).toHaveProperty('underPerformers');
      
      // High performer should have the highest revenue store
      expect(performanceCategories.highPerformers.length).toBeGreaterThan(0);
      const highPerformer = performanceCategories.highPerformers.find(s => s.id === 'store1');
      expect(highPerformer).toBeDefined();
      expect(highPerformer.performanceScore).toBeGreaterThan(0.8);
    });

    it('should calculate feature importance', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      const { featureImportance } = results;
      
      expect(typeof featureImportance).toBe('object');
      expect(Object.keys(featureImportance).length).toBeGreaterThan(0);
      
      // All importance values should be between 0 and 1
      Object.values(featureImportance).forEach(importance => {
        expect(importance).toBeGreaterThanOrEqual(0);
        expect(importance).toBeLessThanOrEqual(1);
      });
    });

    it('should identify winning patterns', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      const { winningPatterns } = results;
      
      expect(winningPatterns).toHaveProperty('patterns');
      expect(winningPatterns).toHaveProperty('confidence');
      expect(winningPatterns).toHaveProperty('totalHighPerformers');
      
      if (Object.keys(winningPatterns.patterns).length > 0) {
        Object.values(winningPatterns.patterns).forEach(pattern => {
          expect(pattern).toHaveProperty('optimal');
          expect(pattern).toHaveProperty('range');
          expect(pattern).toHaveProperty('importance');
          expect(pattern.range).toHaveProperty('min');
          expect(pattern.range).toHaveProperty('max');
        });
      }
    });

    it('should generate site recommendations', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      const { siteRecommendations } = results;
      
      expect(Array.isArray(siteRecommendations)).toBe(true);
      
      siteRecommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('latitude');
        expect(recommendation).toHaveProperty('longitude');
        expect(recommendation).toHaveProperty('patternScore');
        expect(recommendation).toHaveProperty('confidence');
        expect(recommendation).toHaveProperty('features');
        expect(recommendation).toHaveProperty('reasoning');
        expect(recommendation).toHaveProperty('expectedPerformance');
        
        expect(recommendation.latitude).toBeGreaterThan(-90);
        expect(recommendation.latitude).toBeLessThan(90);
        expect(recommendation.longitude).toBeGreaterThan(-180);
        expect(recommendation.longitude).toBeLessThan(180);
        expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate financial forecasts', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      const { financialForecasts } = results;
      
      expect(Array.isArray(financialForecasts)).toBe(true);
      expect(financialForecasts.length).toBe(results.siteRecommendations.length);
      
      financialForecasts.forEach(forecast => {
        expect(forecast).toHaveProperty('siteId');
        expect(forecast).toHaveProperty('projectedRevenue');
        expect(forecast).toHaveProperty('projectedProfit');
        expect(forecast).toHaveProperty('projectedCustomers');
        expect(forecast).toHaveProperty('confidenceInterval');
        expect(forecast).toHaveProperty('paybackPeriod');
        expect(forecast).toHaveProperty('riskScore');
        
        expect(forecast.projectedRevenue).toBeGreaterThanOrEqual(0);
        expect(forecast.projectedProfit).toBeGreaterThanOrEqual(0);
        expect(forecast.projectedCustomers).toBeGreaterThanOrEqual(0);
        expect(forecast.confidenceInterval).toHaveProperty('low');
        expect(forecast.confidenceInterval).toHaveProperty('high');
        expect(forecast.riskScore).toBeGreaterThanOrEqual(0);
        expect(forecast.riskScore).toBeLessThanOrEqual(1);
      });
    });

    it('should handle edge cases', () => {
      // Empty historical data
      const emptyResults = analyzeHistoricalPatterns([], mockDemandMeshes);
      expect(emptyResults.performanceCategories.highPerformers).toHaveLength(0);
      expect(emptyResults.siteRecommendations).toHaveLength(0);
      
      // Single store
      const singleStoreResults = analyzeHistoricalPatterns([mockHistoricalData[0]], mockDemandMeshes);
      expect(singleStoreResults.performanceCategories.highPerformers.length).toBeLessThanOrEqual(1);
      
      // Custom analysis parameters
      const customResults = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes, {
        performanceThreshold: 0.5,
        minSampleSize: 1,
        confidenceLevel: 0.5
      });
      expect(customResults.metadata.confidenceLevel).toBe(0.5);
    });

    it('should have consistent data flow between analysis steps', () => {
      const results = analyzeHistoricalPatterns(mockHistoricalData, mockDemandMeshes);
      
      // Total stores should match across different result sections
      const totalStores = mockHistoricalData.length;
      const categorizedStores = 
        results.performanceCategories.highPerformers.length +
        results.performanceCategories.averagePerformers.length +
        results.performanceCategories.underPerformers.length;
      
      expect(categorizedStores).toBe(totalStores);
      
      // Site recommendations should have corresponding financial forecasts
      expect(results.siteRecommendations.length).toBe(results.financialForecasts.length);
      
      // Pattern confidence should be reasonable
      if (results.winningPatterns.patterns && Object.keys(results.winningPatterns.patterns).length > 0) {
        expect(results.winningPatterns.confidence).toBeGreaterThan(0);
        expect(results.winningPatterns.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});