# 🚀 Staging/Production Workflow

## Overview
Your Trade Area Analysis tool now has a proper staging/production environment setup to prevent issues from affecting your live application.

## Environment Structure

### 🏷️ **Production (v1.0-production)**
- **Branch**: `main`
- **URL**: https://trade-area-analysis-2png.vercel.app
- **Purpose**: Stable, tested version for end users
- **Status**: ✅ Current stable version with:
  - Working maps (Leaflet + 国土地理院)
  - Cross-browser compatibility 
  - User authentication & projects
  - Location management & geocoding
  - Clean, compact layout

### 🧪 **Staging**
- **Branch**: `staging`
- **URL**: Will auto-deploy to `https://trade-area-analysis-staging-[hash].vercel.app`
- **Purpose**: Testing ground for new features
- **Status**: Ready for development

## Development Workflow

### 1. **Making Changes**
```bash
# Always start from staging branch
git checkout staging
git pull origin staging

# Make your changes...
# Test locally...

# Commit and push to staging
git add .
git commit -m "feature: your changes"
git push origin staging
```

### 2. **Testing in Staging**
- Staging deploys automatically to Vercel on push
- Test thoroughly in the staging environment
- Verify all functionality works as expected
- Check cross-browser compatibility

### 3. **Promoting to Production (via Pull Request)**
Only after staging testing is complete:

**Option A: Using Claude Code (Automatic)**
```bash
# Create pull request from staging to main
gh pr create --base main --head staging --title "Deploy staging fixes to production" --body "$(cat <<'EOF'
## 🚀 Staging → Production Deployment

### Changes Included:
- [List key changes from staging]

### Testing Completed:
- ✅ Maps display correctly in all browsers
- ✅ Location management works
- ✅ No console errors
- ✅ Layout appears correct

### Deployment Notes:
- No breaking changes
- All features backward compatible
- Database migrations: None required

Ready for production deployment.
EOF
)"

# Review and merge the PR
gh pr merge --merge --delete-branch=false
```

**Option B: Manual via GitHub**
1. Go to https://github.com/hirorinya/trade-area-analysis
2. Click "Compare & pull request" (staging → main)  
3. Add descriptive title and testing checklist
4. Request review if collaborating
5. Merge after approval

**After merge:**
```bash
# Tag new production version
git checkout main
git pull origin main
git tag -a "v1.1-production" -m "Description of changes"
git push origin v1.1-production
```

## Branch Protection

### ✅ **Safe to modify:**
- `staging` branch - for all development and testing

### ⚠️ **Requires testing:**
- `main` branch - only merge after staging verification

## Vercel Deployment

### Production Deployment
- **Triggers**: Push to `main` branch
- **URL**: https://trade-area-analysis-2png.vercel.app
- **Environment**: Production settings

### Staging Deployment  
- **Triggers**: Push to `staging` branch
- **URL**: Auto-generated staging URL
- **Environment**: Staging settings

## Emergency Rollback

If production has issues:
```bash
# Revert to last known good version
git checkout main
git reset --hard v1.0-production
git push origin main --force

# Or rollback via Vercel dashboard
```

## Best Practices

1. **Always test in staging first** - Never push directly to main
2. **Keep staging current** - Regularly sync with main if needed
3. **Use descriptive commits** - Help track what's being tested
4. **Tag production releases** - Makes rollback easier
5. **Monitor after deployment** - Check production after each update

## Current Status

### 🎯 **Next Steps for Development:**
1. Checkout staging branch: `git checkout staging`
2. Make your changes and test locally
3. Push to staging for verification
4. Only then promote to production

Your production environment is now protected! 🛡️