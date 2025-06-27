#!/usr/bin/env node

/**
 * Create a manageable sample from the 466,131 census records
 * Focus on Tokyo metropolitan area for testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Tokyo bounds (wider area)
const TOKYO_BOUNDS = {
  north: 36.2,   // Include Saitama
  south: 35.3,   // Include southern Tokyo
  east: 140.3,   // Include eastern Tokyo  
  west: 138.8    // Include western Tokyo
};

// Mesh code utilities
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
}

// Simple CSV parser
function parseCSVLine(line) {
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

// Process a sample of files to get Tokyo area data
function processSampleFiles() {
  console.log('🌸 Creating Tokyo Area Census Data Sample');
  console.log('==========================================\n');
  
  const populationDir = './population';
  const tokyoRecords = [];
  
  // Focus on files that likely contain Tokyo data (mesh codes 533x, 534x, 535x, 536x)
  const tokyoFiles = [
    'tblT001141H5329.zip', 'tblT001141H5330.zip', 'tblT001141H5331.zip', 'tblT001141H5332.zip',
    'tblT001141H5333.zip', 'tblT001141H5334.zip', 'tblT001141H5335.zip', 'tblT001141H5336.zip',
    'tblT001141H5337.zip', 'tblT001141H5338.zip', 'tblT001141H5339.zip', 'tblT001141H5340.zip',
    'tblT001141H5432.zip', 'tblT001141H5433.zip', 'tblT001141H5435.zip', 'tblT001141H5436.zip',
    'tblT001141H5437.zip', 'tblT001141H5438.zip', 'tblT001141H5439.zip', 'tblT001141H5440.zip'
  ];
  
  console.log(`📦 Processing ${tokyoFiles.length} Tokyo-area files...\n`);
  
  for (const zipFile of tokyoFiles) {
    const zipPath = path.join(populationDir, zipFile);
    
    if (!fs.existsSync(zipPath)) {
      console.log(`⚠️ File not found: ${zipFile}`);
      continue;
    }
    
    const txtFile = zipFile.replace('.zip', '.txt');
    const txtPath = path.join(populationDir, txtFile);
    
    try {
      // Extract zip file
      console.log(`📦 Processing: ${zipFile}`);
      execSync(`cd "${populationDir}" && unzip -o "${zipFile}"`, { stdio: 'pipe' });
      
      // Process the extracted file
      if (fs.existsSync(txtPath)) {
        const content = fs.readFileSync(txtPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length >= 3) {
          const dataRows = lines.slice(2); // Skip header and Japanese header row
          
          for (const line of dataRows) {
            try {
              const values = parseCSVLine(line);
              
              if (values.length < 5) continue;
              
              const meshCode = values[0];
              const totalPopulation = parseInt(values[4]) || 0;
              
              if (!meshCode || totalPopulation === 0) continue;
              
              // Get coordinates
              const coords = MeshCodeUtil.meshCodeToLatLng(meshCode);
              
              // Filter for Tokyo area
              if (coords.lat >= TOKYO_BOUNDS.south && coords.lat <= TOKYO_BOUNDS.north &&
                  coords.lng >= TOKYO_BOUNDS.west && coords.lng <= TOKYO_BOUNDS.east) {
                
                tokyoRecords.push({
                  mesh_code: meshCode,
                  center_lat: coords.lat,
                  center_lng: coords.lng,
                  population: totalPopulation,
                  mesh_level: meshCode.length >= 10 ? 5 : meshCode.length >= 9 ? 4 : 3
                });
              }
              
            } catch (error) {
              // Skip invalid rows
            }
          }
        }
        
        // Clean up extracted file
        fs.unlinkSync(txtPath);
      }
      
      console.log(`   ✅ Tokyo records so far: ${tokyoRecords.length}`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${zipFile}: ${error.message}`);
    }
  }
  
  console.log(`\n🗺️ Tokyo area processing complete!`);
  console.log(`📊 Total Tokyo records: ${tokyoRecords.length}`);
  
  if (tokyoRecords.length > 0) {
    console.log(`📊 Population range: ${Math.min(...tokyoRecords.map(r => r.population))} - ${Math.max(...tokyoRecords.map(r => r.population))}`);
    console.log(`📊 Average population: ${Math.round(tokyoRecords.reduce((sum, r) => sum + r.population, 0) / tokyoRecords.length)}`);
    
    // Sample coordinates to verify coverage
    console.log(`📍 Sample coordinates:`);
    const sample = tokyoRecords.slice(0, 5);
    sample.forEach(record => {
      console.log(`   ${record.mesh_code}: ${record.center_lat.toFixed(4)}, ${record.center_lng.toFixed(4)} (pop: ${record.population})`);
    });
  }
  
  return tokyoRecords;
}

// Generate SQL insert statements
function generateSQL(records) {
  console.log(`\n📝 Generating SQL for ${records.length} records...`);
  
  // Split into manageable batches
  const batchSize = 1000;
  const batches = [];
  
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }
  
  let sql = `-- Tokyo Area Census Population Data (${records.length} records)
-- Run this in your Supabase SQL editor

-- Temporarily disable RLS for data insertion
ALTER TABLE population_mesh DISABLE ROW LEVEL SECURITY;

`;
  
  batches.forEach((batch, batchIndex) => {
    sql += `-- Batch ${batchIndex + 1}/${batches.length} (${batch.length} records)\n`;
    
    const values = batch.map(record => 
      `('${record.mesh_code}', ${record.center_lat}, ${record.center_lng}, ${record.population}, ${record.mesh_level}, NOW())`
    ).join(',\n');
    
    sql += `INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level, updated_at) VALUES\n${values}\nON CONFLICT (mesh_code) DO UPDATE SET\n  population = EXCLUDED.population,\n  updated_at = EXCLUDED.updated_at;\n\n`;
  });
  
  sql += `-- Re-enable RLS
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_records,
    MIN(population) as min_population,
    MAX(population) as max_population,
    AVG(population)::integer as avg_population,
    mesh_level
FROM population_mesh 
GROUP BY mesh_level
ORDER BY mesh_level;

-- Sample Tokyo area data
SELECT mesh_code, center_lat, center_lng, population
FROM population_mesh
WHERE center_lat BETWEEN 35.6 AND 35.8
  AND center_lng BETWEEN 139.6 AND 139.8
ORDER BY population DESC
LIMIT 20;`;

  return sql;
}

async function main() {
  try {
    // Process Tokyo area files
    const tokyoRecords = processSampleFiles();
    
    if (tokyoRecords.length === 0) {
      console.log('❌ No Tokyo records found');
      return;
    }
    
    // Generate SQL
    const sql = generateSQL(tokyoRecords);
    
    // Write SQL file
    const sqlFile = './tokyo-census-data.sql';
    fs.writeFileSync(sqlFile, sql);
    
    console.log(`\n✅ SQL file created: ${sqlFile}`);
    console.log(`📋 Instructions:`);
    console.log(`   1. Go to your Supabase dashboard`);
    console.log(`   2. Open SQL Editor`);
    console.log(`   3. Copy and paste the contents of ${sqlFile}`);
    console.log(`   4. Click Run`);
    console.log(`\n🗺️ This will populate your database with real Tokyo census data!`);
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  }
}

main();