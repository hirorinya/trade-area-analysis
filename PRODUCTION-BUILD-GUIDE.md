# Trade Area Analysis - Production Build & Deployment Guide

## 🚀 Complete Production Deployment Process

### 1. Pre-Deployment Checklist

#### ✅ Code Status
- [x] All features implemented and tested
- [x] Demo mode fully functional
- [x] Authentication system working
- [x] Population data loaded (32,173 Tokyo mesh cells)
- [x] Error handling implemented
- [x] Cross-browser compatibility verified

#### ✅ Environment Configuration
```env
# Production Environment Variables (already set in .env)
VITE_USE_SUPABASE_DIRECT=true
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiaGlyb2tpbmFnYW1pbmUiLCJhIjoiY21jOGVkZjVpMW83aDJsb2x3bTVpbnpoYyJ9.foKoVoXcT2LH1eMBFrMJ3A
VITE_SUPABASE_URL=https://vjbhwtwxjhyufvjrnhyu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmh3dHd4amh5dWZ2anJuaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODg2OTgsImV4cCI6MjA2NTk2NDY5OH0.hGyGbKGxIt25CHE_YGHVLx6c8iH--VRnvowGo1wKGww
VITE_ESTAT_API_KEY=51deb74ec10b1ac3af28d8cda3e88fdcce2d1c95
```

### 2. Build Commands

```bash
# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Test production build locally
npm run preview
```

### 3. Deployment Methods

#### Option A: Vercel Deployment (Recommended)

**Automatic Deployment (Already Configured)**
- Push to `main` branch → Auto-deploys to production
- Push to `staging` branch → Auto-deploys to staging

**Manual Deployment**
```bash
# From project root
vercel --prod
```

#### Option B: Manual Server Deployment

```bash
# Build the application
cd frontend
npm run build

# The production files are in frontend/dist/
# Upload contents of dist/ to your web server

# For nginx, use this configuration:
```

**nginx.conf**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/trade-area-analysis;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Production Features

#### 🎯 Demo Mode
- **URL**: Click "Try Demo Mode" button on login page
- **Features**: Full app functionality with sample Tokyo data
- **Data**: 4 pre-configured locations in Shibuya/Harajuku
- **No Registration**: Instant access for testing

#### 🔐 User Authentication
- **Registration**: Email/password signup
- **Login**: Secure Supabase authentication
- **Session Management**: Persistent login state
- **Password Recovery**: Via email (Supabase)

#### 🗺️ Mapping Features
- **Provider**: Leaflet with Japan GSI tiles
- **Coverage**: Optimized for Japan market
- **Population Data**: Real census mesh data (500m resolution)
- **Visualization**: Heat maps, trade areas, competitor analysis

#### 📊 Analysis Tools
- **Trade Area Analysis**: Catchment area calculations
- **Population Density**: Real Japanese census data
- **Store Optimization**: Multiple algorithms available
- **Competitor Analysis**: Impact and market share
- **AI Analysis**: When OpenAI key provided

### 5. Database Management

#### Supabase Configuration
- **URL**: https://vjbhwtwxjhyufvjrnhyu.supabase.co
- **Tables**: 
  - `users` - User accounts
  - `projects` - User projects
  - `locations` - Store/competitor locations
  - `population_mesh` - Census data (32,173 records)
  - `trade_areas` - Analyzed trade areas

#### Backup Strategy
```sql
-- Export all data
pg_dump -h db.vjbhwtwxjhyufvjrnhyu.supabase.co -U postgres -d postgres > backup.sql

-- Export specific tables
pg_dump -h db.vjbhwtwxjhyufvjrnhyu.supabase.co -U postgres -d postgres -t population_mesh > population_backup.sql
```

### 6. Monitoring & Analytics

#### Vercel Analytics
- Automatic performance monitoring
- Real user metrics
- Error tracking
- Usage analytics

#### Application Logs
```javascript
// Check browser console for:
- 🧪 Demo mode indicators
- 📊 Population data loading
- 🗺️ Map initialization
- ❌ Error messages
```

### 7. Performance Optimization

#### Current Optimizations
- **Code Splitting**: Automatic via Vite
- **Lazy Loading**: Components load on demand
- **Caching**: 
  - Population data: 30-minute cache
  - Map tiles: Browser cache
  - API responses: In-memory cache
- **Compression**: Gzip enabled on Vercel

#### Lighthouse Scores (Expected)
- Performance: 85-95
- Accessibility: 90-100
- Best Practices: 90-100
- SEO: 80-90

### 8. Security Measures

#### Implemented Security
- **HTTPS**: Enforced on all connections
- **Authentication**: Supabase Row Level Security
- **API Keys**: Environment variables only
- **CORS**: Properly configured
- **Input Validation**: All user inputs sanitized
- **SQL Injection**: Protected via Supabase

### 9. Troubleshooting

#### Common Issues

**1. Map Not Loading**
- Check Mapbox token in environment variables
- Verify browser allows location access
- Check console for CORS errors

**2. Population Data Not Showing**
- Verify you're in Tokyo area (35.3-36.2°N)
- Check console for data loading messages
- Ensure mesh size is set to 500m

**3. Authentication Errors**
- Check Supabase service status
- Verify email confirmation for new users
- Try demo mode as fallback

**4. Performance Issues**
- Clear browser cache
- Reduce mesh grid size
- Limit number of locations

### 10. Post-Deployment Tasks

1. **Verify Production**
   ```bash
   # Check these URLs work:
   - https://your-domain.com
   - https://your-domain.com/login (should redirect)
   - Demo mode functionality
   - Real user registration
   ```

2. **Monitor Initial Usage**
   - Check Vercel dashboard for errors
   - Monitor Supabase for database load
   - Review user feedback

3. **Set Up Alerts**
   - Vercel deployment notifications
   - Supabase usage alerts
   - Error rate monitoring

### 11. Scaling Considerations

#### Current Capacity
- **Users**: Unlimited (Supabase free tier: 500MB database)
- **Locations**: ~10,000 per project
- **Population Data**: 32,173 mesh cells (Tokyo)
- **Concurrent Users**: ~100 (can scale)

#### Future Scaling
1. **More Regions**: Run census loading script for other areas
2. **Database**: Upgrade Supabase plan for more storage
3. **Performance**: Add CDN for static assets
4. **API Limits**: Implement rate limiting if needed

### 12. Maintenance Schedule

#### Regular Tasks
- **Weekly**: Check error logs and user feedback
- **Monthly**: Update dependencies (security patches)
- **Quarterly**: Performance review and optimization
- **Yearly**: Major feature updates

#### Update Process
```bash
# Update dependencies
cd frontend
npm update
npm audit fix

# Test locally
npm run dev

# Deploy to staging first
git push origin staging

# After testing, deploy to production
git push origin main
```

## 🎉 Production Deployment Complete!

The Trade Area Analysis tool is now ready for production use with:
- ✅ Robust demo mode for user testing
- ✅ Full authentication system
- ✅ Real Japanese census data
- ✅ Professional UI/UX
- ✅ Comprehensive error handling
- ✅ Cross-browser compatibility
- ✅ Mobile responsive design

**Production URL**: https://trade-area-analysis-2png.vercel.app

**Support**: For issues, check the browser console for detailed error messages and refer to this guide.