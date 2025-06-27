#!/usr/bin/env node

/**
 * Load all census batch files into Supabase automatically
 * Since batch 1 is already loaded, we'll start from batch 2
 */

const https = require('https');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = 'https://vjbhwtwxjhyufvjrnhyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww';

class BatchLoader {
  constructor() {
    this.successCount = 0;
    this.failedBatches = [];
  }

  async executeSql(sql) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      // Use the SQL query endpoint
      const url = `${SUPABASE_URL}/rest/v1/rpc/query`;
      
      // Wrap SQL in a function call
      const body = JSON.stringify({
        query: sql
      });

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(body);
      req.end();
    });
  }

  async loadBatchFile(filename) {
    console.log(`📄 Loading ${filename}...`);
    
    try {
      // Read the SQL file
      const sql = fs.readFileSync(filename, 'utf-8');
      
      // Since we can't execute SQL directly via API with RLS disabled,
      // let's parse the records and use the REST API
      const records = this.parseRecordsFromSQL(sql);
      
      if (records.length === 0) {
        console.log(`   ⚠️ No records found in ${filename}`);
        return false;
      }
      
      // Use REST API to insert
      const result = await this.insertRecords(records);
      
      if (result.success) {
        console.log(`   ✅ ${filename} loaded successfully (${records.length} records)`);
        this.successCount++;
        return true;
      } else {
        console.log(`   ❌ ${filename} failed: ${result.error}`);
        this.failedBatches.push(filename);
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ Error reading ${filename}: ${error.message}`);
      this.failedBatches.push(filename);
      return false;
    }
  }

  parseRecordsFromSQL(sql) {
    const records = [];
    const recordRegex = /\('([^']+)',\s*([\d.-]+),\s*([\d.-]+),\s*(\d+),\s*(\d+),\s*NOW\(\)\)[,;]/g;
    let match;
    
    while ((match = recordRegex.exec(sql)) !== null) {
      records.push({
        mesh_code: match[1],
        center_lat: parseFloat(match[2]),
        center_lng: parseFloat(match[3]),
        population: parseInt(match[4]),
        mesh_level: parseInt(match[5]),
        updated_at: new Date().toISOString()
      });
    }
    
    return records;
  }

  async insertRecords(records) {
    const url = `${SUPABASE_URL}/rest/v1/population_mesh?on_conflict=mesh_code`;
    
    return new Promise((resolve) => {
      const options = {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(JSON.stringify(records));
      req.end();
    });
  }

  async run() {
    console.log('🌸 Loading All Census Batches');
    console.log('==============================\n');
    
    // Get all batch files (starting from 02 since 01 is done)
    const batchFiles = [];
    for (let i = 2; i <= 33; i++) {
      const filename = `census-batch-${String(i).padStart(2, '0')}.sql`;
      if (fs.existsSync(filename)) {
        batchFiles.push(filename);
      }
    }
    
    console.log(`📦 Found ${batchFiles.length} batch files to load\n`);
    
    // Check if RLS is still an issue
    console.log('⚠️  Note: This script uses the REST API which may be blocked by RLS.');
    console.log('📋 If all batches fail, you need to:');
    console.log('   1. Manually disable RLS in Supabase dashboard');
    console.log('   2. Or create a Supabase Edge Function to load data');
    console.log('   3. Or load each SQL file manually in SQL Editor\n');
    
    // Process each batch
    for (const file of batchFiles) {
      await this.loadBatchFile(file);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n📊 Loading Complete!');
    console.log(`✅ Successfully loaded: ${this.successCount} batches`);
    
    if (this.failedBatches.length > 0) {
      console.log(`❌ Failed batches: ${this.failedBatches.length}`);
      console.log(`   ${this.failedBatches.join(', ')}`);
    }
    
    if (this.successCount === 0 && this.failedBatches.length > 0) {
      console.log('\n💡 All batches failed due to RLS. Options:');
      console.log('   1. Copy each census-batch-XX.sql file manually to SQL Editor');
      console.log('   2. Create a simple web page to load them one by one');
      console.log('   3. Use Supabase Edge Functions with service role');
    }
  }
}

// Create alternative: combine all batches into one file
async function createCombinedFile() {
  console.log('📋 Creating combined SQL file as alternative...\n');
  
  let combinedSQL = `-- Combined Census Data (All Batches)
-- This file contains all remaining census records
-- If this is too large for SQL Editor, use the individual batch files

-- Temporarily disable RLS
ALTER TABLE population_mesh DISABLE ROW LEVEL SECURITY;

-- Insert all remaining data
INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level, updated_at) VALUES
`;
  
  const values = [];
  
  // Read all batch files from 02 to 33
  for (let i = 2; i <= 33; i++) {
    const filename = `census-batch-${String(i).padStart(2, '0')}.sql`;
    
    if (fs.existsSync(filename)) {
      const sql = fs.readFileSync(filename, 'utf-8');
      const recordRegex = /\('([^']+)',\s*([\d.-]+),\s*([\d.-]+),\s*(\d+),\s*(\d+),\s*NOW\(\)\)[,;]/g;
      let match;
      
      while ((match = recordRegex.exec(sql)) !== null) {
        values.push(match[0].replace(/[,;]$/, ''));
      }
    }
  }
  
  // Join all values
  combinedSQL += values.join(',\n') + ';';
  
  combinedSQL += `

-- Re-enable RLS
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Check final count
SELECT COUNT(*) as total_records FROM population_mesh;
`;
  
  fs.writeFileSync('census-all-remaining.sql', combinedSQL);
  console.log(`✅ Created census-all-remaining.sql with ${values.length} records`);
  console.log('   Try this file if it fits within SQL Editor limits\n');
}

// Main execution
async function main() {
  // First try API loading
  const loader = new BatchLoader();
  await loader.run();
  
  // Also create combined file as backup
  await createCombinedFile();
  
  console.log('\n📋 Manual Loading Instructions:');
  console.log('Since API loading may fail due to RLS, you can:');
  console.log('1. Go to Supabase SQL Editor');
  console.log('2. Run each census-batch-XX.sql file (02 through 33)');
  console.log('3. Or try census-all-remaining.sql if it fits');
}

if (require.main === module) {
  main();
}

module.exports = { BatchLoader };