# 🚀 Quick Deploy Guide (15 minutes)

Your trade area analysis tool is **ready for deployment**! Follow these simple steps:

## ⚡ Quick Setup (15 minutes total)

### Step 1: Supabase Database (8 minutes)
1. Go to [supabase.com](https://supabase.com) → **"Start your project"**
2. **New Project** → Name: `trade-area-analysis`
3. Choose **region** and **database password**
4. Wait 2-3 minutes for setup
5. Go to **SQL Editor** → **New query**
6. **Copy & paste** this database schema:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (Supabase Auth handles this, but we need reference)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table with PostGIS
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    location_type VARCHAR(50) CHECK (location_type IN ('store', 'competitor', 'poi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for performance
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST (coordinates);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own locations" ON locations FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM projects WHERE projects.id = locations.project_id
    )
);
```

7. Click **"RUN"** to create database
8. Go to **Settings** → **API** → Copy **URL** and **anon key**

### Step 2: Vercel Frontend (5 minutes)
1. Push your code to GitHub:
```bash
git push origin master
```

2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
3. **"Import Git Repository"** → Select `trade-area-analysis`
4. **Deploy settings**:
   - Framework: Vite ✅
   - Root Directory: `./` ✅  
   - Build Command: `cd frontend && npm run build` ✅
   - Output Directory: `frontend/dist` ✅
5. Click **"Deploy"**

### Step 3: Environment Variables (2 minutes)
1. In Vercel project → **Settings** → **Environment Variables**
2. Add these:
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
3. **Deployments** → **Redeploy** latest

## ✅ Done! Your app is live!

**Your URL**: `https://your-project.vercel.app`

### 🎉 What You Get (FREE):
- ✅ **Professional trade area analysis tool**
- ✅ **Multi-user collaboration**
- ✅ **Unlimited projects and locations**
- ✅ **AI-powered analytics**
- ✅ **Japanese geocoding**
- ✅ **500MB database storage**
- ✅ **Automatic HTTPS**

### 👥 Share with Colleagues:
1. Send them your Vercel URL
2. They can register accounts
3. Everyone can create projects
4. Real-time collaboration

### 🔧 If Issues:
- Check Vercel deployment logs
- Verify environment variables are set
- Check Supabase project is running

**Need detailed help?** See `DEPLOYMENT-GUIDE.md` for complete instructions.

---
**Total Time**: ~15 minutes  
**Total Cost**: $0 (free forever for normal usage)  
**Result**: Professional retail analytics platform! 🚀