# 🚀 Vercel + Supabase Deployment Guide

## Step 1: Setup Supabase (Database & Backend) - 10 minutes

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up with GitHub
3. Click "New Project"
4. Fill out:
   - **Name**: `trade-area-analysis`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your location
5. Click "Create new project" (takes 2-3 minutes)

### 1.2 Setup Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste this schema:

```sql
-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Locations table with PostGIS geometry
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    location_type VARCHAR(50) CHECK (location_type IN ('store', 'competitor', 'poi')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST (coordinates);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own locations" ON locations FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM projects WHERE projects.id = locations.project_id
    )
);
```

4. Click "RUN" to execute the schema

### 1.3 Get API Keys
1. Go to **Settings** → **API**
2. Copy these values (you'll need them for frontend):
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJ...` (long string)

## Step 2: Deploy Frontend to Vercel - 5 minutes

### 2.1 Push to GitHub
```bash
# From your project directory
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Import Git Repository"
4. Select your `trade-area-analysis` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
6. Click "Deploy"

### 2.3 Configure Environment Variables
1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase Project URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key
4. Click "Save"
5. Go to **Deployments** and click "Redeploy" on the latest deployment

## Step 3: Update Frontend Configuration - 2 minutes

Update your frontend to use Supabase instead of your local backend:

1. Install Supabase client:
```bash
cd frontend
npm install @supabase/supabase-js
```

2. Create `frontend/src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

3. Your app will be live at: `https://your-project.vercel.app`

## Step 4: Test Your Deployment

1. Open your Vercel URL
2. Register a new account
3. Create a project
4. Add some locations
5. Generate dashboard
6. Test all features

## 🎉 Congratulations!

Your trade area analysis tool is now live and ready for colleagues to use!

### Share with Colleagues:
- Send them your Vercel URL
- They can register their own accounts
- Multiple users can work simultaneously
- All data is automatically saved

### Free Tier Limits:
- ✅ Unlimited users and projects
- ✅ 500MB database storage
- ✅ Unlimited deployments
- ✅ Custom domains available

### If You Need Help:
- Check Vercel deployment logs
- Check Supabase logs in dashboard
- Ensure environment variables are set correctly