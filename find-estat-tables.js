#!/usr/bin/env node

/**
 * Find available e-Stat table IDs for population data
 */

const https = require('https');

const API_KEY = '51deb74ec10b1ac3af28d8cda3e88fdcce2d1c95';

// Search for statistics tables
async function searchStatsTables(keyword = '人口') {
  console.log('🔍 Searching for e-Stat tables with keyword:', keyword);
  
  const params = new URLSearchParams({
    appId: API_KEY,
    lang: 'J',
    surveyYears: '2020', // 2020 census
    searchWord: keyword,
    limit: '20'
  });
  
  const url = `https://api.e-stat.go.jp/rest/3.0/app/getStatsList?${params}`;
  
  console.log('📡 Search URL:', url);
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Status Code:', res.statusCode);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('✅ Success! Found tables:');
            
            if (parsed.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF) {
              const tables = Array.isArray(parsed.GET_STATS_LIST.DATALIST_INF.TABLE_INF) 
                ? parsed.GET_STATS_LIST.DATALIST_INF.TABLE_INF 
                : [parsed.GET_STATS_LIST.DATALIST_INF.TABLE_INF];
              
              tables.forEach((table, index) => {
                console.log(`\n📋 Table ${index + 1}:`);
                console.log(`   ID: ${table['@id']}`);
                console.log(`   Title: ${table.TITLE.$}`);
                console.log(`   Survey: ${table.SURVEY_DATE}`);
                console.log(`   Update: ${table.OPEN_DATE}`);
              });
              
              return tables;
            } else {
              console.log('❌ No tables found in response');
              console.log('Response structure:', JSON.stringify(parsed, null, 2));
            }
            
            resolve(parsed);
          } catch (e) {
            console.log('❌ JSON Parse Error:', e.message);
            console.log('Raw response:', data.substring(0, 1000));
            reject(e);
          }
        } else {
          console.log('❌ HTTP Error:', res.statusCode, res.statusMessage);
          console.log('Response body:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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

// Test with specific known table ID patterns
async function testKnownPatterns() {
  console.log('\n🧪 Testing known e-Stat table ID patterns...\n');
  
  // Common patterns for census mesh data
  const patterns = [
    '0003448237', // Common 2020 census format
    '0003448238',
    '0003448239', 
    '0003448258', // Population by mesh
    '0003448259',
    '0003312275', // 2015 census mesh
    '0003312276',
    '0003109817', // 2010 census mesh
    '0000200521', // General population
    '0000200522'
  ];
  
  for (const tableId of patterns) {
    console.log(`🔍 Testing table ID: ${tableId}`);
    
    const params = new URLSearchParams({
      appId: API_KEY,
      lang: 'J',
      statsDataId: tableId
    });
    
    const url = `https://api.e-stat.go.jp/rest/3.0/app/getMetaInfo?${params}`;
    
    try {
      await new Promise((resolve) => {
        const req = https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.GET_META_INFO?.RESULT?.ERROR_MSG) {
                  console.log(`   ❌ ${parsed.GET_META_INFO.RESULT.ERROR_MSG}`);
                } else {
                  console.log(`   ✅ Valid table! Title: ${parsed.GET_META_INFO?.METADATA_INF?.TABLE_INF?.TITLE?.$ || 'Unknown'}`);
                }
              } catch (e) {
                console.log(`   ❌ Parse error`);
              }
            } else {
              console.log(`   ❌ HTTP ${res.statusCode}`);
            }
            resolve();
          });
        });
        req.on('error', () => {
          console.log(`   ❌ Request error`);
          resolve();
        });
        req.setTimeout(5000, () => {
          req.destroy();
          console.log(`   ❌ Timeout`);
          resolve();
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log('🌸 e-Stat Table ID Finder\n');
    
    // First try to search for population tables
    await searchStatsTables('人口');
    
    // If that doesn't work, try known patterns
    await testKnownPatterns();
    
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }
}

main();