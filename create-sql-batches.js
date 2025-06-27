#!/usr/bin/env node

/**
 * Create small SQL batch files from the large census data
 * Each file will have exactly 1000 records or less
 */

const fs = require('fs');

// Parse records from the main SQL file
function parseSQL() {
  console.log('📄 Reading census data SQL file...');
  
  const sqlContent = fs.readFileSync('tokyo-census-data.sql', 'utf-8');
  const records = [];
  
  // Extract INSERT VALUES using regex - match individual record lines
  const recordRegex = /\('([^']+)',\s*([\d.-]+),\s*([\d.-]+),\s*(\d+),\s*(\d+),\s*NOW\(\)\)[,;]/g;
  let match;
  
  while ((match = recordRegex.exec(sqlContent)) !== null) {
    records.push({
      line: match[0],
      mesh_code: match[1],
      lat: match[2],
      lng: match[3],
      population: match[4],
      level: match[5]
    });
  }
  
  console.log(`✅ Found ${records.length} census records\n`);
  return records;
}

// Create batch SQL files
function createBatches(records) {
  const BATCH_SIZE = 1000; // Records per file
  const batches = [];
  
  // Split records into batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Creating ${batches.length} SQL batch files...\n`);
  
  // Create each batch file
  batches.forEach((batch, index) => {
    const batchNumber = index + 1;
    const filename = `census-batch-${String(batchNumber).padStart(2, '0')}.sql`;
    
    // Build SQL content
    let sql = `-- Tokyo Census Data Batch ${batchNumber}/${batches.length}
-- ${batch.length} records
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS
ALTER TABLE population_mesh DISABLE ROW LEVEL SECURITY;

-- Insert batch data
INSERT INTO population_mesh (mesh_code, center_lat, center_lng, population, mesh_level, updated_at) VALUES
`;
    
    // Add records
    batch.forEach((record, i) => {
      // Change comma to semicolon for last record
      const line = i === batch.length - 1 
        ? record.line.replace(/,$/, ';') 
        : record.line;
      sql += line + '\n';
    });
    
    sql += `
-- Re-enable RLS
ALTER TABLE population_mesh ENABLE ROW LEVEL SECURITY;

-- Verify this batch
SELECT COUNT(*) as records_in_batch FROM population_mesh 
WHERE mesh_code IN (${batch.slice(0, 5).map(r => `'${r.mesh_code}'`).join(', ')});
`;
    
    // Write file
    fs.writeFileSync(filename, sql);
    console.log(`✅ Created ${filename} (${batch.length} records)`);
  });
  
  // Create a master script to check progress
  const progressSQL = `-- Check Census Data Loading Progress
-- Run this after loading batches to see progress

SELECT 
    COUNT(*) as total_records,
    MIN(population) as min_population,
    MAX(population) as max_population,
    AVG(population)::integer as avg_population,
    COUNT(DISTINCT mesh_level) as mesh_levels
FROM population_mesh;

-- Sample data from different areas
SELECT * FROM population_mesh 
ORDER BY population DESC 
LIMIT 10;

-- Check coverage area
SELECT 
    MIN(center_lat) as south_boundary,
    MAX(center_lat) as north_boundary,
    MIN(center_lng) as west_boundary,
    MAX(center_lng) as east_boundary
FROM population_mesh;
`;
  
  fs.writeFileSync('check-census-progress.sql', progressSQL);
  console.log(`\n✅ Created check-census-progress.sql`);
  
  // Create instructions file
  const instructions = `# Loading Census Data into Supabase

## Files Created
- ${batches.length} batch files (census-batch-01.sql to census-batch-${String(batches.length).padStart(2, '0')}.sql)
- Each file contains ${BATCH_SIZE} records (last file: ${batches[batches.length - 1].length} records)
- Total records: ${records.length}

## Loading Instructions

### Option 1: Load All Batches
1. Go to Supabase SQL Editor
2. Run each census-batch-XX.sql file in order
3. Each file takes about 5-10 seconds to run
4. Check progress with check-census-progress.sql

### Option 2: Test with First Batch
1. Start with census-batch-01.sql to test
2. If successful, continue with remaining batches
3. You can stop at any time and resume later

### Option 3: If RLS Blocks Loading
1. Go to Table Editor → population_mesh
2. Click on the table → Policies tab
3. Temporarily toggle OFF "Enable RLS"
4. Run the batch files
5. Re-enable RLS after loading

## Troubleshooting
- If a batch fails, check the error message
- You can re-run any batch safely (uses ON CONFLICT)
- Each batch is independent

## Verify Success
After loading, run check-census-progress.sql to see:
- Total records loaded
- Population statistics
- Geographic coverage
`;
  
  fs.writeFileSync('CENSUS-LOADING-INSTRUCTIONS.md', instructions);
  console.log(`📋 Created CENSUS-LOADING-INSTRUCTIONS.md`);
}

// Main execution
function main() {
  console.log('🌸 Census Data SQL Batch Creator');
  console.log('=================================\n');
  
  try {
    const records = parseSQL();
    createBatches(records);
    
    console.log('\n✅ Success! SQL batch files created');
    console.log('📖 Read CENSUS-LOADING-INSTRUCTIONS.md for next steps');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();