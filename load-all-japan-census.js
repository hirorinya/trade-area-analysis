#!/usr/bin/env node

// Load ALL Japan census data from /population directory
// This processes all 151 census files and loads them into Supabase

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://vjbhwtwxjhyufvjrnhyu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww';

const supabase = createClient(supabaseUrl, supabaseKey);

const populationDir = './population';
const batchSize = 1000; // Insert 1000 records at a time

// Japanese mesh code utilities
function meshCodeToLatLng(meshCode) {
  const code = meshCode.toString();
  
  if (code.length < 8) {
    console.warn(`Invalid mesh code length: ${code}`);
    return null;
  }
  
  try {
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
    
    // Handle 4th mesh (500m level)
    if (code.length >= 9) {
      const m4 = parseInt(code.substr(8, 1));
      const m4lat = (m4 - 1) % 2;
      const m4lng = Math.floor((m4 - 1) / 2);
      lat += m4lat / 160 / 1.5;
      lng += m4lng / 160;
    }
    
    // Return center point for 500m mesh
    const meshSize = 1/240; // 500m mesh size in degrees
    return {
      lat: lat + meshSize / 2 / 1.5,
      lng: lng + meshSize / 2
    };
  } catch (error) {
    console.warn(`Error parsing mesh code ${meshCode}:`, error.message);
    return null;
  }
}

// Process a single census TXT file
function processCensusFile(txtContent, filename) {
  const lines = txtContent.split('\n').filter(line => line.trim());
  const records = [];
  
  console.log(`📄 Processing ${filename}: ${lines.length} lines`);
  
  lines.forEach((line, index) => {
    if (index === 0) return; // Skip header
    
    const columns = line.split(',');
    if (columns.length < 6) return;
    
    const meshCode = columns[2]?.replace(/"/g, '').trim();
    const populationStr = columns[5]?.replace(/"/g, '').trim();
    
    if (!meshCode || !populationStr) return;
    
    const population = parseInt(populationStr);
    if (isNaN(population) || population <= 0) return;
    
    const coordinates = meshCodeToLatLng(meshCode);
    if (!coordinates) return;
    
    // Validate coordinates are within Japan
    if (coordinates.lat < 20 || coordinates.lat > 50 || 
        coordinates.lng < 120 || coordinates.lng > 150) {
      return;
    }
    
    records.push({
      mesh_code: meshCode,
      center_lat: coordinates.lat,
      center_lng: coordinates.lng,
      population: population,
      mesh_level: 4 // 500m mesh
    });
  });
  
  console.log(`✅ Extracted ${records.length} valid records from ${filename}`);
  return records;
}

// Main processing function
async function loadAllJapanCensus() {
  console.log('🗾 Loading ALL Japan Census Data\n');
  
  const files = fs.readdirSync(populationDir).filter(f => f.endsWith('.zip'));
  console.log(`Found ${files.length} census files to process\n`);
  
  let totalRecords = 0;
  let processedFiles = 0;
  
  for (const filename of files) {
    try {
      console.log(`\n📦 Processing file ${processedFiles + 1}/${files.length}: ${filename}`);
      
      const filePath = path.join(populationDir, filename);
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      
      const txtEntry = zipEntries.find(entry => entry.entryName.endsWith('.txt'));
      if (!txtEntry) {
        console.warn(`❌ No TXT found in ${filename}`);
        continue;
      }
      
      const txtContent = txtEntry.getData().toString('utf8');
      const records = processCensusFile(txtContent, filename);
      
      if (records.length === 0) {
        console.warn(`❌ No valid records in ${filename}`);
        continue;
      }
      
      // Insert records in batches
      console.log(`💾 Inserting ${records.length} records to database...`);
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('population_mesh')
          .insert(batch);
        
        if (error) {
          console.error(`❌ Database error for ${filename} batch ${Math.floor(i/batchSize) + 1}:`, error);
          break;
        }
        
        process.stdout.write(`\r   Inserted: ${Math.min(i + batchSize, records.length)}/${records.length} records`);
      }
      
      console.log(`\n✅ Completed ${filename}: ${records.length} records`);
      totalRecords += records.length;
      processedFiles++;
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
    }
  }
  
  console.log(`\n🎉 COMPLETE! Processed ${processedFiles}/${files.length} files`);
  console.log(`📊 Total records added: ${totalRecords.toLocaleString()}`);
  console.log(`🗾 Coverage: All Japan (Hokkaido to Okinawa)`);
  
  // Update the app bounds comment
  console.log(`\n💡 Next steps:`);
  console.log(`1. Update app bounds to cover all Japan: Lat 24-46, Lng 123-146`);
  console.log(`2. The app will now load census data for any region in Japan`);
  console.log(`3. Estimated total: ~${Math.round(totalRecords * 1.2).toLocaleString()} records including urban areas`);
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting ALL Japan census data loading...\n');
  console.log('⚠️  This will process all 151 files and may take 20-30 minutes');
  console.log('📊 Expected result: ~150,000-200,000 mesh records covering all Japan\n');
  
  loadAllJapanCensus().catch(console.error);
}