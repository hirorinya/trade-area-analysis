// Historical Data Analysis Engine
// Analyzes store performance patterns and generates tailored recommendations

/**
 * Analyzes historical store performance to identify success patterns
 * @param {Array} historicalData - Array of store performance records
 * @param {Array} demandMeshes - Current demand grid data
 * @param {Object} analysisParams - Analysis configuration
 * @returns {Object} Analysis results with recommendations
 */
export function analyzeHistoricalPatterns(historicalData, demandMeshes, analysisParams = {}) {
  const {
    performanceThreshold = 0.8,    // Minimum performance score to consider "successful"
    minSampleSize = 3,             // Minimum stores needed for pattern analysis
    featureImportanceThreshold = 0.1, // Minimum importance score for features
    confidenceLevel = 0.8          // Confidence threshold for recommendations
  } = analysisParams;

  console.log(`Analyzing historical patterns from ${historicalData.length} stores`);

  // Step 1: Categorize stores by performance
  const performanceCategories = categorizeStoresByPerformance(historicalData, performanceThreshold);
  
  // Step 2: Extract location features for each store
  const storeFeatures = historicalData.map(store => 
    extractLocationFeatures(store, demandMeshes)
  );

  // Step 3: Perform feature importance analysis
  const featureImportance = calculateFeatureImportance(storeFeatures, performanceCategories);

  // Step 4: Identify winning patterns
  const winningPatterns = identifyWinningPatterns(
    performanceCategories.highPerformers, 
    storeFeatures, 
    featureImportance
  );

  // Step 5: Generate site recommendations
  const siteRecommendations = generateSiteRecommendations(
    winningPatterns, 
    demandMeshes, 
    featureImportance,
    confidenceLevel
  );

  // Step 6: Create financial forecasts
  const financialForecasts = generateFinancialForecasts(
    siteRecommendations, 
    historicalData, 
    winningPatterns
  );

  return {
    performanceCategories,
    featureImportance,
    winningPatterns,
    siteRecommendations,
    financialForecasts,
    metadata: {
      totalStoresAnalyzed: historicalData.length,
      confidenceLevel,
      analysisDate: new Date().toISOString(),
      patternStrength: calculatePatternStrength(winningPatterns)
    }
  };
}

/**
 * Categorizes stores by performance levels
 */
function categorizeStoresByPerformance(historicalData, threshold) {
  const highPerformers = [];
  const averagePerformers = [];
  const underPerformers = [];

  historicalData.forEach(store => {
    const performanceScore = calculatePerformanceScore(store);
    
    if (performanceScore >= threshold) {
      highPerformers.push({ ...store, performanceScore });
    } else if (performanceScore >= threshold * 0.6) {
      averagePerformers.push({ ...store, performanceScore });
    } else {
      underPerformers.push({ ...store, performanceScore });
    }
  });

  return { highPerformers, averagePerformers, underPerformers };
}

/**
 * Calculates performance score based on multiple metrics
 */
function calculatePerformanceScore(store) {
  const {
    revenue = 0,
    profit = 0,
    customerCount = 0,
    marketShare = 0,
    growthRate = 0,
    benchmarkRevenue = 1000000, // Default benchmark
    benchmarkProfit = 100000
  } = store;

  // Weighted scoring system
  const revenueScore = Math.min(revenue / benchmarkRevenue, 2.0); // Cap at 2x benchmark
  const profitScore = Math.min(profit / benchmarkProfit, 2.0);
  const marketShareScore = Math.min(marketShare * 10, 1.0); // Assume market share is 0-1
  const growthScore = Math.max(0, Math.min(growthRate / 20, 1.0)); // 20% growth = perfect score

  // Weighted average
  const weights = {
    revenue: 0.3,
    profit: 0.4,
    marketShare: 0.2,
    growth: 0.1
  };

  return (
    revenueScore * weights.revenue +
    profitScore * weights.profit +
    marketShareScore * weights.marketShare +
    growthScore * weights.growth
  );
}

/**
 * Extracts location-based features for analysis
 */
