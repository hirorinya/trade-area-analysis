# Trade Area Analysis Tool - Development Rules & Context

## Project Overview
Building a comprehensive Trade Area Analysis tool for market analysis, customer catchment areas, and location decision-making.

## IMPORTANT: Development Workflow (June 26, 2025)
**🚨 PRODUCTION PROTECTED - USE STAGING FOR ALL DEVELOPMENT**

### Branch Structure:
- **`main` branch** = PRODUCTION (v1.0-production) - DO NOT MODIFY DIRECTLY
- **`staging` branch** = DEVELOPMENT - USE THIS FOR ALL CHANGES

### Workflow:
1. `git checkout staging` - Always work on staging
2. Make changes, test locally
3. `git push origin staging` - Auto-deploys to staging URL
4. Test thoroughly in staging environment
5. Only after verification: merge to main

## Current Status (June 26, 2025)
### ✅ **Production Environment (STABLE)**
- **Version**: v1.0-production 
- **URL**: https://trade-area-analysis-2png.vercel.app
- **Features Working**:
  - ✅ Maps (Leaflet + 国土地理院 tiles)
  - ✅ Cross-browser compatibility (Chrome, Edge, Safari)
  - ✅ User authentication & project management
  - ✅ Location geocoding & management
  - ✅ Clean, compact layout design
  - ✅ Supabase integration

### 🧪 **Recent Bug Fixes (In Staging)**
Fixed 10 critical bugs affecting population mapping:
- Type mismatches in captureRatio
- Missing bounds validation
- Coordinate format handling issues
- Async function errors
- Distance calculation NaN issues
- Minimum population guarantees

## Tech Stack
- **Frontend**: React, TypeScript, Redux Toolkit, Material-UI, Leaflet
- **Backend**: Supabase (direct integration)
- **Database**: PostgreSQL with PostGIS (via Supabase)
- **Deployment**: Vercel + Supabase
- **Maps**: Leaflet with 国土地理院 tiles (GSI)

## Environment URLs
- **Production**: https://trade-area-analysis-2png.vercel.app
- **Staging**: Auto-generated Vercel staging URL
- **Local Dev**: http://localhost:5173

## Key Architecture Decisions
1. **Frontend-only deployment** - Backend logic moved to Supabase
2. **Leaflet maps** - Better cross-browser compatibility than Mapbox
3. **Staging/Production split** - Protect stable version from bugs
4. **Direct Supabase integration** - Simpler than separate backend

## Critical Files to Know
- `STAGING-WORKFLOW.md` - Development workflow documentation
- `frontend/src/App.tsx` - Main application logic
- `frontend/src/utils/demandGrid.js` - Population mapping logic
- `frontend/src/components/map/LeafletMap.tsx` - Map component
- `frontend/.env` - Environment configuration

## Current Issues & Solutions
1. **Maps work in Safari but not Chrome/Edge** → Fixed with CSP headers
2. **Layout stretched vertically** → Fixed spacing and removed flex centering
3. **Population mapping bugs** → Fixed in staging, needs testing
4. **updateMapMarkers undefined** → Added as no-op function

## Development Guidelines
1. **ALWAYS use staging branch** for development
2. **Test in staging environment** before production
3. **Preserve working features** - don't break what works
4. **Use Leaflet maps** - proven cross-browser compatibility
5. **Handle coordinate formats** - support both [lng,lat] and {latitude, longitude}

## Testing Checklist
Before promoting staging to production:
- [ ] Maps display in Chrome, Edge, Safari
- [ ] Location creation/deletion works
- [ ] Geocoding functions properly
- [ ] Population mapping displays data
- [ ] Layout looks correct (not stretched)
- [ ] No console errors

## Emergency Rollback
If production breaks:
```bash
git checkout main
git reset --hard v1.0-production
git push origin main --force
```

## Session Transfer Instructions
To continue work in another Claude Code session:
1. Share this CLAUDE.md file
2. Current branch should be: `staging`
3. Latest stable version: `v1.0-production`
4. Check STAGING-WORKFLOW.md for process

## Recent Session Summary (June 26, 2025)
- Set up staging/production workflow
- Fixed 10 critical bugs in population mapping
- Improved layout (removed vertical stretching)
- Fixed map display issues in Chrome/Edge
- Created comprehensive workflow documentation

## Important Notes
- Production is stable and working - protect it!
- All development happens in staging first
- Test thoroughly before merging to main
- User email in logs: bananas.go.bananas@gmail.com