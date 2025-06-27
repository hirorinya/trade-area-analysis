// Mesh-based Demand Grid System for Trade Area Analysis
// Based on research from retail optimization studies
import { fetchRealPopulationData } from './populationDataAPI.js';

/**
 * Generates a mesh grid for demand analysis using real population data
 * Creates population density cells similar to e-Stat 250m meshes
 * @param {Object} bounds - Geographic bounds {north, south, east, west}
 * @param {number} meshSize - Size of each mesh in meters (default: 250)
 * @param {boolean} useRealData - Whether to fetch real population data (default: true)
 * @returns {Promise<Array>} Promise resolving to array of mesh cells with demand data
 */
export async function generateDemandGrid(bounds, meshSize = 250, useRealData = true) {
  // Validate bounds
  if (!bounds || typeof bounds !== 'object') {
    throw new Error('Invalid bounds: bounds must be an object');
  }
  if (bounds.north <= bounds.south) {
    throw new Error('Invalid bounds: north must be greater than south');
  }
  if (bounds.east <= bounds.west) {
    throw new Error('Invalid bounds: east must be greater than west');
  }
  
  let meshes = [];
  
  // Try to fetch real population data first
  if (useRealData) {
    try {
      // Determine mesh level based on mesh size
      let meshLevel = 5; // 250m mesh
      if (meshSize >= 1000) meshLevel = 3; // 1km mesh
      else if (meshSize >= 500) meshLevel = 4; // 500m mesh
      
      console.log('Fetching real population data...');
      const realPopulationData = await fetchRealPopulationData(bounds, meshLevel);
      
      if (realPopulationData && realPopulationData.length > 0) {
        console.log(`Successfully loaded ${realPopulationData.length} mesh cells with real population data`);
        
        // Convert real data to mesh format
        meshes = realPopulationData.map((data, index) => ({
          id: `mesh_${index}`,
          meshCode: data.meshCode,
          center: {
            lat: data.center.lat,
            lng: data.center.lng
          },
          bounds: calculateMeshBounds(data.center, meshSize),
          population: data.population,
          demand: Math.max(1, Math.round(data.population * 0.3)), // 30% of population, min 1
          capturedBy: [], // Stores that capture demand from this mesh
          captureRatio: {} // Ratio of demand captured by each store
        }));
        
        return meshes;
      } else {
        console.warn('Real population data not available, falling back to simulated data');
      }
    } catch (error) {
      console.error('Error fetching real population data:', error);
      console.log('Falling back to simulated data');
    }
  }
  
  // Fallback to simulated data if real data is not available
  console.log('Using simulated population data');
  
  // Convert meters to degrees (approximate)
  const metersToLat = meshSize / 111320; // 1 degree lat ≈ 111.32km
  const metersToLng = meshSize / (111320 * Math.cos(bounds.north * Math.PI / 180));
  
  // Generate mesh grid with simulated data
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
        // Use simulated population density as fallback
        population: generatePopulationDensity(lat + metersToLat / 2, lng + metersToLng / 2),
        demand: 0, // Will be calculated based on population and demographics
        capturedBy: [], // Stores that capture demand from this mesh
        captureRatio: {} // Ratio of demand captured by each store
      };
      
      // Calculate demand based on population (simplified model)
      // Ensure minimum viable demand even in low-population areas
      mesh.demand = Math.max(1, Math.round(mesh.population * 0.3)); // 30% of population, min 1
      
      meshes.push(mesh);
    }
  }
  
  return meshes;
}

/**
 * Calculates mesh bounds from center point and size
 * @param {Object} center - {lat, lng}
 * @param {number} meshSize - Size in meters
 * @returns {Object} Bounds object
 */
function calculateMeshBounds(center, meshSize) {
  const metersToLat = meshSize / 111320 / 2; // Half size for radius
  const metersToLng = meshSize / (111320 * Math.cos(center.lat * Math.PI / 180)) / 2;
  
  return {
    north: center.lat + metersToLat,
    south: center.lat - metersToLat,
    east: center.lng + metersToLng,
    west: center.lng - metersToLng
  };
}

/**
 * Simulates population density for a given coordinate
 * In production, this would query real demographic data
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {number} Estimated population in this mesh
 */
