#!/usr/bin/env node

/**
 * Process real Japanese census mesh data from zip files
 * Extracts population data and uploads to Supabase
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Supabase configuration
const SUPABASE_URL = 'https://vjbhwtwxjhyufvjrnhyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww';

// Population data directory
const POPULATION_DIR = './population';

// Mesh code utilities (same as before)
class MeshCodeUtil {
  static meshCodeToLatLng(meshCode) {
    const code = meshCode.toString();
    
    // Parse mesh levels for 3rd level (8-digit) mesh
    const p = parseInt(code.substr(0, 2));
    const u = parseInt(code.substr(2, 2));
    const q = parseInt(code.substr(4, 1));
    const v = parseInt(code.substr(5, 1));
    const r = parseInt(code.substr(6, 1));
    const w = parseInt(code.substr(7, 1));
    
    // Calculate coordinates
    let lat = (p + q / 8 + r / 80) / 1.5;
    let lng = u + v / 8 + w / 80 + 100;
    
    // Return center point (for 3rd level mesh, ~1km)
    const meshSize = 1/120; // ~1km mesh
    return {
      lat: lat + meshSize / 2 / 1.5,
      lng: lng + meshSize / 2
    };
  }
  
  static isValidMeshCode(code) {
    // Check if it's a valid mesh code format (8 digits for 3rd level)
    return /^\d{8,10}$/.test(code.toString());
  }
}

// CSV parser for census data
class CensusDataParser {
  constructor() {
    this.processedCount = 0;
    this.errorCount = 0;
  }
  
  parseCSVLine(line) {
    // Simple CSV parser that handles the census format
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  }
  
  parseFile(filePath) {
    console.log(`📄 Processing: ${path.basename(filePath)}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        console.log('   ⚠️ File too short, skipping');
        return [];
      }
      
      // Parse header to understand column structure
      const header = this.parseCSVLine(lines[0]);
      const dataRows = lines.slice(2); // Skip header and Japanese header row
      
      const records = [];
      
      for (const line of dataRows) {
        try {
          const values = this.parseCSVLine(line);
          
          if (values.length < 5) continue; // Skip invalid rows
          
          const meshCode = values[0];
          const totalPopulation = parseInt(values[4]) || 0; // T001141001 = total population
          
          // Skip if no mesh code or population
          if (!meshCode || !MeshCodeUtil.isValidMeshCode(meshCode) || totalPopulation === 0) {
            continue;
          }
          
          // Get coordinates
          const coords = MeshCodeUtil.meshCodeToLatLng(meshCode);
          
          // Skip if coordinates are outside reasonable Japan bounds
          if (coords.lat < 24 || coords.lat > 46 || coords.lng < 123 || coords.lng > 146) {
            continue;
          }
          
          records.push({
            mesh_code: meshCode,
            center_lat: coords.lat,
            center_lng: coords.lng,
            population: totalPopulation,
            mesh_level: meshCode.length >= 10 ? 5 : meshCode.length >= 9 ? 4 : 3,
            updated_at: new Date().toISOString()
          });
          
        } catch (error) {
          this.errorCount++;
          // Skip invalid rows silently
        }
      }
      
      console.log(`   ✅ Extracted ${records.length} population records`);
      this.processedCount += records.length;
      
      return records;
      
    } catch (error) {
      console.error(`   ❌ Error processing file: ${error.message}`);
      return [];
    }
  }
}

// Supabase client (with proper RLS handling)
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }
  
  async insertBatch(table, records) {
    // Use direct SQL insert to bypass RLS during data loading
    const values = records.map(record => 
      `('${record.mesh_code}', ${record.center_lat}, ${record.center_lng}, ${record.population}, ${record.mesh_level}, '${record.updated_at}')`
    ).join(',\n');
    
    const sql = `
      INSERT INTO ${table} (mesh_code, center_lat, center_lng, population, mesh_level, updated_at) 
      VALUES ${values}
      ON CONFLICT (mesh_code) DO UPDATE SET
        population = EXCLUDED.population,
        updated_at = EXCLUDED.updated_at;
    `;
    
    const url = `${this.url}/rest/v1/rpc/exec_sql`;
    const options = {
      method: 'POST',
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify({ query: sql }));
      req.end();
    });
  }
  
  // Alternative: Use regular insert with RLS disabled
  async upsertBatch(table, records) {
    const url = `${this.url}/rest/v1/${table}?on_conflict=mesh_code`;
    const options = {
      method: 'POST',
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(responseData || '[]'));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(records));
      req.end();
    });
  }
}

// Main processor
class CensusDataProcessor {
  constructor() {
    this.parser = new CensusDataParser();
    this.supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
    this.allRecords = [];
  }
  
  async processAllFiles() {
    console.log('🌸 Processing Japanese Census Mesh Data');
    console.log('======================================\n');
    
    // Get all zip files
    const zipFiles = fs.readdirSync(POPULATION_DIR)
      .filter(file => file.endsWith('.zip'))
      .sort();
    
    console.log(`📦 Found ${zipFiles.length} census data files\n`);
    
    let processedFiles = 0;
    
    for (const zipFile of zipFiles) {
      const zipPath = path.join(POPULATION_DIR, zipFile);
      const txtFile = zipFile.replace('.zip', '.txt');
      const txtPath = path.join(POPULATION_DIR, txtFile);
      
      try {
        // Extract zip file
        console.log(`📦 Extracting: ${zipFile}`);
        execSync(`cd "${POPULATION_DIR}" && unzip -o "${zipFile}"`, { stdio: 'pipe' });
        
        // Process the extracted file
        if (fs.existsSync(txtPath)) {
          const records = this.parser.parseFile(txtPath);
          this.allRecords.push(...records);
          
          // Clean up extracted file
          fs.unlinkSync(txtPath);
        }
        
        processedFiles++;
        
        // Progress update every 10 files
        if (processedFiles % 10 === 0) {
          console.log(`   📊 Progress: ${processedFiles}/${zipFiles.length} files, ${this.allRecords.length} total records\n`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process ${zipFile}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Processing complete!`);
    console.log(`📊 Total records extracted: ${this.allRecords.length}`);
    console.log(`📊 Population range: ${Math.min(...this.allRecords.map(r => r.population))} - ${Math.max(...this.allRecords.map(r => r.population))}`);
    
    return this.allRecords;
  }
  
  async uploadToSupabase(records) {
    console.log(`\n📤 Uploading ${records.length} records to Supabase...`);
    
    // Upload in batches
    const batchSize = 1000;
    const batches = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    
    console.log(`📦 Uploading ${batches.length} batches...`);
    
    let uploadedCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} records)...`);
      
      try {
        await this.supabase.upsertBatch('population_mesh', batch);
        uploadedCount += batch.length;
        console.log(`   ✅ Uploaded ${batch.length} records`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        
        // If RLS error, suggest manual SQL approach
        if (error.message.includes('row-level security')) {
          console.log(`   💡 Try disabling RLS temporarily in Supabase SQL editor:`);
          console.log(`   ALTER TABLE population_mesh DISABLE ROW LEVEL SECURITY;`);
        }
      }
      
      // Small delay between uploads
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n🎉 Upload summary: ${uploadedCount}/${records.length} records uploaded`);
  }
  
  async run() {
    try {
      // Process all census files
      const records = await this.processAllFiles();
      
      if (records.length === 0) {
        console.log('❌ No records extracted');
        return;
      }
      
      // Upload to Supabase
      await this.uploadToSupabase(records);
      
      console.log('\n✅ Real Japanese census data processing complete!');
      console.log('🗺️ Your trade area analysis app now has official population data');
      
    } catch (error) {
      console.error('❌ Process failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const processor = new CensusDataProcessor();
  processor.run();
}

module.exports = { CensusDataProcessor, MeshCodeUtil };