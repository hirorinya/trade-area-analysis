const express = require('express');

console.log('🐛 Testing route loading...');

// Test 1: Basic Express setup
try {
    const app = express();
    console.log('✅ Express app created');
} catch (error) {
    console.error('❌ Express setup failed:', error.message);
    process.exit(1);
}

// Test 2: Check if route files exist and can be loaded
try {
    console.log('🔍 Checking auth routes file...');
    const authFile = require('./dist/routes/auth.js');
    console.log('✅ Auth routes file exists and loadable');
} catch (error) {
    console.error('❌ Auth routes file error:', error.message);
}

try {
    console.log('🔍 Checking main routes file...');
    const routesFile = require('./dist/routes/index.js');
    console.log('✅ Main routes file exists and loadable');
} catch (error) {
    console.error('❌ Main routes file error:', error.message);
}

console.log('🏁 Route testing complete');