export function generatePopulationDensity(lat, lng) {
  // Validate input coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return 0;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return 0;
  }
  
  // Simulate realistic population patterns for Tokyo area
  const basePopulation = 800; // Increased base population per mesh (more realistic for urban areas)
  
  // Create more realistic random variation using multiple seeds
  const seed1 = Math.abs(Math.sin(lat * 43758.5453123) * 43758.5453123) % 1;
  const seed2 = Math.abs(Math.sin(lng * 12345.6789012) * 12345.6789012) % 1;
  const randomFactor = 0.3 + (seed1 + seed2) * 0.7; // 0.3 to 1.7 multiplier (more variation)
  
  // Simulate realistic urban density patterns
  const tokyoCenter = { lat: 35.6762, lng: 139.6503 };
  const distance = getDistance(lat, lng, tokyoCenter.lat, tokyoCenter.lng);
  
  // Much stronger urban density gradient
  let densityFactor;
  if (distance < 5) densityFactor = 3.0; // Very high density in central Tokyo
  else if (distance < 10) densityFactor = 2.2; // High density in inner suburbs
  else if (distance < 20) densityFactor = 1.5; // Medium density in outer suburbs
  else if (distance < 30) densityFactor = 0.8; // Lower density in far suburbs
  else densityFactor = 0.3; // Rural areas
  
  // Add secondary centers (Shibuya, Shinjuku, etc.)
  const secondaryCenters = [
    { lat: 35.6580, lng: 139.7016 }, // Shibuya
    { lat: 35.6896, lng: 139.7006 }, // Shinjuku
    { lat: 35.7295, lng: 139.7405 }, // Ikebukuro
    { lat: 35.6652, lng: 139.7747 }  // Shinagawa
  ];
  
  // Boost density near secondary centers
  secondaryCenters.forEach(center => {
    const centerDistance = getDistance(lat, lng, center.lat, center.lng);
    if (centerDistance < 3) {
      densityFactor = Math.max(densityFactor, 2.5 - centerDistance * 0.5);
    }
  });
  
  // Simulate water areas and uninhabitable zones (more realistic)
  const inhabitableSeed = Math.abs(Math.sin(lat * 1234.5) * Math.sin(lng * 5678.9)) % 1;
  
  // Tokyo Bay and water areas (more accurate water detection)
  // Tokyo Bay is roughly south of latitude 35.5 and east of longitude 139.8
  if (lat < 35.55 && lng > 139.85) {
    // Higher chance of water in bay area
    if (inhabitableSeed < 0.7) return 0;
  }
  
  // Coastal areas - areas very close to water
  const tokyoBayCenter = { lat: 35.5, lng: 139.9 };
  const bayDistance = getDistance(lat, lng, tokyoBayCenter.lat, tokyoBayCenter.lng);
  if (bayDistance < 10 && inhabitableSeed < 0.2) return 0; // Near-water areas
  
  // Other uninhabitable areas (parks, industrial zones, etc.)
  if (inhabitableSeed < 0.05) return 0; // 5% chance of uninhabitable area
  
  // Calculate final population with more realistic ranges
  const population = Math.round(basePopulation * randomFactor * densityFactor);
  
  // More realistic minimum populations
  if (densityFactor > 2.0) return Math.max(400, population); // High density areas
  if (densityFactor > 1.0) return Math.max(100, population); // Medium density areas
  return Math.max(20, population); // Low density areas
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
  // Validate inputs
  if (typeof lat1 !== 'number' || typeof lng1 !== 'number' || 
      typeof lat2 !== 'number' || typeof lng2 !== 'number') {
    return 0;
  }
  
  // Check for valid coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
      lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
    return 0;
  }
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Return 0 if calculation resulted in NaN
  return isNaN(distance) ? 0 : distance;
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
  // Validate inputs
  if (!Array.isArray(meshes) || !Array.isArray(stores)) {
    console.error('calculateDemandCapture: meshes and stores must be arrays');
    return meshes;
  }
  
  // Reset capture data
  meshes.forEach(mesh => {
    mesh.capturedBy = [];
    mesh.captureRatio = {}; // Object to store capture ratios by store ID
  });
  
  // Calculate capture for each mesh
  meshes.forEach(mesh => {
    const storesInRange = [];
    
    // Find stores within capture radius
    stores.forEach(store => {
      // Handle different coordinate formats safely
      let storeLat, storeLng;
      
      // Try multiple coordinate formats
      if (typeof store.latitude === 'number' && typeof store.longitude === 'number') {
        storeLat = store.latitude;
        storeLng = store.longitude;
      } else if (store.coordinates) {
        // Handle GeoJSON format
        if (Array.isArray(store.coordinates.coordinates) && store.coordinates.coordinates.length >= 2) {
          storeLat = store.coordinates.coordinates[1];
          storeLng = store.coordinates.coordinates[0];
        } else if (Array.isArray(store.coordinates) && store.coordinates.length >= 2) {
          // Handle [lng, lat] array format
          storeLat = store.coordinates[1];
          storeLng = store.coordinates[0];
        }
      } else if (store.lat && store.lng) {
        // Handle lat/lng format
        storeLat = store.lat;
        storeLng = store.lng;
      }
      
      // Validate extracted coordinates
      if (typeof storeLat !== 'number' || typeof storeLng !== 'number' || 
          isNaN(storeLat) || isNaN(storeLng)) {
        // Only warn once per store ID to avoid spam
        if (!store._coordWarned) {
          console.warn('Store has invalid coordinates format:', {
            id: store.id,
            name: store.name,
            availableProps: Object.keys(store)
          });
          store._coordWarned = true;
        }
        return; // Skip this store
      }
      
      const distance = getDistance(
        mesh.center.lat, mesh.center.lng,
        storeLat, storeLng
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
 * Real-world population data integration
 * Integrates with Japanese government APIs for census data
 * @param {Object} bounds - Geographic bounds
 * @param {string} country - Country code (currently supports 'JP')
 * @param {number} meshSize - Mesh size in meters
 * @returns {Promise<Array>} Array of mesh cells with real population data
 */
export async function loadRealPopulationData(bounds, country = 'JP', meshSize = 250) {
  console.log(`Loading real population data for ${country} in bounds:`, bounds);
  
  try {
    // Validate bounds before processing
    if (!bounds || typeof bounds !== 'object') {
      throw new Error('Invalid bounds provided');
    }
    
    // Use the new async generateDemandGrid with real data
    return await generateDemandGrid(bounds, meshSize, true);
  } catch (error) {
    console.error('Error loading population data:', error);
    // Return fallback simulated data on error
    return await generateDemandGrid(bounds, meshSize, false);
  }
}