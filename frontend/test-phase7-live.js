/**
 * Live Testing for Phase 7: Analysis & Optimization Deployment
 * This will test the actual deployed site and show visual results
 */

import fetch from 'node-fetch';
import { chromium } from 'playwright';
import fs from 'fs';

// Change this to your deployment URL
const DEPLOYMENT_URL = 'https://trade-area-analysis-9ipm.vercel.app';
const MAIN_URL = 'https://trade-area-analysis.vercel.app';

async function testPhase7LiveDeployment() {
  console.log('🧪 Testing Phase 7 Live Deployment');
  console.log('=' .repeat(60));
  console.log(`📍 Target URL: ${DEPLOYMENT_URL}`);
  console.log(`📍 Main URL: ${MAIN_URL}`);
  console.log('');
  
  const results = {
    deployment: { status: 'pending', details: [] },
    features: { status: 'pending', details: [] },
    performance: { status: 'pending', details: [] },
    errors: []
  };
  
  // Test 1: Check if deployment is accessible
  console.log('🌐 Testing Deployment Accessibility...');
  try {
    const response = await fetch(DEPLOYMENT_URL);
    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Server: ${response.headers.get('server') || 'Unknown'}`);
    
    if (response.status === 200) {
      console.log('   ✅ Deployment is accessible!');
      results.deployment.status = 'success';
      results.deployment.details.push('Site is live and responding');
      
      // Get HTML content
      const html = await response.text();
      
      // Check for Phase 7 indicators
      console.log('\n🔍 Checking Phase 7 Configuration...');
      
      // Check bundle
      const bundleMatch = html.match(/assets\/index-([^"]*\.js)/);
      if (bundleMatch) {
        console.log(`   ✅ JavaScript Bundle: ${bundleMatch[0]}`);
        
        // Check bundle content
        const bundleUrl = `${DEPLOYMENT_URL}/${bundleMatch[0]}`;
        const bundleResponse = await fetch(bundleUrl);
        const bundleContent = await bundleResponse.text();
        
        // Look for Phase 7 specific features
        const phase7Features = [
          { pattern: /Phase 7: Analysis & Optimization/, name: 'Phase 7 Environment Flag' },
          { pattern: /optimizationEngine/, name: 'Optimization Engine' },
          { pattern: /AIAnalysisChat/, name: 'AI Analysis Component' },
          { pattern: /demandGrid/, name: 'Demand Grid Analysis' },
          { pattern: /tradeAreaCalculation/, name: 'Trade Area Calculations' }
        ];
        
        console.log('\n📋 Phase 7 Feature Detection:');
        phase7Features.forEach(feature => {
          const found = bundleContent.includes(feature.pattern.source) || 
                       feature.pattern.test(bundleContent);
          if (found) {
            console.log(`   ✅ ${feature.name}: Found`);
            results.features.details.push(`${feature.name}: Available`);
          } else {
            console.log(`   ⚠️  ${feature.name}: Not detected`);
          }
        });
      }
      
      // Check for error handler
      if (html.includes('error-handler.js')) {
        console.log('   ✅ Error Handler: Active');
      }
      
    } else {
      console.log(`   ❌ Deployment returned ${response.status}`);
      results.deployment.status = 'failed';
      results.deployment.details.push(`HTTP ${response.status} error`);
    }
    
  } catch (error) {
    console.log(`   ❌ Failed to connect: ${error.message}`);
    results.deployment.status = 'failed';
    results.errors.push(error.message);
  }
  
  // Test 2: Compare with main deployment
  console.log('\n🔄 Comparing with Main Deployment...');
  try {
    const mainResponse = await fetch(MAIN_URL);
    const phase7Response = await fetch(DEPLOYMENT_URL);
    
    console.log(`   Main Site: ${mainResponse.status}`);
    console.log(`   Phase 7 Site: ${phase7Response.status}`);
    
    if (mainResponse.status === 200 && phase7Response.status === 200) {
      console.log('   ✅ Both deployments are live');
    }
    
  } catch (error) {
    console.log(`   ⚠️  Comparison skipped: ${error.message}`);
  }
  
  // Test 3: Performance Check
  console.log('\n⚡ Testing Performance...');
  const performanceResults = [];
  
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    try {
      const response = await fetch(DEPLOYMENT_URL);
      const end = Date.now();
      const responseTime = end - start;
      performanceResults.push(responseTime);
      console.log(`   Test ${i + 1}: ${responseTime}ms`);
    } catch (error) {
      console.log(`   Test ${i + 1}: Failed`);
    }
  }
  
  if (performanceResults.length > 0) {
    const avgTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
    console.log(`   📊 Average Response Time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 500) {
      console.log('   ✅ Performance: EXCELLENT');
      results.performance.status = 'excellent';
    } else if (avgTime < 1000) {
      console.log('   ✅ Performance: GOOD');
      results.performance.status = 'good';
    } else {
      console.log('   ⚠️  Performance: NEEDS IMPROVEMENT');
      results.performance.status = 'slow';
    }
    results.performance.details.push(`Avg response: ${avgTime.toFixed(2)}ms`);
  }
  
  // Test 4: Try browser testing (if available)
  console.log('\n🎭 Browser Testing...');
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log(`   ✅ Page loaded successfully`);
    console.log(`   📋 Console messages: ${consoleMessages.length}`);
    console.log(`   ❌ JavaScript errors: ${errors.length}`);
    
    // Check for Phase 7 specific console logs
    const phase7Logs = consoleMessages.filter(msg => 
      msg.text.includes('Phase 7') || 
      msg.text.includes('Analysis & Optimization')
    );
    
    if (phase7Logs.length > 0) {
      console.log('   ✅ Phase 7 environment detected in console');
      phase7Logs.forEach(log => {
        console.log(`      → ${log.text}`);
      });
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'phase7-deployment-test.png', fullPage: true });
    console.log('   📸 Screenshot saved: phase7-deployment-test.png');
    
    await browser.close();
    
  } catch (error) {
    console.log(`   ⚠️  Browser test skipped: ${error.message.split('\n')[0]}`);
  }
  
  // Test 5: Feature-specific endpoints (if any)
  console.log('\n🔌 Testing API Endpoints...');
  const endpoints = [
    '/api/health',
    '/api/analysis',
    '/api/optimization'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${DEPLOYMENT_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`   ${endpoint}: Not available`);
    }
  }
  
  // Final Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 PHASE 7 DEPLOYMENT TEST SUMMARY');
  console.log('=' .repeat(60));
  
  // Deployment Status
  console.log('\n🌐 Deployment Status:');
  if (results.deployment.status === 'success') {
    console.log('   ✅ LIVE AND ACCESSIBLE');
    console.log(`   📍 URL: ${DEPLOYMENT_URL}`);
  } else {
    console.log('   ❌ NOT ACCESSIBLE');
    console.log('   Check deployment settings and try again');
  }
  
  // Feature Status
  console.log('\n📋 Phase 7 Features:');
  if (results.features.details.length > 0) {
    results.features.details.forEach(detail => {
      console.log(`   ✅ ${detail}`);
    });
  } else {
    console.log('   ⚠️  No Phase 7 specific features detected');
  }
  
  // Performance Status
  console.log('\n⚡ Performance:');
  console.log(`   Status: ${results.performance.status?.toUpperCase() || 'NOT TESTED'}`);
  results.performance.details.forEach(detail => {
    console.log(`   ${detail}`);
  });
  
  // Errors
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  
  console.log('\n✨ Test Complete!');
  console.log('Next steps:');
  console.log(`1. Visit ${DEPLOYMENT_URL} in your browser`);
  console.log('2. Check browser console for Phase 7 logs');
  console.log('3. Test analysis and optimization features');
  
  // Save results to file
  fs.writeFileSync('phase7-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to: phase7-test-results.json');
}

// Run the test
testPhase7LiveDeployment().catch(console.error);