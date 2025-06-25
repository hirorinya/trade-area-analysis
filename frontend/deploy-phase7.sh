#!/bin/bash

echo "🚀 Deploying Phase 7: Analysis & Optimization Environment"
echo "Target: trade-area-analysis-9ipm.vercel.app"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the frontend directory."
    exit 1
fi

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build Phase 7 version
echo "🔨 Building Phase 7 version..."
npm run build:phase7

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful"

# Deploy to Vercel with specific configuration
echo "🚀 Deploying to Vercel..."
vercel --prod --yes --config vercel-phase7.json

if [ $? -eq 0 ]; then
    echo "✅ Phase 7 deployment successful!"
    echo "🌐 URL: https://trade-area-analysis-9ipm.vercel.app"
    echo ""
    echo "📋 Phase 7 Features Available:"
    echo "   ✅ Advanced map analysis"
    echo "   ✅ AI-powered recommendations"
    echo "   ✅ Multiple optimization algorithms"
    echo "   ✅ Population demand visualization"
    echo "   ✅ Trade area calculations"
    echo "   ✅ Competitive analysis"
    echo ""
    echo "🧪 To test the deployment:"
    echo "   node test-phase7-analysis.js"
else
    echo "❌ Deployment failed. Check Vercel logs for details."
    exit 1
fi