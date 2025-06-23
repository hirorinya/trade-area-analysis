# 🗺️ Mapbox Setup Guide

## Overview
This application uses Mapbox GL JS for advanced map visualization including satellite imagery, demand grid overlays, and store optimization markers.

## 🔑 Getting a Mapbox Access Token

### Step 1: Create Mapbox Account
1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Access Token
1. After login, you'll see your **Default public token**
2. Copy the token (starts with `pk.`)
3. For production use, consider creating a **new token** with specific scopes

### Step 3: Create Custom Token (Recommended)
1. Go to **Account → Access tokens**
2. Click **Create a token**
3. Configure:
   - **Name**: `Trade Area Analysis`
   - **Scopes**: Check these boxes:
     - ✅ `styles:read` (Map styles)
     - ✅ `datasets:read` (Data access)
     - ✅ `geocoding:read` (Address search)
   - **URL restrictions**: Add your domain(s):
     - `localhost:5173` (development)
     - `*.vercel.app` (production)
     - Your custom domain

## 🔧 Environment Variable Setup

### Local Development (.env)
```bash
VITE_MAPBOX_TOKEN=pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xxxxxxxxxxxxxxx
```

### Vercel Production
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add new variable:
   - **Name**: `VITE_MAPBOX_TOKEN`
   - **Value**: Your Mapbox token
   - **Environment**: `Production`, `Preview`, `Development`

## 📊 Usage Limits (Free Tier)
- **50,000 map loads** per month
- **500,000 tile requests** per month
- **100,000 geocoding requests** per month

For trade area analysis, this is typically sufficient for most users.

## 🔒 Security Best Practices

### Token Restrictions
1. **URL restrictions**: Always restrict tokens to your specific domains
2. **Scope limitations**: Only enable required scopes
3. **Rotate tokens**: Regenerate tokens periodically

### Environment Variables
```bash
# ✅ Good - Uses environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

# ❌ Bad - Never hardcode in source
mapboxgl.accessToken = 'pk.eyJ1IjoidXNlcm5hbWUi...'
```

## 🚀 Vercel Deployment Steps

### Option A: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. **Settings → Environment Variables**
4. Add:
   ```
   Key: VITE_MAPBOX_TOKEN
   Value: pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xxxxxxx
   ```

### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variable
vercel env add VITE_MAPBOX_TOKEN
# Enter your token when prompted

# Redeploy
vercel --prod
```

## 🧪 Testing Token

### Check Token Validity
```javascript
// Test in browser console
fetch(`https://api.mapbox.com/v1/geocoding/geocode/Tokyo?access_token=YOUR_TOKEN`)
  .then(r => r.json())
  .then(console.log)
```

### Debug in App
1. Open browser developer tools
2. Check console for errors like:
   - `401: Unauthorized` → Invalid token
   - `403: Forbidden` → Token restrictions
   - Map not loading → Missing token

## 📞 Support
- **Mapbox Help**: [docs.mapbox.com](https://docs.mapbox.com)
- **Token Issues**: Check Account → Billing for usage
- **Rate Limits**: Upgrade plan if needed

## 🎯 Current Implementation
The app automatically detects the token and falls back gracefully:
```javascript
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'fallback_token';
```

Once configured, you'll have access to:
- 🛰️ Satellite imagery
- 📊 Population demand grids  
- 🎯 Store optimization visualizations
- 🗾 Multiple map styles