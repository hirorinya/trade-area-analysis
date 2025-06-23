// Store Optimization Engine
// Implements MIP and Greedy algorithms for optimal store placement

import { generateDemandGrid, calculateDemandCapture, generateCandidateSites, getDistance } from './demandGrid.js';

/**
 * Greedy algorithm for store site selection
 * Iteratively selects the site that maximizes incremental demand capture
 * @param {Array} candidateSites - Array of potential store locations
 * @param {Array} demandMeshes - Array of demand mesh cells
 * @param {number} numStores - Number of stores to select
 * @param {Object} constraints - Optimization constraints
 * @returns {Object} Optimization results
 */
export function greedyOptimization(candidateSites, demandMeshes, numStores = 5, constraints = {}) {
  const {
    maxRadius = 2.0,           // Maximum capture radius in km
    distanceDecay = 1.5,       // Distance decay exponent
    minDistance = 0.5,         // Minimum distance between stores in km
    maxBudget = Infinity,      // Maximum budget constraint
    storeCost = 1000000        // Cost per store (default: 1M)
  } = constraints;

  console.log(`Starting Greedy optimization for ${numStores} stores from ${candidateSites.length} candidates`);
  
  const selectedStores = [];
  const remainingCandidates = [...candidateSites];
  const results = [];
  
  // Track cumulative metrics
  let totalDemandCaptured = 0;
  let totalCost = 0;
  
  for (let iteration = 0; iteration < numStores; iteration++) {
    if (remainingCandidates.length === 0) break;
    if (totalCost + storeCost > maxBudget) break;
    
    let bestCandidate = null;
    let bestIncrementalDemand = 0;
    let bestAnalysis = null;
    
    // Evaluate each remaining candidate
    for (let i = 0; i < remainingCandidates.length; i++) {
      const candidate = remainingCandidates[i];
      
      // Check minimum distance constraint
      const tooClose = selectedStores.some(store => 
        getDistance(candidate.lat, candidate.lng, store.lat, store.lng) < minDistance
      );
      
      if (tooClose) continue;
      
      // Test this candidate with current selected stores
      const testStores = [...selectedStores, {
        ...candidate,
        id: `store_${selectedStores.length}`,
        location_type: 'store',
        attractiveness: 1.0
      }];
      
      // Calculate demand capture with this candidate
      const updatedMeshes = calculateDemandCapture([...demandMeshes], testStores, maxRadius, distanceDecay);
      
      // Calculate incremental demand (only new demand captured by this store)
      const incrementalDemand = updatedMeshes.reduce((sum, mesh) => {
        const newStoreCaptureRatio = mesh.captureRatio[`store_${selectedStores.length}`] || 0;
        return sum + (mesh.demand * newStoreCaptureRatio);
      }, 0);
      
      if (incrementalDemand > bestIncrementalDemand) {
        bestIncrementalDemand = incrementalDemand;
        bestCandidate = candidate;
        bestAnalysis = {
          incrementalDemand,
          totalDemand: updatedMeshes.reduce((sum, mesh) => sum + mesh.demand, 0),
          meshes: updatedMeshes
        };
      }
    }
    
    if (!bestCandidate) {
      console.log(`No valid candidates found at iteration ${iteration + 1}`);
      break;
    }
    
    // Add best candidate to selected stores
    selectedStores.push({
      ...bestCandidate,
      id: `store_${selectedStores.length}`,
      storeNumber: selectedStores.length + 1,
      location_type: 'store',
      attractiveness: 1.0,
      demandCaptured: bestIncrementalDemand
    });
    
    // Remove from candidates
    const candidateIndex = remainingCandidates.findIndex(c => c.id === bestCandidate.id);
    remainingCandidates.splice(candidateIndex, 1);
    
    // Update totals
    totalDemandCaptured += bestIncrementalDemand;
    totalCost += storeCost;
    
    // Store iteration results
    results.push({
      iteration: iteration + 1,
      selectedSite: bestCandidate,
      incrementalDemand: bestIncrementalDemand,
      cumulativeDemand: totalDemandCaptured,
      cumulativeCost: totalCost,
      remainingCandidates: remainingCandidates.length
    });
    
    console.log(`Iteration ${iteration + 1}: Selected site at (${bestCandidate.lat.toFixed(4)}, ${bestCandidate.lng.toFixed(4)}) with demand ${Math.round(bestIncrementalDemand)}`);
  }
  
  // Final analysis with all selected stores
  const finalMeshes = calculateDemandCapture([...demandMeshes], selectedStores, maxRadius, distanceDecay);
  const coverage = finalMeshes.filter(mesh => mesh.capturedBy.length > 0).length / finalMeshes.length;
  
  return {
    algorithm: 'Greedy',
    selectedStores,
    totalStores: selectedStores.length,
    totalDemandCaptured,
    totalCost,
    coverage: coverage * 100,
    iterations: results,
    finalMeshes,
    metrics: {
      averageDemandPerStore: totalDemandCaptured / selectedStores.length,
      costPerDemandUnit: totalCost / totalDemandCaptured,
      efficiency: (totalDemandCaptured / totalCost) * 100000, // Demand per 100K investment
    }
  };
}

