// Real Population Data API Integration
// Supports multiple data sources for Japanese population data

/**
 * Fetches real population data from available APIs
 * Currently supports:
 * 1. Statistics Dashboard API (no key required)
 * 2. e-Stat API (requires registration)
 * 3. Local cache/fallback data
 */

// API Configuration
const API_CONFIG = {
  STAT_DASHBOARD: {
    baseUrl: 'https://dashboard.e-stat.go.jp/api/1.0',
    format: 'json',
    indicatorCode: '0201010010000020010' // Population density indicator
  },
  E_STAT: {
    baseUrl: 'https://api.e-stat.go.jp/rest/3.0/app',
    format: 'json',
    // Application ID can be set via environment variable
    appId: import.meta.env.VITE_ESTAT_API_KEY || null,
    // Census data table IDs
    censusTableIds: {
      2020: 'C0020050213000', // 2020 census mesh data
      2015: 'C0020050112000', // 2015 census mesh data
    }
  }
};

// Mesh code utilities
export class MeshCodeUtil {
  /**
   * Converts lat/lng to Japanese mesh code
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} level - Mesh level (3=1km, 4=500m, 5=250m)
   * @returns {string} Mesh code
   */
  static latLngToMeshCode(lat, lng, level = 5) {
    // 1st mesh (about 80km)
    const p = Math.floor(lat * 1.5);
    const u = Math.floor(lng - 100);
    
    // 2nd mesh (about 10km)
    const q = Math.floor((lat * 1.5 - p) * 8);
    const v = Math.floor((lng - 100 - u) * 8);
    
    // 3rd mesh (about 1km)
    const r = Math.floor((lat * 1.5 - p - q / 8) * 80);
    const w = Math.floor((lng - 100 - u - v / 8) * 80);
    
    if (level === 3) {
      return `${p}${u}${q}${v}${r}${w}`;
    }
    
    // 4th mesh (about 500m)
    const m4 = Math.floor((lat * 1.5 - p - q / 8 - r / 80) * 160) + 
               Math.floor((lng - 100 - u - v / 8 - w / 80) * 160) * 2 + 1;
    
    if (level === 4) {
      return `${p}${u}${q}${v}${r}${w}${m4}`;
    }
    
    // 5th mesh (about 250m)
    const m5lat = Math.floor((lat * 1.5 - p - q / 8 - r / 80) * 160) % 2;
    const m5lng = Math.floor((lng - 100 - u - v / 8 - w / 80) * 160) % 2;
    const m5 = m5lat + m5lng * 2 + 1;
    
    return `${p}${u}${q}${v}${r}${w}${m4}${m5}`;
  }
  
  /**
   * Converts mesh code to center lat/lng
   * @param {string} meshCode - Japanese mesh code
   * @returns {Object} {lat, lng}
   */
  static meshCodeToLatLng(meshCode) {
    const code = meshCode.toString();
    
    // Parse mesh levels
    const p = parseInt(code.substr(0, 2));
    const u = parseInt(code.substr(2, 2));
    const q = parseInt(code.substr(4, 1));
    const v = parseInt(code.substr(5, 1));
    const r = parseInt(code.substr(6, 1));
    const w = parseInt(code.substr(7, 1));
    
    // Calculate base coordinates
    let lat = (p + q / 8 + r / 80) / 1.5;
    let lng = u + v / 8 + w / 80 + 100;
    
    // Handle 4th and 5th mesh if present
    if (code.length >= 9) {
      const m4 = parseInt(code.substr(8, 1));
      const m4lat = (m4 - 1) % 2;
      const m4lng = Math.floor((m4 - 1) / 2);
      lat += m4lat / 160 / 1.5;
      lng += m4lng / 160;
      
      if (code.length >= 10) {
        const m5 = parseInt(code.substr(9, 1));
        const m5lat = (m5 - 1) % 2;
        const m5lng = Math.floor((m5 - 1) / 2);
        lat += m5lat / 320 / 1.5;
        lng += m5lng / 320;
      }
    }
    
    // Return center point
    const meshSize = code.length === 8 ? 1/120 : code.length === 9 ? 1/240 : 1/480;
    return {
      lat: lat + meshSize / 2 / 1.5,
      lng: lng + meshSize / 2
    };
  }
}

