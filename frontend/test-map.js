import { chromium } from 'playwright';

async function testMapSite() {
  console.log('🧪 Starting Playwright test for map functionality...');
  
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

  try {
    console.log('📡 Navigating to https://trade-area-analysis.vercel.app...');
    await page.goto('https://trade-area-analysis.vercel.app', { waitUntil: 'networkidle' });
    
    console.log('📄 Page loaded successfully');
    console.log(`📋 Page title: ${await page.title()}`);
    
    // Check if there are any JavaScript errors
    console.log(`❌ JavaScript Errors Found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('🔍 Error details:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Try to take a screenshot of the map area if possible
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'site-test.png', fullPage: true });
    console.log('✅ Screenshot saved as site-test.png');

    // Check if login form is visible
    const loginForm = await page.locator('form').count();
    console.log(`🔐 Login forms found: ${loginForm}`);

    // Check if map container exists
    const mapContainer = await page.locator('[style*="height"]').count();
    console.log(`🗺️ Map-like containers found: ${mapContainer}`);

    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMapSite().catch(console.error);