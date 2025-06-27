#!/usr/bin/env node

/**
 * Load census data directly to Supabase using the REST API
 * This bypasses the SQL Editor size limitations
 */

const https = require('https');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = 'https://vjbhwtwxjhyufvjrnhyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww';

// Service role key (if you have it) - provides full access
// const SUPABASE_SERVICE_KEY = 'your-service-role-key-here';

class SupabaseLoader {
  constructor() {
    this.totalLoaded = 0;
    this.failedBatches = [];
  }

  async makeRequest(endpoint, method, data) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal' // Don't return the inserted rows
        }
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  parseRecordsFromSQL() {
    console.log('📄 Reading SQL file...');
    
    const sqlContent = fs.readFileSync('tokyo-census-data.sql', 'utf-8');
    const records = [];
    
    // Extract INSERT VALUES using regex
    const valuesRegex = /\('([^']+)',\s*([\d.-]+),\s*([\d.-]+),\s*(\d+),\s*(\d+),\s*NOW\(\)\)/g;
    let match;
    
    while ((match = valuesRegex.exec(sqlContent)) !== null) {
      records.push({
        mesh_code: match[1],
        center_lat: parseFloat(match[2]),
        center_lng: parseFloat(match[3]),
        population: parseInt(match[4]),
        mesh_level: parseInt(match[5]),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Parsed ${records.length} records from SQL file`);
    return records;
  }

  async loadBatch(records, batchNumber, totalBatches) {
    console.log(`📤 Loading batch ${batchNumber}/${totalBatches} (${records.length} records)...`);
    
    const result = await this.makeRequest('population_mesh?on_conflict=mesh_code', 'POST', records);
    
    if (result.success) {
      this.totalLoaded += records.length;
      console.log(`   ✅ Batch ${batchNumber} loaded successfully`);
      return true;
    } else {
      console.log(`   ❌ Batch ${batchNumber} failed: ${result.error}`);
      this.failedBatches.push(batchNumber);
      return false;
    }
  }

  async run() {
    console.log('🌸 Census Data Loader for Supabase');
    console.log('==================================\n');
    
    try {
      // First, check if we can connect
      console.log('🔌 Testing Supabase connection...');
      const testResult = await this.makeRequest('population_mesh?select=count&limit=1', 'GET', null);
      
      if (!testResult.success) {
        if (testResult.error.includes('row-level security')) {
          console.log('⚠️  Row Level Security is blocking access');
          console.log('📋 You need to either:');
          console.log('   1. Use a service role key (not anon key)');
          console.log('   2. Temporarily disable RLS in Supabase dashboard:');
          console.log('      - Go to Table Editor → population_mesh');
          console.log('      - Click on the table → Policies');
          console.log('      - Toggle OFF "Enable RLS"');
          console.log('   3. Create a policy allowing INSERT for anon users');
          return;
        }
        console.log(`❌ Connection failed: ${testResult.error}`);
        return;
      }
      
      console.log('✅ Connected to Supabase\n');
      
      // Parse records from SQL file
      const allRecords = this.parseRecordsFromSQL();
      
      if (allRecords.length === 0) {
        console.log('❌ No records found in SQL file');
        return;
      }
      
      // Split into batches
      const batchSize = 500; // Smaller batches for reliability
      const batches = [];
      
      for (let i = 0; i < allRecords.length; i += batchSize) {
        batches.push(allRecords.slice(i, i + batchSize));
      }
      
      console.log(`📦 Loading ${allRecords.length} records in ${batches.length} batches...\n`);
      
      // Process batches with rate limiting
      for (let i = 0; i < batches.length; i++) {
        await this.loadBatch(batches[i], i + 1, batches.length);
        
        // Progress update every 10 batches
        if ((i + 1) % 10 === 0) {
          console.log(`   📊 Progress: ${this.totalLoaded}/${allRecords.length} records loaded\n`);
        }
        
        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Final summary
      console.log('\n📊 Loading Complete!');
      console.log(`✅ Successfully loaded: ${this.totalLoaded} records`);
      
      if (this.failedBatches.length > 0) {
        console.log(`❌ Failed batches: ${this.failedBatches.join(', ')}`);
        console.log('   Try running the script again to retry failed batches');
      }
      
      if (this.totalLoaded > 0) {
        console.log('\n🎉 Your trade area analysis app now has real census data!');
        console.log('🗺️ Test it by creating a project in the Tokyo area');
      }
      
    } catch (error) {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

// Alternative: Direct SQL execution for smaller batches
async function loadViaSQL() {
  console.log('🔧 Alternative: Creating smaller SQL files...\n');
  
  const sqlContent = fs.readFileSync('tokyo-census-data.sql', 'utf-8');
  const lines = sqlContent.split('\n');
  
  let currentBatch = 1;
  let currentLines = [];
  let inInsertBlock = false;
  let recordCount = 0;
  
  // Header lines
  const header = `-- Tokyo Census Data Batch
-- Run each batch separately in Supabase SQL Editor

ALTER TABLE population_mesh DISABLE ROW LEVEL SECURITY;

`;
  
  const footer = `
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Check progress
SELECT COUNT(*) as loaded_records FROM population_mesh;
`;
  
  for (const line of lines) {
    if (line.includes('INSERT INTO population_mesh')) {
      inInsertBlock = true;
      currentLines = [line];
    } else if (inInsertBlock) {
      currentLines.push(line);
      
      if (line.includes('),')) {
        recordCount++;
      }
      
      // Create new batch file every 1000 records
      if (recordCount >= 1000 && (line.includes('),') || line.includes(');'))) {
        const batchContent = header + currentLines.join('\n') + footer;
        const filename = `tokyo-census-batch-${currentBatch}.sql`;
        fs.writeFileSync(filename, batchContent);
        console.log(`✅ Created ${filename} (${recordCount} records)`);
        
        currentBatch++;
        recordCount = 0;
        inInsertBlock = false;
      }
    }
  }
  
  // Write final batch if needed
  if (currentLines.length > 0 && recordCount > 0) {
    const batchContent = header + currentLines.join('\n') + footer;
    const filename = `tokyo-census-batch-${currentBatch}.sql`;
    fs.writeFileSync(filename, batchContent);
    console.log(`✅ Created ${filename} (${recordCount} records)`);
  }
  
  console.log(`\n📋 Created ${currentBatch} SQL batch files`);
  console.log('📌 Run each file separately in Supabase SQL Editor');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--sql-batches')) {
    // Create SQL batch files
    loadViaSQL();
  } else {
    // Use API loading
    const loader = new SupabaseLoader();
    await loader.run();
  }
}

if (require.main === module) {
  main();
}

module.exports = { SupabaseLoader };