// Mesh-based Demand Grid System for Trade Area Analysis
// Based on research from retail optimization studies

/**
 * Generates a mesh grid for demand analysis
 * Creates population density cells similar to e-Stat 250m meshes
 * @param {Object} bounds - Geographic bounds {north, south, east, west}
 * @param {number} meshSize - Size of each mesh in meters (default: 250)
 * @returns {Array} Array of mesh cells with demand data
 */
export function generateDemandGrid(bounds, meshSize = 250) {
  const meshes = [];
  
  // Convert meters to degrees (approximate)
  const metersToLat = meshSize / 111320; // 1 degree lat ≈ 111.32km
  const metersToLng = meshSize / (111320 * Math.cos(bounds.north * Math.PI / 180));
  
  // Generate mesh grid
  let meshId = 0;
  for (let lat = bounds.south; lat < bounds.north; lat += metersToLat) {
    for (let lng = bounds.west; lng < bounds.east; lng += metersToLng) {
      const mesh = {
        id: `mesh_${meshId++}`,
        center: {
          lat: lat + metersToLat / 2,
          lng: lng + metersToLng / 2
        },
        bounds: {
          north: lat + metersToLat,
          south: lat,
          east: lng + metersToLng,
          west: lng
        },
        // Simulate population density (in practice, this would come from census data)
        population: generatePopulationDensity(lat + metersToLat / 2, lng + metersToLng / 2),
        demand: 0, // Will be calculated based on population and demographics
        capturedBy: [], // Stores that capture demand from this mesh
        captureRatio: {} // Ratio of demand captured by each store
      };
      
      // Calculate demand based on population (simplified model)
      mesh.demand = Math.round(mesh.population * 0.3); // 30% of population as potential customers
      
      meshes.push(mesh);
    }
  }
  
  return meshes;
}

/**
 * Simulates population density for a given coordinate
 * In production, this would query real demographic data
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {number} Estimated population in this mesh
 */
export function generatePopulationDensity(lat, lng) {
  // Simulate realistic population patterns
  const basePopulation = 150; // Base population per mesh
  
  // Add randomness for realistic variation
  const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5 multiplier
  
  // Simulate urban density patterns (higher near city centers)
  // For Tokyo area (example coordinates)
  const tokyoCenter = { lat: 35.6762, lng: 139.6503 };
  const distance = getDistance(lat, lng, tokyoCenter.lat, tokyoCenter.lng);
  
  // Closer to center = higher density
  const densityFactor = Math.max(0.3, 2 - distance / 10); // Decays with distance
  
  // Simulate water areas and uninhabitable zones (0 population)
  if (Math.random() < 0.05) return 0; // 5% chance of uninhabitable area
  
  return Math.round(basePopulation * randomFactor * densityFactor);
}

/**
 * Calculates distance between two points in kilometers
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculates demand capture for stores using Huff model
 * @param {Array} meshes - Array of demand meshes
 * @param {Array} stores - Array of store locations
 * @param {number} maxRadius - Maximum capture radius in km
 * @param {number} distanceDecay - Distance decay exponent (default: 1.5)
 * @returns {Object} Updated meshes with capture data
 */
