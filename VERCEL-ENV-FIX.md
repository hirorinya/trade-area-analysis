# Fix Vercel Environment Variables

## Problem
The deployed app on Vercel is using the wrong Supabase instance:
- **Currently using**: ajfydfzokklhfbfvpoll.supabase.co (empty database)
- **Should use**: vjbhwtwxjhyufvjrnhyu.supabase.co (has 32,173 census records)

## Solution
Update Vercel environment variables to match your local `.env` file:

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Find your `trade-area-analysis` project
3. Click on the project

### Step 2: Update Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add/Update these variables:

```
VITE_SUPABASE_URL=https://vjbhwtwxjhyufvjrnhyu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww
VITE_USE_SUPABASE_DIRECT=true
```

### Step 3: Redeploy
1. After updating the environment variables
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or push a new commit to trigger automatic deployment

## Verification
After redeployment, the app should:
- ✅ Load real census data instead of simulated data
- ✅ Show 32,173+ population mesh records
- ✅ Display accurate population density on the map

## Test URLs
- **Test File**: https://your-app.vercel.app/test-population-data.html
- **Main App**: https://your-app.vercel.app

The test file will show if the correct Supabase instance is being used.