/**
 * Simplified MIP-style optimization using iterative improvement
 * Since we don't have a full MIP solver, we use a heuristic approach
 * @param {Array} candidateSites - Array of potential store locations
 * @param {Array} demandMeshes - Array of demand mesh cells
 * @param {number} numStores - Number of stores to select
 * @param {Object} constraints - Optimization constraints
 * @returns {Object} Optimization results
 */
export function mipStyleOptimization(candidateSites, demandMeshes, numStores = 5, constraints = {}) {
  const {
    maxRadius = 2.0,
    distanceDecay = 1.5,
    minDistance = 0.5,
    maxBudget = Infinity,
    storeCost = 1000000,
    maxIterations = 100
  } = constraints;

  console.log(`Starting MIP-style optimization for ${numStores} stores`);
  
  // Start with greedy solution as initial solution
  let currentSolution = greedyOptimization(candidateSites, demandMeshes, numStores, constraints);
  let bestSolution = { ...currentSolution };
  let bestObjective = currentSolution.totalDemandCaptured;
  
  console.log(`Initial greedy solution: ${Math.round(bestObjective)} demand captured`);
  
  // Iterative improvement phase
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let improved = false;
    
    // Try swapping each selected store with unselected candidates
    for (let storeIndex = 0; storeIndex < currentSolution.selectedStores.length; storeIndex++) {
      const currentStore = currentSolution.selectedStores[storeIndex];
      
      // Find candidates not currently selected
      const unselectedCandidates = candidateSites.filter(candidate => 
        !currentSolution.selectedStores.some(store => store.id === candidate.id)
      );
      
      for (const candidate of unselectedCandidates) {
        // Check distance constraints with other selected stores
        const otherStores = currentSolution.selectedStores.filter((_, idx) => idx !== storeIndex);
        const violatesDistance = otherStores.some(store => 
          getDistance(candidate.lat, candidate.lng, store.lat, store.lng) < minDistance
        );
        
        if (violatesDistance) continue;
        
        // Create test solution by swapping
        const testStores = [
          ...otherStores,
          {
            ...candidate,
            id: `store_${storeIndex}`,
            storeNumber: storeIndex + 1,
            location_type: 'store',
            attractiveness: 1.0
          }
        ];
        
        // Evaluate test solution
        const testMeshes = calculateDemandCapture([...demandMeshes], testStores, maxRadius, distanceDecay);
        const testObjective = testMeshes.reduce((sum, mesh) => {
          return sum + Object.values(mesh.captureRatio).reduce((meshSum, ratio) => 
            meshSum + (mesh.demand * ratio), 0
          );
        }, 0);
        
        // If improvement found, update current solution
        if (testObjective > bestObjective) {
          console.log(`Iteration ${iteration + 1}: Improved solution found. Objective: ${Math.round(testObjective)} (was ${Math.round(bestObjective)})`);
          
          bestObjective = testObjective;
          bestSolution = {
            algorithm: 'MIP-Style',
            selectedStores: testStores,
            totalStores: testStores.length,
            totalDemandCaptured: testObjective,
            totalCost: testStores.length * storeCost,
            coverage: (testMeshes.filter(mesh => mesh.capturedBy.length > 0).length / testMeshes.length) * 100,
            finalMeshes: testMeshes,
            iterations: iteration + 1,
            metrics: {
              averageDemandPerStore: testObjective / testStores.length,
              costPerDemandUnit: (testStores.length * storeCost) / testObjective,
              efficiency: (testObjective / (testStores.length * storeCost)) * 100000,
            }
          };
          
          currentSolution = bestSolution;
          improved = true;
          break; // Move to next store after finding improvement
        }
      }
      
      if (improved) break; // Start over with new solution
    }
    
    // If no improvement found in this iteration, try random restart
    if (!improved && iteration < maxIterations - 10) {
      // Random restart: randomly select different initial stores
      const shuffledCandidates = [...candidateSites].sort(() => Math.random() - 0.5);
      const randomSolution = greedyOptimization(shuffledCandidates.slice(0, Math.min(50, shuffledCandidates.length)), demandMeshes, numStores, constraints);
      
      if (randomSolution.totalDemandCaptured > bestObjective) {
        console.log(`Random restart found better solution: ${Math.round(randomSolution.totalDemandCaptured)}`);
        currentSolution = randomSolution;
        bestSolution = randomSolution;
        bestObjective = randomSolution.totalDemandCaptured;
        improved = true;
      }
    }
    
    if (!improved) {
      console.log(`No improvement found in iteration ${iteration + 1}`);
      // Early termination if no improvement for several iterations
      if (iteration > 20) break;
    }
  }
  
  console.log(`MIP-style optimization completed. Final objective: ${Math.round(bestObjective)}`);
  return bestSolution;
}