export function calculateDemandCapture(meshes, stores, maxRadius = 2.0, distanceDecay = 1.5) {
  // Reset capture data
  meshes.forEach(mesh => {
    mesh.capturedBy = [];
    mesh.captureRatio = {};
  });
  
  // Calculate capture for each mesh
  meshes.forEach(mesh => {
    const storesInRange = [];
    
    // Find stores within capture radius
    stores.forEach(store => {
      const distance = getDistance(
        mesh.center.lat, mesh.center.lng,
        store.latitude || store.coordinates?.coordinates?.[1] || 0,
        store.longitude || store.coordinates?.coordinates?.[0] || 0
      );
      
      if (distance <= maxRadius) {
        storesInRange.push({
          ...store,
          distance: distance,
          attractiveness: store.attractiveness || 1.0
        });
      }
    });
    
    if (storesInRange.length === 0) return;
    
    // Apply Huff model for demand allocation
    const totalAttractiveness = storesInRange.reduce((sum, store) => {
      const utility = store.attractiveness / Math.pow(store.distance || 0.1, distanceDecay);
      return sum + utility;
    }, 0);
    
    // Calculate capture ratio for each store
    storesInRange.forEach(store => {
      const utility = store.attractiveness / Math.pow(store.distance || 0.1, distanceDecay);
      const captureRatio = utility / totalAttractiveness;
      
      mesh.capturedBy.push(store.id);
      mesh.captureRatio[store.id] = captureRatio;
    });
  });
  
  return meshes;
}

/**
 * Calculates total demand captured by each store
 * @param {Array} meshes - Array of mesh cells with capture data
 * @param {Array} stores - Array of store locations
 * @returns {Object} Store performance metrics
 */
export function calculateStorePerformance(meshes, stores) {
  const storeMetrics = {};
  
  // Initialize metrics for each store
  stores.forEach(store => {
    storeMetrics[store.id] = {
      id: store.id,
      name: store.name,
      totalDemand: 0,
      meshCount: 0,
      averageDistance: 0,
      marketShare: 0,
      demandDensity: 0
    };
  });
  
  // Calculate demand capture from meshes
  meshes.forEach(mesh => {
    Object.keys(mesh.captureRatio).forEach(storeId => {
      const capturedDemand = mesh.demand * mesh.captureRatio[storeId];
      if (storeMetrics[storeId]) {
        storeMetrics[storeId].totalDemand += capturedDemand;
        storeMetrics[storeId].meshCount += 1;
      }
    });
  });
  
  // Calculate total market demand
  const totalMarketDemand = meshes.reduce((sum, mesh) => sum + mesh.demand, 0);
  
  // Calculate additional metrics
  Object.values(storeMetrics).forEach(metrics => {
    metrics.marketShare = (metrics.totalDemand / totalMarketDemand) * 100;
    metrics.demandDensity = metrics.meshCount > 0 ? metrics.totalDemand / metrics.meshCount : 0;
  });
  
  return storeMetrics;
}

/**
 * Generates candidate store sites within bounds
 * @param {Object} bounds - Geographic bounds
 * @param {number} count - Number of candidate sites to generate
 * @param {Array} existingStores - Existing store locations to avoid
 * @returns {Array} Array of candidate site coordinates
 */
export function generateCandidateSites(bounds, count = 100, existingStores = []) {
  const candidates = [];
  const minDistance = 0.2; // Minimum 200m between sites
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validSite = false;
    
    while (!validSite && attempts < 50) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      
      // Check if site is too close to existing stores or candidates
      const tooClose = [...existingStores, ...candidates].some(existing => {
        const distance = getDistance(
          lat, lng,
          existing.latitude || existing.lat || existing.coordinates?.coordinates?.[1] || 0,
          existing.longitude || existing.lng || existing.coordinates?.coordinates?.[0] || 0
        );
        return distance < minDistance;
      });
      
      if (!tooClose) {
        candidates.push({
          id: `candidate_${i}`,
          lat: lat,
          lng: lng,
          type: 'candidate',
          demand: 0 // Will be calculated
        });
        validSite = true;
      }
      attempts++;
    }
  }
  
  return candidates;
}

/**
 * Real-world population data integration (placeholder)
 * In production, this would integrate with:
 * - Japan: e-Stat API for population census data
 * - US: Census Bureau API
 * - EU: Eurostat data
 * - Custom: User-uploaded demographic data
 */
export async function loadRealPopulationData(bounds, country = 'JP') {
  // Placeholder for real data integration
  console.log(`Loading population data for ${country} in bounds:`, bounds);
  
  // For now, return simulated data
  return generateDemandGrid(bounds);
}