function extractLocationFeatures(store, demandMeshes) {
  const { latitude, longitude } = store;
  
  // Find nearby demand meshes (within 2km)
  const nearbyMeshes = demandMeshes.filter(mesh => {
    const meshCenterLat = (mesh.bounds.north + mesh.bounds.south) / 2;
    const meshCenterLng = (mesh.bounds.east + mesh.bounds.west) / 2;
    const distance = getDistance(latitude, longitude, meshCenterLat, meshCenterLng);
    return distance <= 2.0; // 2km radius
  });

  // Calculate aggregated features
  const totalPopulation = nearbyMeshes.reduce((sum, mesh) => sum + mesh.population, 0);
  const totalDemand = nearbyMeshes.reduce((sum, mesh) => sum + mesh.demand, 0);
  const avgPopulationDensity = nearbyMeshes.length > 0 ? 
    totalPopulation / nearbyMeshes.length : 0;

  // Additional location characteristics
  const features = {
    storeId: store.id,
    performanceScore: calculatePerformanceScore(store),
    
    // Demographic features
    populationWithin2km: totalPopulation,
    demandWithin2km: totalDemand,
    populationDensity: avgPopulationDensity,
    meshCount: nearbyMeshes.length,
    
    // Geographic features  
    latitude,
    longitude,
    
    // Accessibility features (simplified)
    accessibilityScore: calculateAccessibilityScore(latitude, longitude),
    
    // Competition features (would need competitor data)
    competitorDensity: calculateCompetitorDensity(store, demandMeshes),
    
    // Economic features (would be enhanced with real data)
    economicIndex: calculateEconomicIndex(nearbyMeshes)
  };

  return features;
}

/**
 * Calculates feature importance using correlation analysis
 */
function calculateFeatureImportance(storeFeatures, performanceCategories) {
  const allFeatureNames = Object.keys(storeFeatures[0]).filter(key => 
    key !== 'storeId' && typeof storeFeatures[0][key] === 'number'
  );

  const importance = {};

  allFeatureNames.forEach(featureName => {
    const featureValues = storeFeatures.map(store => store[featureName]);
    const performanceScores = storeFeatures.map(store => store.performanceScore);
    
    // Calculate correlation coefficient
    const correlation = calculateCorrelation(featureValues, performanceScores);
    importance[featureName] = Math.abs(correlation);
  });

  // Sort by importance
  const sortedImportance = Object.entries(importance)
    .sort(([,a], [,b]) => b - a)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

  return sortedImportance;
}

/**
 * Identifies patterns from high-performing stores
 */
function identifyWinningPatterns(highPerformers, storeFeatures, featureImportance) {
  if (highPerformers.length < 2) {
    return { patterns: [], confidence: 0 };
  }

  const highPerformerFeatures = storeFeatures.filter(store => 
    highPerformers.some(hp => hp.id === store.storeId)
  );

  const patterns = {};
  const topFeatures = Object.keys(featureImportance).slice(0, 5); // Top 5 features

  topFeatures.forEach(feature => {
    const values = highPerformerFeatures.map(store => store[feature]);
    const stats = calculateStats(values);
    
    patterns[feature] = {
      optimal: stats.mean,
      range: {
        min: stats.mean - stats.stdDev,
        max: stats.mean + stats.stdDev
      },
      importance: featureImportance[feature],
      sampleSize: values.length
    };
  });

  return {
    patterns,
    confidence: calculatePatternConfidence(highPerformerFeatures),
    totalHighPerformers: highPerformers.length
  };
}

/**
 * Generates site recommendations based on patterns
 */
function generateSiteRecommendations(winningPatterns, demandMeshes, featureImportance, confidenceLevel) {
  const recommendations = [];

  // Score each mesh based on how well it matches winning patterns
  demandMeshes.forEach(mesh => {
    const meshCenterLat = (mesh.bounds.north + mesh.bounds.south) / 2;
    const meshCenterLng = (mesh.bounds.east + mesh.bounds.west) / 2;
    
    // Extract features for this potential location
    const locationFeatures = extractLocationFeatures(
      { id: 'candidate', latitude: meshCenterLat, longitude: meshCenterLng },
      demandMeshes
    );

    // Calculate pattern match score
    const patternScore = calculatePatternMatchScore(locationFeatures, winningPatterns.patterns);
    
    if (patternScore.confidence >= confidenceLevel) {
      recommendations.push({
        latitude: meshCenterLat,
        longitude: meshCenterLng,
        patternScore: patternScore.score,
        confidence: patternScore.confidence,
        features: locationFeatures,
        reasoning: generateRecommendationReasoning(locationFeatures, winningPatterns.patterns),
        expectedPerformance: predictPerformance(locationFeatures, winningPatterns.patterns)
      });
    }
  });

  // Sort by pattern score and return top recommendations
  return recommendations
    .sort((a, b) => b.patternScore - a.patternScore)
    .slice(0, 10); // Top 10 recommendations
}

/**
 * Generates financial forecasts for recommended sites
 */
