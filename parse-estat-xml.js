#!/usr/bin/env node

/**
 * Parse e-Stat XML responses to find correct table IDs
 */

const https = require('https');

const API_KEY = '51deb74ec10b1ac3af28d8cda3e88fdcce2d1c95';

// Simple XML parser for table IDs
function parseTablesFromXML(xmlString) {
  const tables = [];
  
  // Extract table info using regex (simple approach)
  const tablePattern = /<TABLE_INF id="([^"]+)">(.*?)<\/TABLE_INF>/gs;
  let match;
  
  while ((match = tablePattern.exec(xmlString)) !== null) {
    const id = match[1];
    const content = match[2];
    
    // Extract title
    const titleMatch = content.match(/<STATISTICS_NAME[^>]*>([^<]+)</);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    // Look for mesh-related terms
    const isMeshData = title.includes('メッシュ') || title.includes('mesh') || title.includes('地域メッシュ');
    
    tables.push({
      id,
      title,
      isMeshData
    });
  }
  
  return tables;
}

// Get table list with XML parsing
async function getPopulationTables() {
  console.log('🔍 Searching for 2020 census population tables...');
  
  const params = new URLSearchParams({
    appId: API_KEY,
    lang: 'J',
    surveyYears: '2020',
    searchWord: '国勢調査', // Census
    limit: '50'
  });
  
  const url = `https://api.e-stat.go.jp/rest/3.0/app/getStatsList?${params}`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const tables = parseTablesFromXML(data);
            console.log(`✅ Found ${tables.length} census tables`);
            
            // Filter for mesh data
            const meshTables = tables.filter(t => t.isMeshData);
            console.log(`🗺️ Found ${meshTables.length} mesh-related tables:`);
            
            meshTables.forEach(table => {
              console.log(`   📋 ${table.id}: ${table.title}`);
            });
            
            // Also show first few general tables
            console.log(`\n📊 First 10 general census tables:`);
            tables.slice(0, 10).forEach(table => {
              console.log(`   📋 ${table.id}: ${table.title.substring(0, 80)}...`);
            });
            
            resolve(tables);
          } catch (e) {
            console.log('❌ XML Parse Error:', e.message);
            reject(e);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test a specific table ID with data
async function testTableData(tableId) {
  console.log(`\n🧪 Testing table ${tableId} with sample data...`);
  
  const params = new URLSearchParams({
    appId: API_KEY,
    statsDataId: tableId,
    limit: '5',
    lang: 'J'
  });
  
  const url = `https://api.e-stat.go.jp/rest/3.0/app/getStatsData?${params}`;
  
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          // Check if XML contains error
          if (data.includes('<ERROR_MSG>')) {
            const errorMatch = data.match(/<ERROR_MSG>([^<]+)<\/ERROR_MSG>/);
            const error = errorMatch ? errorMatch[1] : 'Unknown error';
            console.log(`   ❌ API Error: ${error}`);
          } else if (data.includes('<VALUE ')) {
            console.log(`   ✅ Has data! Contains <VALUE> elements`);
            
            // Extract sample values
            const valuePattern = /<VALUE[^>]*>([^<]+)<\/VALUE>/g;
            let valueMatch;
            let valueCount = 0;
            
            while ((valueMatch = valuePattern.exec(data)) !== null && valueCount < 3) {
              console.log(`   📊 Sample value: ${valueMatch[1]}`);
              valueCount++;
            }
          } else {
            console.log(`   ⚠️ Response OK but no data values found`);
          }
        } else {
          console.log(`   ❌ HTTP Error: ${res.statusCode}`);
        }
        
        resolve();
      });
    });
    req.on('error', () => {
      console.log(`   ❌ Request failed`);
      resolve();
    });
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   ❌ Timeout`);
      resolve();
    });
  });
}

async function main() {
  try {
    console.log('🌸 e-Stat Table ID Discovery\n');
    
    const tables = await getPopulationTables();
    
    // Test a few promising table IDs
    const testTables = tables.slice(0, 5).map(t => t.id);
    console.log(`\n🧪 Testing ${testTables.length} tables for data availability...\n`);
    
    for (const tableId of testTables) {
      await testTableData(tableId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
  }
}

main();