/**
 * Simple memory cache for database queries
 * No failure tracking needed since we query Supabase database
 */
class PopulationDataCache {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 1800000; // 30 minutes for database queries
  }
  
  getCacheKey(bounds, meshLevel) {
    return `${bounds.north},${bounds.south},${bounds.east},${bounds.west},${meshLevel}`;
  }
  
  get(bounds, meshLevel) {
    const key = this.getCacheKey(bounds, meshLevel);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(bounds, meshLevel, data) {
    const key = this.getCacheKey(bounds, meshLevel);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  // Clear cache when needed
  clear() {
    this.cache.clear();
  }
}

const populationCache = new PopulationDataCache();

/**
 * Fetches population data from Statistics Dashboard API with retry logic
 * @param {Object} bounds - Geographic bounds
 * @param {number} meshLevel - Mesh level (3, 4, or 5)
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Array>} Array of population data by mesh
 */
export async function fetchStatDashboardData(bounds, meshLevel = 5, retryCount = 0) {
  const maxRetries = 3;
  const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
  
  try {
    // Check cache first
    const cached = populationCache.get(bounds, meshLevel);
    if (cached) {
      console.log('Using cached Statistics Dashboard data');
      return cached;
    }
    
    // Validate bounds for reasonable size
    const boundsArea = (bounds.north - bounds.south) * (bounds.east - bounds.west);
    if (boundsArea > 1.0) { // Limit to ~110km x 110km area
      console.warn('Bounds too large for detailed mesh data, using coarser resolution');
      meshLevel = Math.max(3, meshLevel - 1);
    }
    
    // Calculate mesh codes for the bounds
    const meshCodes = [];
    const meshSize = meshLevel === 3 ? 0.0125 : meshLevel === 4 ? 0.00625 : 0.003125;
    
    for (let lat = bounds.south; lat < bounds.north; lat += meshSize) {
      for (let lng = bounds.west; lng < bounds.east; lng += meshSize) {
        const meshCode = MeshCodeUtil.latLngToMeshCode(lat, lng, meshLevel);
        meshCodes.push(meshCode);
      }
    }
    
    // Limit mesh codes to prevent API overload
    if (meshCodes.length > 1000) {
      console.warn(`Too many mesh codes (${meshCodes.length}), sampling to 1000`);
      const step = Math.ceil(meshCodes.length / 1000);
      meshCodes.splice(0, meshCodes.length, ...meshCodes.filter((_, i) => i % step === 0));
    }
    
    console.log(`Fetching Statistics Dashboard data for ${meshCodes.length} mesh codes (attempt ${retryCount + 1})`);
    
    // Build API request
    const params = new URLSearchParams({
      IndicatorCode: API_CONFIG.STAT_DASHBOARD.indicatorCode,
      Time: '2020', // Latest census year
      RegionalRank: meshLevel.toString(),
      IsSeasonalAdjustment: 'false',
      MetaGetFlg: 'N',
      SectionHeaderFlg: '1'
    });
    
    const url = `${API_CONFIG.STAT_DASHBOARD.baseUrl}/data?${params}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TradeAreaAnalysis/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }
    
    // Parse response and map to mesh structure
    const populationByMesh = new Map();
    
    if (data.GET_STATS && data.GET_STATS.STATISTICAL_DATA) {
      const values = data.GET_STATS.STATISTICAL_DATA.DATA_INF?.DATA_OBJ || [];
      
      if (Array.isArray(values)) {
        values.forEach(item => {
          if (item.VALUE && item.VALUE['@'] && item.VALUE['@'].regionCode) {
            const meshCode = item.VALUE['@'].regionCode;
            const population = parseFloat(item.VALUE.$) || 0;
            populationByMesh.set(meshCode, population);
          }
        });
      }
    }
    
    console.log(`Successfully parsed ${populationByMesh.size} mesh population values`);
    
    // Convert to array format
    const results = meshCodes.map(meshCode => {
      const center = MeshCodeUtil.meshCodeToLatLng(meshCode);
      return {
        meshCode,
        center,
        population: populationByMesh.get(meshCode) || 0
      };
    });
    
    // Only cache if we got meaningful data
    if (results.length > 0 && populationByMesh.size > 0) {
      populationCache.set(bounds, meshLevel, results);
    }
    
    return results;
    
  } catch (error) {
    console.error(`Statistics Dashboard API error (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < maxRetries && !error.name === 'AbortError') {
      console.log(`Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchStatDashboardData(bounds, meshLevel, retryCount + 1);
    }
    
    return null;
  }
}

/**
 * Fetches population data from e-Stat API with enhanced error handling
 * @param {Object} bounds - Geographic bounds
 * @param {number} meshLevel - Mesh level (3, 4, or 5)
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Array>} Array of population data by mesh
 */
export async function fetchEStatData(bounds, meshLevel = 5, retryCount = 0) {
  if (!API_CONFIG.E_STAT.appId) {
    console.warn('e-Stat API key not configured');
    return null;
  }
  
  const maxRetries = 3;
  const retryDelay = 1000 * Math.pow(2, retryCount);
  
  try {
    // Check cache first
    const cached = populationCache.get(bounds, meshLevel);
    if (cached) {
      console.log('Using cached e-Stat data');
      return cached;
    }
    
    // Validate bounds size
    const boundsArea = (bounds.north - bounds.south) * (bounds.east - bounds.west);
    if (boundsArea > 0.5) { // Limit to ~55km x 55km for e-Stat
      console.warn('Bounds too large for e-Stat API, using coarser resolution');
      meshLevel = Math.max(3, meshLevel - 1);
    }
    
    console.log(`Fetching e-Stat data with mesh level ${meshLevel} (attempt ${retryCount + 1})`);
    
    // Get mesh code batches to avoid URI too long errors
    const meshBatches = getMeshAreaCodeBatches(bounds, meshLevel, 50);
    const results = [];
    
    // Process each batch sequentially to avoid rate limiting
    for (let i = 0; i < meshBatches.length; i++) {
      const batch = meshBatches[i];
      console.log(`Processing batch ${i + 1}/${meshBatches.length} with ${batch.split(',').length} mesh codes`);
      
      // Build API request for this batch
      const params = new URLSearchParams({
        appId: API_CONFIG.E_STAT.appId,
        statsDataId: API_CONFIG.E_STAT.censusTableIds['2020'],
        cdArea: batch,
        cdCat01: '#A03503', // Total population
        lang: 'J',
        limit: '10000'
      });
      
      const url = `${API_CONFIG.E_STAT.baseUrl}/getStatsData?${params}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TradeAreaAnalysis/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`e-Stat batch ${i + 1} failed: ${response.status} ${response.statusText}`);
          continue; // Skip this batch and continue with next
        }
        
        const data = await response.json();
        
        // Check for API errors
        if (data.GET_STATS_DATA?.RESULT?.ERROR_MSG) {
          console.warn(`e-Stat batch ${i + 1} API error: ${data.GET_STATS_DATA.RESULT.ERROR_MSG}`);
          continue;
        }
        
        // Parse batch response
        if (data.GET_STATS_DATA && data.GET_STATS_DATA.STATISTICAL_DATA) {
          const dataInf = data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF;
          
          if (dataInf && dataInf.VALUE && Array.isArray(dataInf.VALUE)) {
            dataInf.VALUE.forEach(item => {
              if (item['@area'] && item.$) {
                const meshCode = item['@area'];
                const population = parseFloat(item.$) || 0;
                
                try {
                  const center = MeshCodeUtil.meshCodeToLatLng(meshCode);
                  results.push({
                    meshCode,
                    center,
                    population
                  });
                } catch (meshError) {
                  console.warn(`Invalid mesh code: ${meshCode}`, meshError);
                }
              }
            });
          }
        }
        
        // Add delay between requests to be respectful to the API
        if (i < meshBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (batchError) {
        console.warn(`e-Stat batch ${i + 1} failed:`, batchError.message);
        clearTimeout(timeoutId);
        continue; // Continue with next batch
      }
    }
    
    console.log(`Successfully fetched ${results.length} mesh data points from e-Stat`);
    
    // Only cache if we got meaningful data
    if (results.length > 0) {
      populationCache.set(bounds, meshLevel, results);
    }
    
    return results;
    
  } catch (error) {
    console.error(`e-Stat API error (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < maxRetries && error.name !== 'AbortError') {
      console.log(`Retrying e-Stat request in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchEStatData(bounds, meshLevel, retryCount + 1);
    }
    
    return null;
  }
}

/**
 * Helper function to get mesh area codes for e-Stat API
 * Returns array of batches to avoid URI too long errors
 */
function getMeshAreaCodeBatches(bounds, meshLevel, maxBatchSize = 50) {
  const meshCodes = [];
  const meshSize = meshLevel === 3 ? 0.0125 : meshLevel === 4 ? 0.00625 : 0.003125;
  
  for (let lat = bounds.south; lat < bounds.north; lat += meshSize) {
    for (let lng = bounds.west; lng < bounds.east; lng += meshSize) {
      const meshCode = MeshCodeUtil.latLngToMeshCode(lat, lng, meshLevel);
      meshCodes.push(meshCode);
    }
  }
  
  // Split into batches to avoid URI too long (414) errors
  const batches = [];
  for (let i = 0; i < meshCodes.length; i += maxBatchSize) {
    const batch = meshCodes.slice(i, i + maxBatchSize);
    batches.push(batch.join(','));
  }
  
  console.log(`Generated ${meshCodes.length} mesh codes in ${batches.length} batches`);
  return batches;
}

/**
 * Legacy function for backward compatibility
 */
function getMeshAreaCode(bounds, meshLevel) {
  const batches = getMeshAreaCodeBatches(bounds, meshLevel, 50);
  return batches[0] || ''; // Return first batch only
}

/**
 * Fetch population data from Supabase database
 * Uses pre-loaded mesh data from batch process
 * @param {Object} bounds - Geographic bounds
 * @param {number} meshLevel - Mesh level (3, 4, or 5)
 * @returns {Promise<Array>} Array of population data by mesh
 */
export async function fetchRealPopulationData(bounds, meshLevel = 5, onProgress = null) {
  // Validate bounds
  if (!bounds || typeof bounds !== 'object') {
    throw new Error('Invalid bounds provided');
  }
  
  if (bounds.north <= bounds.south || bounds.east <= bounds.west) {
    throw new Error('Invalid bounds coordinates');
  }
  
  // Check cache first
  const cached = populationCache.get(bounds, meshLevel);
  if (cached) {
    console.log('Using cached population data from database');
    if (onProgress) {
      onProgress({ loaded: cached.length, total: cached.length, percentage: 100, fromCache: true });
    }
    return cached;
  }
  
  try {
    // Import Supabase client
    const { supabase } = await import('../lib/supabase.js');
    
    console.log(`Fetching population data from database for mesh level ${meshLevel}`);
    
    // Use pagination to get ALL data (7,093 records total)
    const supabaseUrl = 'https://vjbhwtwxjhyufvjrnhyu.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww';
    
    const baseUrl = `${supabaseUrl}/rest/v1/population_mesh?` +
      `select=mesh_code,center_lat,center_lng,population,mesh_level&` +
      `mesh_level=eq.${meshLevel}&` +
      `center_lat=gte.${bounds.south}&` +
      `center_lat=lte.${bounds.north}&` +
      `center_lng=gte.${bounds.west}&` +
      `center_lng=lte.${bounds.east}&` +
      `population=gt.0&` +
      `order=mesh_code.asc`; // Order for consistent pagination
    
    const allData = [];
    let offset = 0;
    const pageSize = 10000; // Fetch 10,000 records per page for faster loading
    const totalExpected = 32173; // Known total for progress calculation
    
    console.log('🔄 Fetching all census data (32,173 records)...');
    
    while (true) {
      const response = await fetch(baseUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Range': `${offset}-${offset + pageSize - 1}`, // e.g., 0-999, 1000-1999, etc.
          'Prefer': 'return=representation'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const pageData = await response.json();
      
      if (!pageData || pageData.length === 0) {
        console.log(`📄 Page ${Math.floor(offset/pageSize) + 1}: No more data`);
        break; // No more data
      }
      
      allData.push(...pageData);
      
      // Calculate and show progress
      const progress = Math.min(100, Math.round((allData.length / totalExpected) * 100));
      const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
      
      console.log(`📊 Loading census data: [${progressBar}] ${progress}% (${allData.length.toLocaleString()}/${totalExpected.toLocaleString()} records)`);
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress({
          loaded: allData.length,
          total: totalExpected,
          percentage: progress
        });
      }
      
      // If we got less than a full page, we're done
      if (pageData.length < pageSize) {
        console.log(`✅ Census data loaded successfully! Total: ${allData.length.toLocaleString()} mesh cells`);
        if (onProgress) {
          onProgress({ loaded: allData.length, total: allData.length, percentage: 100 });
        }
        break;
      }
      
      offset += pageSize;
      
      // Safety check to prevent infinite loops
      if (offset > 40000) {
        console.warn('⚠️ Safety limit reached, stopping pagination');
        break;
      }
    }
    
    const data = allData;
    
    if (!data || data.length === 0) {
      console.log(`No population data found in database for bounds: Lat ${bounds.south.toFixed(2)}-${bounds.north.toFixed(2)}, Lng ${bounds.west.toFixed(2)}-${bounds.east.toFixed(2)}`);
      console.log('💡 This region may not be loaded yet. Current coverage: Tokyo area (35.3-36.2°N, 138.8-140.3°E)');
      return null; // Use fallback simulation
    }
    
    // Convert to expected format
    const results = data.map(row => ({
      meshCode: row.mesh_code,
      center: {
        lat: row.center_lat,
        lng: row.center_lng
      },
      population: row.population
    }));
    
    console.log(`Retrieved ${results.length} mesh data points from database`);
    
    // Cache the results
    populationCache.set(bounds, meshLevel, results);
    
    return results;
    
  } catch (error) {
    console.error('Error fetching population data from database:', error);
    return null; // Use fallback simulation
  }
}

/**
 * Sets the e-Stat API key for authenticated requests
 * @param {string} apiKey - e-Stat Application ID
 */
export function setEStatAPIKey(apiKey) {
  API_CONFIG.E_STAT.appId = apiKey;
}

/**
 * Future batch processing concept for server-side implementation
 * 
 * This approach would solve CORS restrictions by moving API calls to server-side:
 * 
 * 1. MONTHLY BATCH PROCESS:
 *    - Server-side cron job runs monthly
 *    - Fetches all mesh data for entire Japan from e-Stat API
 *    - Stores in database with spatial indexing
 *    - Updates only changed data
 * 
 * 2. CLIENT REQUEST FLOW:
 *    - Frontend sends bounds to backend API
 *    - Backend queries cached mesh data from database
 *    - Returns population data without CORS issues
 * 
 * 3. BENEFITS:
 *    - No CORS restrictions (server-to-server calls)
 *    - Fast client responses (database query vs API call)
 *    - Data freshness matches e-Stat update cycle
 *    - Reduced API rate limiting issues
 * 
 * 4. IMPLEMENTATION NOTES:
 *    - Use PostGIS for spatial queries
 *    - Implement spatial indexing for fast bounds queries
 *    - Add data versioning for tracking updates
 *    - Consider data compression for storage efficiency
 */
export function getBatchProcessingConcept() {
  return {
    schedule: 'monthly',
    source: 'e-Stat API',
    storage: 'PostGIS database',
    benefits: [
      'No CORS restrictions',
      'Fast client responses',
      'Matches data update cycle',
      'Reduced rate limiting'
    ]
  };
}