function generateFinancialForecasts(siteRecommendations, historicalData, winningPatterns) {
  const avgHighPerformerMetrics = calculateAverageMetrics(
    historicalData.filter(store => 
      winningPatterns.patterns && store.performanceScore >= 0.8
    )
  );

  return siteRecommendations.map(site => {
    const performanceMultiplier = site.expectedPerformance;
    
    return {
      siteId: `${site.latitude.toFixed(4)}_${site.longitude.toFixed(4)}`,
      projectedRevenue: Math.round(avgHighPerformerMetrics.avgRevenue * performanceMultiplier),
      projectedProfit: Math.round(avgHighPerformerMetrics.avgProfit * performanceMultiplier),
      projectedCustomers: Math.round(avgHighPerformerMetrics.avgCustomers * performanceMultiplier),
      confidenceInterval: {
        low: Math.round(avgHighPerformerMetrics.avgRevenue * performanceMultiplier * 0.8),
        high: Math.round(avgHighPerformerMetrics.avgRevenue * performanceMultiplier * 1.2)
      },
      paybackPeriod: calculatePaybackPeriod(
        avgHighPerformerMetrics.avgProfit * performanceMultiplier,
        1000000 // Assumed investment cost
      ),
      riskScore: 1 - site.confidence // Higher confidence = lower risk
    };
  });
}

// Helper functions
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateAccessibilityScore(lat, lng) {
  // Simplified accessibility score
  // In real implementation, would use transit data, road density, etc.
  return Math.random() * 0.5 + 0.5; // 0.5-1.0 range
}

function calculateCompetitorDensity(store, demandMeshes) {
  // Simplified competitor density calculation
  // Would need actual competitor data
  return Math.random() * 0.3; // 0-0.3 range
}

function calculateEconomicIndex(meshes) {
  // Simplified economic index based on population density
  const avgDensity = meshes.reduce((sum, mesh) => sum + mesh.population, 0) / meshes.length;
  return Math.min(avgDensity / 1000, 1.0); // Normalize to 0-1
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateStats(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, variance, stdDev };
}

function calculatePatternConfidence(features) {
  // Higher confidence with more samples and lower variance
  const sampleSize = features.length;
  const sampleConfidence = Math.min(sampleSize / 10, 1.0); // Full confidence at 10+ samples
  
  return sampleConfidence * 0.8 + 0.2; // 0.2-1.0 range
}

function calculatePatternMatchScore(locationFeatures, patterns) {
  let totalScore = 0;
  let totalWeight = 0;
  let matchCount = 0;

  Object.entries(patterns).forEach(([feature, pattern]) => {
    const featureValue = locationFeatures[feature];
    if (featureValue !== undefined) {
      const isInRange = featureValue >= pattern.range.min && featureValue <= pattern.range.max;
      const weight = pattern.importance;
      
      if (isInRange) {
        totalScore += weight;
        matchCount++;
      }
      totalWeight += weight;
    }
  });

  const score = totalWeight > 0 ? totalScore / totalWeight : 0;
  const confidence = Object.keys(patterns).length > 0 ? matchCount / Object.keys(patterns).length : 0;
  
  return { score, confidence };
}

function generateRecommendationReasoning(features, patterns) {
  const reasons = [];
  
  Object.entries(patterns).forEach(([feature, pattern]) => {
    const value = features[feature];
    if (value >= pattern.range.min && value <= pattern.range.max) {
      reasons.push(`${feature}: ${value.toFixed(1)} (optimal range: ${pattern.range.min.toFixed(1)}-${pattern.range.max.toFixed(1)})`);
    }
  });
  
  return reasons.slice(0, 3); // Top 3 reasons
}

function predictPerformance(features, patterns) {
  // Simple performance prediction based on pattern matching
  const patternMatch = calculatePatternMatchScore(features, patterns);
  return 0.5 + (patternMatch.score * 0.5); // 0.5-1.0 range
}

function calculateAverageMetrics(stores) {
  if (stores.length === 0) {
    return { avgRevenue: 1000000, avgProfit: 100000, avgCustomers: 1000 };
  }
  
  const avgRevenue = stores.reduce((sum, s) => sum + (s.revenue || 0), 0) / stores.length;
  const avgProfit = stores.reduce((sum, s) => sum + (s.profit || 0), 0) / stores.length;
  const avgCustomers = stores.reduce((sum, s) => sum + (s.customerCount || 0), 0) / stores.length;
  
  return { avgRevenue, avgProfit, avgCustomers };
}

function calculatePaybackPeriod(annualProfit, initialInvestment) {
  if (annualProfit <= 0) return Infinity;
  return Math.round((initialInvestment / annualProfit) * 10) / 10; // Round to 1 decimal
}

function calculatePatternStrength(winningPatterns) {
  if (!winningPatterns.patterns || Object.keys(winningPatterns.patterns).length === 0) {
    return 0;
  }
  
  const avgImportance = Object.values(winningPatterns.patterns)
    .reduce((sum, pattern) => sum + pattern.importance, 0) / Object.keys(winningPatterns.patterns).length;
  
  return Math.min(avgImportance * winningPatterns.confidence, 1.0);
}

export default analyzeHistoricalPatterns;