/**
 * Population Data Visualization Configuration
 * Optimized for Japanese 500m mesh census data
 */

// Color scheme for population density
export const POPULATION_COLORS = {
  // Ultra high density (>10,000 people per 500m mesh)
  ultraHigh: {
    color: '#8B0000',  // Dark red
    label: '10,000+',
    minPop: 10000
  },
  // High density (5,000-10,000)
  high: {
    color: '#FF0000',  // Red
    label: '5,000-10,000',
    minPop: 5000
  },
  // Medium-high (3,000-5,000)
  mediumHigh: {
    color: '#FF8C00',  // Dark orange
    label: '3,000-5,000',
    minPop: 3000
  },
  // Medium (1,000-3,000)
  medium: {
    color: '#FFD700',  // Gold
    label: '1,000-3,000',
    minPop: 1000
  },
  // Low (500-1,000)
  low: {
    color: '#90EE90',  // Light green
    label: '500-1,000',
    minPop: 500
  },
  // Very low (<500)
  veryLow: {
    color: '#E0E0E0',  // Light gray
    label: '<500',
    minPop: 0
  }
};

// Zoom-based visibility rules
export const VISIBILITY_RULES = {
  // Zoom 10-12: Show only high density areas (>3,000)
  overview: {
    minZoom: 10,
    maxZoom: 12,
    minPopulation: 3000,
    meshOpacity: 0.7
  },
  // Zoom 13-14: Show medium density (>1,000)
  city: {
    minZoom: 13,
    maxZoom: 14,
    minPopulation: 1000,
    meshOpacity: 0.6
  },
  // Zoom 15+: Show all data
  detailed: {
    minZoom: 15,
    maxZoom: 20,
    minPopulation: 0,
    meshOpacity: 0.5
  }
};

// Business relevance scoring
export function calculateBusinessRelevance(population, location) {
  // Base score from population
  let score = population;
  
  // Boost score for business districts
  const businessDistricts = [
    { name: 'Shibuya', lat: 35.6595, lng: 139.7006, boost: 1.5 },
    { name: 'Shinjuku', lat: 35.6896, lng: 139.6917, boost: 1.5 },
    { name: 'Ginza', lat: 35.6762, lng: 139.7648, boost: 1.8 },
    { name: 'Tokyo Station', lat: 35.6812, lng: 139.7671, boost: 1.6 },
    { name: 'Ikebukuro', lat: 35.7295, lng: 139.7109, boost: 1.4 }
  ];
  
  // Apply district boosts
  businessDistricts.forEach(district => {
    const distance = getDistance(location.lat, location.lng, district.lat, district.lng);
    if (distance < 1.0) { // Within 1km
      score *= district.boost * (1 - distance);
    }
  });
  
  return Math.round(score);
}

// Get population color based on value
export function getPopulationColor(population) {
  if (population >= POPULATION_COLORS.ultraHigh.minPop) return POPULATION_COLORS.ultraHigh.color;
  if (population >= POPULATION_COLORS.high.minPop) return POPULATION_COLORS.high.color;
  if (population >= POPULATION_COLORS.mediumHigh.minPop) return POPULATION_COLORS.mediumHigh.color;
  if (population >= POPULATION_COLORS.medium.minPop) return POPULATION_COLORS.medium.color;
  if (population >= POPULATION_COLORS.low.minPop) return POPULATION_COLORS.low.color;
  return POPULATION_COLORS.veryLow.color;
}

// Get visibility settings based on zoom
export function getVisibilitySettings(zoomLevel) {
  if (zoomLevel >= VISIBILITY_RULES.detailed.minZoom) return VISIBILITY_RULES.detailed;
  if (zoomLevel >= VISIBILITY_RULES.city.minZoom) return VISIBILITY_RULES.city;
  return VISIBILITY_RULES.overview;
}

// Helper: Calculate distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Format population for display
export function formatPopulation(population) {
  if (population >= 10000) {
    return (population / 1000).toFixed(1) + 'k';
  }
  return population.toLocaleString();
}

// Mesh size constant (500m as you specified)
export const MESH_SIZE = 500;

// Key business areas for focus
export const KEY_BUSINESS_AREAS = [
  {
    name: 'Tokyo CBD',
    bounds: { north: 35.70, south: 35.65, east: 139.78, west: 139.73 },
    description: 'Central Business District'
  },
  {
    name: 'West Tokyo',
    bounds: { north: 35.70, south: 35.65, east: 139.73, west: 139.68 },
    description: 'Shibuya, Shinjuku, Harajuku'
  },
  {
    name: 'East Tokyo',
    bounds: { north: 35.73, south: 35.68, east: 139.85, west: 139.78 },
    description: 'Asakusa, Sumida, Koto'
  }
];