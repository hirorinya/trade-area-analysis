#!/usr/bin/env node

/**
 * Local Batch Script for e-Stat Population Data Collection
 * Fetches mesh data from e-Stat API and uploads to Supabase
 * 
 * Usage: node batch-population-data.js
 * 
 * Environment variables needed:
 * - VITE_ESTAT_API_KEY: e-Stat application ID
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous key
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  ESTAT_API_KEY: process.env.VITE_ESTAT_API_KEY || '51deb74ec10b1ac3af28d8cda3e88fdcce2d1c95',
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  
  // e-Stat API configuration
  ESTAT_BASE_URL: 'https://api.e-stat.go.jp/rest/3.0/app',
  CENSUS_TABLE_ID: 'C0020050213000', // 2020 census mesh data
  
  // Processing configuration
  BATCH_SIZE: 50, // Mesh codes per API request
  REQUEST_DELAY: 1000, // Delay between API requests (ms)
  MAX_RETRIES: 3,
  
  // Coverage area (Japan bounds)
  JAPAN_BOUNDS: {
    north: 45.6,    // Hokkaido
    south: 24.0,    // Okinawa
    east: 146.0,    // Easternmost islands
    west: 123.0     // Westernmost islands
  }
};

// Mesh code utilities
class MeshCodeUtil {
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

// Supabase client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }
  
  async request(method, table, data = null) {
    const url = `${this.url}/rest/v1/${table}`;
    const options = {
      method,
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : null;
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }
  
  async insertBatch(table, records) {
    return this.request('POST', table, records);
  }
  
  async upsertBatch(table, records) {
    return this.request('POST', `${table}?on_conflict=mesh_code`, records);
  }
}

// e-Stat API client
class EStatClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = CONFIG.ESTAT_BASE_URL;
  }
  
  async fetchMeshData(meshCodes, retryCount = 0) {
    const url = `${this.baseUrl}/getStatsData`;
    const params = new URLSearchParams({
      appId: this.apiKey,
      statsDataId: CONFIG.CENSUS_TABLE_ID,
      cdArea: meshCodes.join(','),
      cdCat01: '#A03503', // Total population
      lang: 'J',
      limit: '10000'
    });
    
    const fullUrl = `${url}?${params}`;
    
    return new Promise((resolve, reject) => {
      const req = https.get(fullUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            }
            
            const parsed = JSON.parse(data);
            
            // Check for API errors
            if (parsed.GET_STATS_DATA?.RESULT?.ERROR_MSG) {
              throw new Error(`e-Stat API error: ${parsed.GET_STATS_DATA.RESULT.ERROR_MSG}`);
            }
            
            resolve(parsed);
          } catch (error) {
            if (retryCount < CONFIG.MAX_RETRIES) {
              console.log(`Retrying request (${retryCount + 1}/${CONFIG.MAX_RETRIES})...`);
              setTimeout(() => {
                this.fetchMeshData(meshCodes, retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              }, CONFIG.REQUEST_DELAY * (retryCount + 1));
            } else {
              reject(error);
            }
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}

// Main batch processor
class PopulationBatchProcessor {
  constructor() {
    this.supabase = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    this.estatClient = new EStatClient(CONFIG.ESTAT_API_KEY);
    this.processedCount = 0;
    this.totalCount = 0;
  }
  
  // Generate mesh codes for specific bounds
  generateMeshCodes(bounds, meshLevel = 5) {
    const meshCodes = [];
    const meshSize = meshLevel === 3 ? 0.0125 : meshLevel === 4 ? 0.00625 : 0.003125;
    
    console.log(`Generating mesh codes for level ${meshLevel} (${meshSize}° grid)...`);
    
    for (let lat = bounds.south; lat < bounds.north; lat += meshSize) {
      for (let lng = bounds.west; lng < bounds.east; lng += meshSize) {
        const meshCode = MeshCodeUtil.latLngToMeshCode(lat, lng, meshLevel);
        meshCodes.push(meshCode);
      }
    }
    
    console.log(`Generated ${meshCodes.length} mesh codes`);
    return meshCodes;
  }
  
  // Process mesh codes in batches
  async processMeshBatches(meshCodes, meshLevel) {
    const batches = [];
    for (let i = 0; i < meshCodes.length; i += CONFIG.BATCH_SIZE) {
      batches.push(meshCodes.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    console.log(`Processing ${batches.length} batches of mesh codes...`);
    this.totalCount = batches.length;
    
    const allResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} mesh codes)...`);
      
      try {
        const apiResponse = await this.estatClient.fetchMeshData(batch);
        const meshResults = this.parseApiResponse(apiResponse, meshLevel);
        
        if (meshResults.length > 0) {
          allResults.push(...meshResults);
          console.log(`✅ Batch ${i + 1}: Got ${meshResults.length} population records`);
        } else {
          console.log(`⚠️ Batch ${i + 1}: No population data returned`);
        }
        
        this.processedCount++;
        
        // Delay between requests to be respectful to the API
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error.message);
        // Continue with next batch
      }
    }
    
    return allResults;
  }
  
  // Parse e-Stat API response
  parseApiResponse(response, meshLevel) {
    const results = [];
    
    if (response.GET_STATS_DATA && response.GET_STATS_DATA.STATISTICAL_DATA) {
      const dataInf = response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF;
      
      if (dataInf && dataInf.VALUE && Array.isArray(dataInf.VALUE)) {
        dataInf.VALUE.forEach(item => {
          if (item['@area'] && item.$) {
            const meshCode = item['@area'];
            const population = parseFloat(item.$) || 0;
            
            if (population > 0) {
              try {
                const center = MeshCodeUtil.meshCodeToLatLng(meshCode);
                results.push({
                  mesh_code: meshCode,
                  center_lat: center.lat,
                  center_lng: center.lng,
                  population: population,
                  mesh_level: meshLevel,
                  updated_at: new Date().toISOString()
                });
              } catch (meshError) {
                console.warn(`Invalid mesh code: ${meshCode}`);
              }
            }
          }
        });
      }
    }
    
    return results;
  }
  
  // Upload results to Supabase
  async uploadToSupabase(results) {
    if (results.length === 0) {
      console.log('No data to upload');
      return;
    }
    
    console.log(`Uploading ${results.length} records to Supabase...`);
    
    // Upload in batches to avoid request size limits
    const uploadBatchSize = 1000;
    const uploadBatches = [];
    
    for (let i = 0; i < results.length; i += uploadBatchSize) {
      uploadBatches.push(results.slice(i, i + uploadBatchSize));
    }
    
    let uploadedCount = 0;
    
    for (let i = 0; i < uploadBatches.length; i++) {
      const batch = uploadBatches[i];
      console.log(`Uploading batch ${i + 1}/${uploadBatches.length} (${batch.length} records)...`);
      
      try {
        await this.supabase.upsertBatch('population_mesh', batch);
        uploadedCount += batch.length;
        console.log(`✅ Uploaded batch ${i + 1}: ${batch.length} records`);
      } catch (error) {
        console.error(`❌ Upload batch ${i + 1} failed:`, error.message);
      }
    }
    
    console.log(`📊 Total uploaded: ${uploadedCount}/${results.length} records`);
  }
  
  // Main processing function
  async run(bounds = CONFIG.JAPAN_BOUNDS, meshLevel = 5) {
    console.log('🚀 Starting e-Stat population data batch process...');
    console.log(`📊 Coverage area: ${JSON.stringify(bounds)}`);
    console.log(`🗺️ Mesh level: ${meshLevel}`);
    console.log(`🔑 e-Stat API key: ${CONFIG.ESTAT_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`🗄️ Supabase URL: ${CONFIG.SUPABASE_URL ? '✅ SET' : '❌ NOT SET'}`);
    
    if (!CONFIG.ESTAT_API_KEY || !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    try {
      // Step 1: Generate mesh codes
      const meshCodes = this.generateMeshCodes(bounds, meshLevel);
      
      // Step 2: Fetch data from e-Stat API
      const results = await this.processMeshBatches(meshCodes, meshLevel);
      
      // Step 3: Upload to Supabase
      await this.uploadToSupabase(results);
      
      console.log('✅ Batch process completed successfully!');
      console.log(`📈 Summary: ${results.length} population records processed`);
      
    } catch (error) {
      console.error('❌ Batch process failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  console.log('🌸 e-Stat Population Data Batch Processor');
  console.log('=========================================');
  
  const processor = new PopulationBatchProcessor();
  
  // For testing, use a smaller area (Tokyo region)
  const tokyoBounds = {
    north: 36.0,   // North of Tokyo
    south: 35.5,   // South of Tokyo  
    east: 140.2,   // East of Tokyo
    west: 139.4    // West of Tokyo
  };
  
  try {
    // Start with mesh level 4 (500m) for faster processing
    await processor.run(tokyoBounds, 4);
  } catch (error) {
    console.error('Process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PopulationBatchProcessor, MeshCodeUtil };