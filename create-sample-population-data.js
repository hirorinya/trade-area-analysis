#!/usr/bin/env node

/**
 * Create sample population data for testing
 * Since e-Stat mesh data is not readily accessible, this creates realistic
 * sample data based on Tokyo population patterns
 */

const https = require('https');

// Supabase configuration
const SUPABASE_URL = 'https://vjbhwtwxjhyufvjrnhyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww';

// Tokyo bounds
const TOKYO_BOUNDS = {
  north: 36.0,
  south: 35.5, 
  east: 140.2,
  west: 139.4
};

// Mesh code utilities (simplified)
class MeshCodeUtil {
  static latLngToMeshCode(lat, lng, level = 4) {
    // Simplified mesh code generation for level 4 (500m)
    const p = Math.floor(lat * 1.5);
    const u = Math.floor(lng - 100);
    const q = Math.floor((lat * 1.5 - p) * 8);
    const v = Math.floor((lng - 100 - u) * 8);
    const r = Math.floor((lat * 1.5 - p - q / 8) * 80);
    const w = Math.floor((lng - 100 - u - v / 8) * 80);
    const m4 = Math.floor((lat * 1.5 - p - q / 8 - r / 80) * 160) + 
               Math.floor((lng - 100 - u - v / 8 - w / 80) * 160) * 2 + 1;
    
    return `${p}${u}${q}${v}${r}${w}${m4}`;
  }
}

// Generate realistic population data for Tokyo
function generateTokyoPopulationData() {
  console.log('🏙️ Generating realistic Tokyo population data...');
  
  const meshSize = 0.00625; // 500m meshes (level 4)
  const populationData = [];
  
  // Define population density zones
  const zones = [
    // Central Tokyo (high density)
    { center: [35.6762, 139.6503], radius: 0.05, baseDensity: 15000 }, // Shibuya
    { center: [35.6804, 139.7690], radius: 0.03, baseDensity: 12000 }, // Tokyo Station
    { center: [35.7090, 139.7330], radius: 0.04, baseDensity: 13000 }, // Ikebukuro
    { center: [35.6586, 139.7454], radius: 0.04, baseDensity: 14000 }, // Ginza
    
    // Residential areas (medium density)
    { center: [35.6980, 139.5530], radius: 0.08, baseDensity: 8000 },  // Mitaka
    { center: [35.7219, 139.8330], radius: 0.06, baseDensity: 9000 },  // Sumida
    { center: [35.6440, 139.6520], radius: 0.07, baseDensity: 7500 },  // Setagaya
    
    // Suburban areas (lower density)
    { center: [35.8250, 139.7000], radius: 0.1, baseDensity: 4000 },   // Saitama border
    { center: [35.5500, 139.7000], radius: 0.1, baseDensity: 3500 },   // South Tokyo
  ];
  
  let meshCount = 0;
  
  for (let lat = TOKYO_BOUNDS.south; lat < TOKYO_BOUNDS.north; lat += meshSize) {
    for (let lng = TOKYO_BOUNDS.west; lng < TOKYO_BOUNDS.east; lng += meshSize) {
      const centerLat = lat + meshSize / 2;
      const centerLng = lng + meshSize / 2;
      
      // Calculate population based on distance from density zones
      let population = 100; // Base population
      
      zones.forEach(zone => {
        const distance = Math.sqrt(
          Math.pow(centerLat - zone.center[0], 2) + 
          Math.pow(centerLng - zone.center[1], 2)
        );
        
        if (distance < zone.radius) {
          // Population decreases with distance from zone center
          const influence = Math.max(0, 1 - (distance / zone.radius));
          population += zone.baseDensity * influence;
        }
      });
      
      // Add some randomness
      population = Math.floor(population * (0.7 + Math.random() * 0.6));
      
      // Skip very low population areas (water, parks, etc.)
      if (population < 50) {
        if (Math.random() > 0.3) continue; // 70% chance to skip
      }
      
      const meshCode = MeshCodeUtil.latLngToMeshCode(centerLat, centerLng, 4);
      
      populationData.push({
        mesh_code: meshCode,
        center_lat: centerLat,
        center_lng: centerLng,
        population: population,
        mesh_level: 4,
        updated_at: new Date().toISOString()
      });
      
      meshCount++;
    }
  }
  
  console.log(`✅ Generated ${populationData.length} mesh population records`);
  console.log(`📊 Population range: ${Math.min(...populationData.map(p => p.population))} - ${Math.max(...populationData.map(p => p.population))}`);
  console.log(`📊 Average population: ${Math.round(populationData.reduce((sum, p) => sum + p.population, 0) / populationData.length)}`);
  
  return populationData;
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
  
  async upsertBatch(table, records) {
    return this.request('POST', `${table}?on_conflict=mesh_code`, records);
  }
}

// Upload data to Supabase
async function uploadToSupabase(populationData) {
  console.log('\n📤 Uploading data to Supabase...');
  
  const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Upload in batches to avoid request size limits
  const batchSize = 1000;
  const batches = [];
  
  for (let i = 0; i < populationData.length; i += batchSize) {
    batches.push(populationData.slice(i, i + batchSize));
  }
  
  console.log(`📦 Uploading ${batches.length} batches...`);
  
  let uploadedCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} records)...`);
    
    try {
      await supabase.upsertBatch('population_mesh', batch);
      uploadedCount += batch.length;
      console.log(`✅ Uploaded batch ${i + 1}: ${batch.length} records`);
    } catch (error) {
      console.error(`❌ Upload batch ${i + 1} failed:`, error.message);
    }
    
    // Small delay between uploads
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n🎉 Upload complete! ${uploadedCount}/${populationData.length} records uploaded`);
}

async function main() {
  console.log('🌸 Tokyo Population Data Generator');
  console.log('==================================\n');
  
  try {
    // Generate realistic population data
    const populationData = generateTokyoPopulationData();
    
    // Upload to Supabase
    await uploadToSupabase(populationData);
    
    console.log('\n✅ Sample population data created successfully!');
    console.log('🗺️ Your trade area analysis app now has realistic Tokyo population data');
    console.log('📊 You can test the population mapping feature in the app');
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  }
}

main();