/**
 * Competitive analysis - evaluates how new stores would perform against competitors
 * @param {Array} newStores - Proposed new store locations
 * @param {Array} competitors - Existing competitor locations
 * @param {Array} demandMeshes - Array of demand mesh cells
 * @param {Object} params - Analysis parameters
 * @returns {Object} Competitive analysis results
 */
export function competitiveAnalysis(newStores, competitors, demandMeshes, params = {}) {
  const {
    maxRadius = 2.0,
    distanceDecay = 1.5,
    newStoreAttractiveness = 1.0,
    competitorAttractiveness = 0.8 // Assume slight advantage for new stores
  } = params;
  
  console.log(`Analyzing competitive scenario: ${newStores.length} new stores vs ${competitors.length} competitors`);
  
  // Prepare all stores (new + competitors) for analysis
  const enhancedNewStores = newStores.map(store => ({
    ...store,
    attractiveness: newStoreAttractiveness,
    type: 'new'
  }));
  
  const enhancedCompetitors = competitors.map(comp => ({
    ...comp,
    attractiveness: competitorAttractiveness,
    type: 'competitor'
  }));
  
  const allStores = [...enhancedNewStores, ...enhancedCompetitors];
  
  // Calculate market share with competition
  const competitiveMeshes = calculateDemandCapture([...demandMeshes], allStores, maxRadius, distanceDecay);
  
  // Analyze results by store type
  const newStorePerformance = {};
  const competitorPerformance = {};
  
  enhancedNewStores.forEach(store => {
    newStorePerformance[store.id] = {
      ...store,
      demandCaptured: 0,
      marketShare: 0,
      competitiveMeshes: 0
    };
  });
  
  enhancedCompetitors.forEach(comp => {
    competitorPerformance[comp.id] = {
      ...comp,
      demandCaptured: 0,
      marketShare: 0
    };
  });
  
  // Calculate performance metrics
  let totalMarketDemand = 0;
  let totalNewStoreDemand = 0;
  let totalCompetitorDemand = 0;
  
  competitiveMeshes.forEach(mesh => {
    totalMarketDemand += mesh.demand;
    
    Object.keys(mesh.captureRatio).forEach(storeId => {
      const capturedDemand = mesh.demand * mesh.captureRatio[storeId];
      
      if (newStorePerformance[storeId]) {
        newStorePerformance[storeId].demandCaptured += capturedDemand;
        totalNewStoreDemand += capturedDemand;
        
        // Count meshes where this new store competes with competitors
        const competingStores = Object.keys(mesh.captureRatio).length;
        if (competingStores > 1) {
          newStorePerformance[storeId].competitiveMeshes += 1;
        }
      } else if (competitorPerformance[storeId]) {
        competitorPerformance[storeId].demandCaptured += capturedDemand;
        totalCompetitorDemand += capturedDemand;
      }
    });
  });
  
  // Calculate market shares
  Object.values(newStorePerformance).forEach(store => {
    store.marketShare = (store.demandCaptured / totalMarketDemand) * 100;
  });
  
  Object.values(competitorPerformance).forEach(comp => {
    comp.marketShare = (comp.demandCaptured / totalMarketDemand) * 100;
  });
  
  return {
    analysis: 'Competitive Analysis',
    totalMarketDemand,
    newStores: {
      totalDemand: totalNewStoreDemand,
      marketShare: (totalNewStoreDemand / totalMarketDemand) * 100,
      averageDemandPerStore: totalNewStoreDemand / newStores.length,
      stores: Object.values(newStorePerformance)
    },
    competitors: {
      totalDemand: totalCompetitorDemand,
      marketShare: (totalCompetitorDemand / totalMarketDemand) * 100,
      averageDemandPerStore: competitors.length > 0 ? totalCompetitorDemand / competitors.length : 0,
      stores: Object.values(competitorPerformance)
    },
    competitiveMeshes,
    summary: {
      marketCoverage: (competitiveMeshes.filter(mesh => mesh.capturedBy.length > 0).length / competitiveMeshes.length) * 100,
      averageCompetition: competitiveMeshes.reduce((sum, mesh) => sum + Object.keys(mesh.captureRatio).length, 0) / competitiveMeshes.length,
      newStoreAdvantage: ((totalNewStoreDemand / newStores.length) / (totalCompetitorDemand / competitors.length || 1)) * 100
    }
  };
}

