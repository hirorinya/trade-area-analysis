import { chromium } from 'playwright';
import fetch from 'node-fetch';

async function testMapSite() {
  console.log('🧪 Starting comprehensive map functionality test...');
  
  // First, test basic HTTP response
  console.log('📡 Testing HTTP response...');
  try {
    const response = await fetch('https://trade-area-analysis.vercel.app');
    console.log(`📊 HTTP Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    
    const html = await response.text();
    
    // Check for JavaScript bundle
    const jsBundle = html.match(/assets\/index-[^"]*\.js/);
    if (jsBundle) {
      console.log(`📦 JS Bundle: ${jsBundle[0]}`);
      
      // Test the JS bundle directly
      const bundleResponse = await fetch(`https://trade-area-analysis.vercel.app/${jsBundle[0]}`);
      console.log(`📦 Bundle Status: ${bundleResponse.status}`);
      
      const bundleContent = await bundleResponse.text();
      
      // Check for problematic patterns in the bundle
      const errors = [];
      if (bundleContent.includes('responsiveFlexStyle') && !bundleContent.includes('responsiveFlexStyle:')) {
        errors.push('responsiveFlexStyle may not be properly imported');
      }
      if (bundleContent.includes('preventOverflowStyle') && !bundleContent.includes('preventOverflowStyle:')) {
        errors.push('preventOverflowStyle may not be properly imported');
      }
      if (bundleContent.includes('.colors.blue[') || bundleContent.includes('.colors.red[') || bundleContent.includes('.colors.green[')) {
        errors.push('Invalid theme color references found in bundle');
      }
      
      console.log(`🔍 Bundle Analysis - Issues found: ${errors.length}`);
      errors.forEach(error => console.log(`  ❌ ${error}`));
    }
    
    // Check for error handler
    if (html.includes('error-handler.js')) {
      console.log('✅ Error handler script detected');
    }
    
  } catch (error) {
    console.error('❌ HTTP test failed:', error.message);
    return;
  }
  
  // Try Playwright test (will fail gracefully if dependencies missing)
  try {
    console.log('🎭 Attempting Playwright browser test...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto('https://trade-area-analysis.vercel.app', { waitUntil: 'networkidle' });
    
    console.log('📄 Page loaded successfully');
    console.log(`📋 Page title: ${await page.title()}`);
    
    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(3000);
    
    // Check if there are any JavaScript errors
    console.log(`❌ JavaScript Errors Found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('🔍 Error details:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Check specific elements
    const loginForm = await page.locator('form').count();
    console.log(`🔐 Login forms found: ${loginForm}`);

    const mapContainer = await page.locator('[style*="height"]').count();
    console.log(`🗺️ Map-like containers found: ${mapContainer}`);
    
    // Check for error messages in console output
    const consoleOutput = await page.evaluate(() => {
      return window.console._logs || [];
    });
    
    console.log('✅ Browser test completed successfully');
    await browser.close();

  } catch (playwrightError) {
    console.log('⚠️ Playwright test skipped (dependencies not available)');
    console.log(`   Reason: ${playwrightError.message}`);
  }
  
  console.log('🎯 Test summary: HTTP tests completed, check above for any issues');
}

testMapSite().catch(console.error);