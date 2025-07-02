// Coordinate format standardization utilities

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationCoordinates {
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Extract coordinates from various location formats and return standardized [lng, lat] array
 * Handles multiple coordinate formats:
 * - GeoJSON: {type: 'Point', coordinates: [lng, lat]}
 * - LocationCoordinates: {coordinates: [lng, lat]}
 * - Object: {latitude, longitude}
 * - Object: {lat, lng}
 * - Direct properties: location.latitude, location.longitude
 */
export function getLocationCoordinates(location: any): [number, number] | null {
  if (!location) return null;

  // Handle GeoJSON Point format
  if (location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return [location.coordinates[0], location.coordinates[1]];
  }

  // Handle nested coordinates object with coordinates array
  if (location.coordinates) {
    if (Array.isArray(location.coordinates.coordinates) && location.coordinates.coordinates.length >= 2) {
      return [location.coordinates.coordinates[0], location.coordinates.coordinates[1]];
    }
    if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      return [location.coordinates[0], location.coordinates[1]];
    }
  }

  // Handle latitude/longitude object format
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    return [location.longitude, location.latitude];
  }

  // Handle lat/lng object format
  if (typeof location.lat === 'number' && typeof location.lng === 'number') {
    return [location.lng, location.lat];
  }

  // Handle direct properties
  if (typeof location.longitude === 'number' && typeof location.latitude === 'number') {
    return [location.longitude, location.latitude];
  }

  console.warn('Location has invalid coordinates:', location);
  return null;
}

/**
 * Convert coordinates to GeoJSON Point format
 */
export function toGeoJSONPoint(lng: number, lat: number): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [lng, lat]
  };
}

/**
 * Convert coordinates to LocationCoordinates format (used by the app)
 */
export function toLocationCoordinates(lng: number, lat: number): LocationCoordinates {
  return {
    coordinates: [lng, lat]
  };
}

/**
 * Convert coordinates to lat/lng object
 */
export function toLatLngObject(lng: number, lat: number): Coordinates {
  return {
    latitude: lat,
    longitude: lng
  };
}

/**
 * Validate coordinates are within valid ranges
 */
export function validateCoordinates(lng: number, lat: number): boolean {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90 &&
    !isNaN(lng) &&
    !isNaN(lat)
  );
}

/**
 * Parse coordinate string (e.g., "35.6595,139.7006") to [lng, lat] array
 */
export function parseCoordinateString(coordString: string): [number, number] | null {
  if (!coordString || typeof coordString !== 'string') return null;
  
  const parts = coordString.split(',').map(p => p.trim());
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (validateCoordinates(lng, lat)) {
    return [lng, lat];
  }
  
  // Try reversed order (lng,lat)
  const lngFirst = parseFloat(parts[0]);
  const latFirst = parseFloat(parts[1]);
  
  if (validateCoordinates(lngFirst, latFirst)) {
    return [lngFirst, latFirst];
  }
  
  return null;
}