/**
 * Multi-scenario analysis - compares different optimization strategies
 * @param {Array} candidateSites - Array of potential store locations
 * @param {Array} demandMeshes - Array of demand mesh cells
 * @param {Array} scenarios - Array of scenario configurations
 * @returns {Object} Comparison results
 */
export function multiScenarioAnalysis(candidateSites, demandMeshes, scenarios) {
  console.log(`Running multi-scenario analysis for ${scenarios.length} scenarios`);
  
  const results = [];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n--- Scenario ${index + 1}: ${scenario.name} ---`);
    
    let result;
    if (scenario.algorithm === 'greedy') {
      result = greedyOptimization(candidateSites, demandMeshes, scenario.numStores, scenario.constraints);
    } else if (scenario.algorithm === 'mip') {
      result = mipStyleOptimization(candidateSites, demandMeshes, scenario.numStores, scenario.constraints);
    }
    
    results.push({
      ...scenario,
      scenarioIndex: index + 1,
      results: result
    });
  });
  
  // Compare scenarios
  const comparison = {
    scenarios: results,
    bestByDemand: results.reduce((best, current) => 
      current.results.totalDemandCaptured > best.results.totalDemandCaptured ? current : best
    ),
    bestByCoverage: results.reduce((best, current) => 
      current.results.coverage > best.results.coverage ? current : best
    ),
    bestByEfficiency: results.reduce((best, current) => 
      current.results.metrics.efficiency > best.results.metrics.efficiency ? current : best
    ),
    summary: {
      totalScenarios: results.length,
      averageDemand: results.reduce((sum, s) => sum + s.results.totalDemandCaptured, 0) / results.length,
      averageCoverage: results.reduce((sum, s) => sum + s.results.coverage, 0) / results.length,
      demandRange: {
        min: Math.min(...results.map(s => s.results.totalDemandCaptured)),
        max: Math.max(...results.map(s => s.results.totalDemandCaptured))
      }
    }
  };
  
  console.log(`\n--- Analysis Complete ---`);
  console.log(`Best by demand: ${comparison.bestByDemand.name} (${Math.round(comparison.bestByDemand.results.totalDemandCaptured)})`);
  console.log(`Best by coverage: ${comparison.bestByCoverage.name} (${comparison.bestByCoverage.results.coverage.toFixed(1)}%)`);
  console.log(`Best by efficiency: ${comparison.bestByEfficiency.name} (${comparison.bestByEfficiency.results.metrics.efficiency.toFixed(1)})`);
  
  return comparison;
}

/**
 * Export utility functions for external use
 */
export {
  generateDemandGrid,
  calculateDemandCapture,
  generateCandidateSites
} from './demandGrid.js';