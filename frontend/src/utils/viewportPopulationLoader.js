// Viewport-based population data loader
// Dynamically loads census data as you pan/zoom the map

/**
 * How viewport-based loading works:
 * 
 * 1. When map moves, we get the visible bounds
 * 2. Check which data we already have loaded
 * 3. Fetch only the NEW areas from database
 * 4. Keep a cache of loaded areas
 * 5. Remove far-away data to save memory
 */

class ViewportPopulationLoader {
  constructor() {
    // Cache of loaded mesh data by region
    this.loadedRegions = new Map(); // key: "lat1,lng1,lat2,lng2", value: mesh data
    this.allMeshData = new Map(); // key: mesh_code, value: mesh object
    this.maxCacheSize = 100000; // Max meshes to keep in memory
    this.loadBuffer = 0.2; // Load 20% extra around viewport
  }

  /**
   * Main function called when map moves
   * @param {Object} bounds - Current map bounds {north, south, east, west}
   * @param {number} zoom - Current zoom level
   * @returns {Array} Mesh data for current viewport
   */
  async loadForViewport(bounds, zoom) {
    console.log('🗺️ Viewport changed:', {
      north: bounds.north.toFixed(2),
      south: bounds.south.toFixed(2),
      east: bounds.east.toFixed(2),
      west: bounds.west.toFixed(2),
      zoom
    });

    // 1. Expand bounds by buffer to preload nearby areas
    const bufferedBounds = this.expandBounds(bounds, this.loadBuffer);
    
    // 2. Check what we need to load
    const regionsToLoad = this.getRegionsToLoad(bufferedBounds);
    
    if (regionsToLoad.length > 0) {
      console.log(`📍 Need to load ${regionsToLoad.length} new regions`);
      
      // 3. Load new regions from database
      for (const region of regionsToLoad) {
        await this.loadRegion(region);
      }
    }
    
    // 4. Get visible meshes from cache
    const visibleMeshes = this.getVisibleMeshes(bounds);
    
    // 5. Clean up far-away data if cache is too large
    if (this.allMeshData.size > this.maxCacheSize) {
      this.cleanupDistantData(bounds);
    }
    
    console.log(`👁️ Showing ${visibleMeshes.length} meshes in viewport (${this.allMeshData.size} total cached)`);
    
    return visibleMeshes;
  }

  /**
   * Load a specific region from database
   */
  async loadRegion(region) {
    const startTime = Date.now();
    console.log(`🔄 Loading region: ${this.regionKey(region)}`);
    
    try {
      // Import the existing population API
      const { fetchRealPopulationData } = await import('./populationDataAPI.js');
      
      // Fetch data for this region
      const meshData = await fetchRealPopulationData(region, 4); // Use 500m mesh
      
      if (meshData && meshData.length > 0) {
        // Store in cache
        this.loadedRegions.set(this.regionKey(region), true);
        
        // Add to main data store
        meshData.forEach(mesh => {
          this.allMeshData.set(mesh.meshCode, mesh);
        });
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ Loaded ${meshData.length} meshes in ${loadTime}ms`);
      }
    } catch (error) {
      console.error('❌ Failed to load region:', error);
    }
  }

  /**
   * Determine which regions need to be loaded
   */
  getRegionsToLoad(bounds) {
    const regions = [];
    const tileSize = 0.5; // Load in 0.5 degree tiles
    
    // Divide viewport into tiles
    for (let lat = Math.floor(bounds.south); lat <= Math.ceil(bounds.north); lat += tileSize) {
      for (let lng = Math.floor(bounds.west); lng <= Math.ceil(bounds.east); lng += tileSize) {
        const region = {
          north: Math.min(lat + tileSize, bounds.north),
          south: Math.max(lat, bounds.south),
          east: Math.min(lng + tileSize, bounds.east),
          west: Math.max(lng, bounds.west)
        };
        
        const key = this.regionKey(region);
        if (!this.loadedRegions.has(key)) {
          regions.push(region);
        }
      }
    }
    
    return regions;
  }

  /**
   * Get meshes visible in current viewport
   */
  getVisibleMeshes(bounds) {
    const visible = [];
    
    this.allMeshData.forEach(mesh => {
      if (mesh.center.lat >= bounds.south && 
          mesh.center.lat <= bounds.north &&
          mesh.center.lng >= bounds.west && 
          mesh.center.lng <= bounds.east) {
        visible.push(mesh);
      }
    });
    
    return visible;
  }

  /**
   * Remove data far from current viewport to save memory
   */
  cleanupDistantData(currentBounds) {
    const keepDistance = 2.0; // Keep data within 2 degrees
    let removed = 0;
    
    this.allMeshData.forEach((mesh, code) => {
      const distance = this.distanceFromBounds(mesh.center, currentBounds);
      if (distance > keepDistance) {
        this.allMeshData.delete(code);
        removed++;
      }
    });
    
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} distant meshes`);
      // Also clean up region cache
      this.loadedRegions.clear();
    }
  }

  /**
   * Helper functions
   */
  expandBounds(bounds, buffer) {
    const latBuffer = (bounds.north - bounds.south) * buffer;
    const lngBuffer = (bounds.east - bounds.west) * buffer;
    
    return {
      north: bounds.north + latBuffer,
      south: bounds.south - latBuffer,
      east: bounds.east + lngBuffer,
      west: bounds.west - lngBuffer
    };
  }

  regionKey(region) {
    return `${region.south.toFixed(2)},${region.west.toFixed(2)},${region.north.toFixed(2)},${region.east.toFixed(2)}`;
  }

  distanceFromBounds(point, bounds) {
    const latDistance = point.lat < bounds.south ? bounds.south - point.lat :
                       point.lat > bounds.north ? point.lat - bounds.north : 0;
    const lngDistance = point.lng < bounds.west ? bounds.west - point.lng :
                       point.lng > bounds.east ? point.lng - bounds.east : 0;
    return Math.max(latDistance, lngDistance);
  }
}

/**
 * Example usage when scrolling from Hokkaido to Okinawa:
 * 
 * 1. Start in Hokkaido (43°N, 141°E)
 *    - Loads ~5,000 meshes for Hokkaido area
 *    - Cache: 5,000 meshes
 * 
 * 2. Pan south to Tohoku (39°N, 140°E)
 *    - Loads ~3,000 new meshes for Tohoku
 *    - Keeps Hokkaido data in cache
 *    - Cache: 8,000 meshes
 * 
 * 3. Continue to Tokyo (35°N, 139°E)
 *    - Loads ~7,000 new meshes for Kanto
 *    - Cache: 15,000 meshes
 * 
 * 4. Pan to Osaka (34°N, 135°E)
 *    - Loads ~4,000 new meshes for Kansai
 *    - Hokkaido data still in cache
 *    - Cache: 19,000 meshes
 * 
 * 5. Jump to Okinawa (26°N, 127°E)
 *    - Loads ~1,000 meshes for Okinawa
 *    - Triggers cleanup: removes Hokkaido data (too far)
 *    - Cache: ~15,000 meshes (removed distant data)
 * 
 * Benefits:
 * - Fast initial load (only visible area)
 * - Smooth panning (preloads nearby areas)
 * - Memory efficient (cleans up distant data)
 * - Works with slow connections
 * - Can handle millions of points total
 */

export default ViewportPopulationLoader;