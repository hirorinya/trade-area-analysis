#!/usr/bin/env node

/**
 * Test e-Stat API to diagnose HTTP 400 errors
 */

const https = require('https');

const API_KEY = '51deb74ec10b1ac3af28d8cda3e88fdcce2d1c95';

// Test with a simple Tokyo mesh code
async function testEStatAPI() {
  console.log('🧪 Testing e-Stat API...');
  
  // Use a known Tokyo mesh code (Shibuya area)
  const testMeshCode = '53394577'; // 3rd level mesh for Shibuya
  
  const params = new URLSearchParams({
    appId: API_KEY,
    statsDataId: 'C0020050213000', // 2020 census
    cdArea: testMeshCode,
    cdCat01: '#A03503', // Total population
    lang: 'J',
    limit: '10'
  });
  
  const url = `https://api.e-stat.go.jp/rest/3.0/app/getStatsData?${params}`;
  
  console.log('📡 Request URL:', url);
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Status Code:', res.statusCode);
        console.log('📋 Headers:', res.headers);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('✅ Success! Response preview:');
            console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
            resolve(parsed);
          } catch (e) {
            console.log('❌ JSON Parse Error:', e.message);
            console.log('Raw response:', data.substring(0, 500));
            reject(e);
          }
        } else {
          console.log('❌ HTTP Error:', res.statusCode, res.statusMessage);
          console.log('Response body:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test different API endpoints
async function testMultipleEndpoints() {
  console.log('🔍 Testing multiple e-Stat API configurations...\n');
  
  const tests = [
    {
      name: 'Test 1: Basic 2020 census data',
      statsDataId: 'C0020050213000',
      cdArea: '53394577',
      cdCat01: '#A03503'
    },
    {
      name: 'Test 2: Different table ID',
      statsDataId: 'C0020050112000', // 2015 census
      cdArea: '53394577',
      cdCat01: '#A03503'
    },
    {
      name: 'Test 3: Regional code format',
      statsDataId: 'C0020050213000',
      cdArea: '13113', // Tokyo prefecture code
      cdCat01: '#A03503'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 ${test.name}`);
    
    const params = new URLSearchParams({
      appId: API_KEY,
      statsDataId: test.statsDataId,
      cdArea: test.cdArea,
      cdCat01: test.cdCat01,
      lang: 'J',
      limit: '5'
    });
    
    const url = `https://api.e-stat.go.jp/rest/3.0/app/getStatsData?${params}`;
    
    try {
      await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`   Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.GET_STATS_DATA?.RESULT?.ERROR_MSG) {
                  console.log(`   ❌ API Error: ${parsed.GET_STATS_DATA.RESULT.ERROR_MSG}`);
                } else {
                  console.log(`   ✅ Success!`);
                }
              } catch (e) {
                console.log(`   ❌ Parse error: ${e.message}`);
              }
            } else {
              console.log(`   ❌ HTTP Error: ${data.substring(0, 100)}`);
            }
            resolve();
          });
        });
        req.on('error', (error) => {
          console.log(`   ❌ Request error: ${error.message}`);
          resolve();
        });
        req.setTimeout(5000, () => {
          req.destroy();
          console.log(`   ❌ Timeout`);
          resolve();
        });
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await testEStatAPI();
  } catch (error) {
    console.log('\n🔧 Basic test failed, trying alternative configurations...');
    await testMultipleEndpoints();
  }
}

main();