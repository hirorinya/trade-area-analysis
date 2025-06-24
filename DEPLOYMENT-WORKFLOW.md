# 🚀 Production-Ready Deployment Workflow

## Quick Reference

### URLs:
- **Production**: https://trade-area-analysis-2png.vercel.app
- **Staging**: https://trade-area-analysis-2png-git-staging.vercel.app  
- **Development**: http://localhost:5173

### Branches:
- **main**: Production (auto-deploy) 
- **staging**: Testing (auto-deploy)
- **develop**: Local development (no deploy)

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Develop locally
npm run dev              # Start local server
npm test                 # Run unit tests
npm run test:integration # Run integration tests

# Commit when ready
git add .
git commit -m "feat: description of your feature"
git push origin feature/your-feature-name
```

### 2. Staging Deployment (Testing)
```bash
# Merge to staging for testing
git checkout staging
git pull origin staging
git merge feature/your-feature-name
git push origin staging

# This automatically deploys to staging environment
# Test at: https://trade-area-analysis-2png-git-staging.vercel.app
```

### 3. Production Deployment
```bash
# Only after thorough staging testing
git checkout main
git pull origin main
git merge staging
git push origin main

# This automatically deploys to production
# Live at: https://trade-area-analysis-2png.vercel.app
```

## 🧪 Testing Strategy

### Local Testing (develop branch):
```bash
# Unit tests
npm test

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# Build test
npm run build

# Preview build
npm run preview
```

### Staging Testing Checklist:
- [ ] User registration/login works
- [ ] Project creation works
- [ ] Location adding/editing works
- [ ] Map rendering works (all zoom levels)
- [ ] AI analysis features work
- [ ] Data persistence works
- [ ] Mobile responsiveness
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance acceptable (load time < 3s)

### Production Testing Checklist:
- [ ] All staging tests pass
- [ ] Database migrations successful
- [ ] Environment variables correct
- [ ] SSL certificate valid
- [ ] CDN/caching working
- [ ] Monitoring/alerts configured

## 🗄️ Database Strategy

### Development Database:
```bash
# Option 1: Local Docker (recommended)
docker-compose up -d postgres
# Connection: localhost:5432

# Option 2: Supabase Dev Project
# Use separate dev project for safety
```

### Staging Database:
- **Separate Supabase project** for staging
- Can be reset/recreated safely
- Test data only
- Schema migration testing

### Production Database:
- **Primary Supabase project**
- Real user data
- Regular automated backups
- Monitoring and alerts

## 📊 Environment Variables Setup

### Vercel Dashboard Configuration:

#### Production Environment (main branch):
```
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_key
VITE_MAPBOX_TOKEN=prod_mapbox_token
VITE_OPENAI_API_KEY=prod_openai_key
VITE_ENVIRONMENT=production
```

#### Staging Environment (staging branch):
```
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_key
VITE_MAPBOX_TOKEN=staging_mapbox_token
VITE_OPENAI_API_KEY=staging_openai_key
VITE_ENVIRONMENT=staging
```

### Local Development (.env.local):
```
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_key
VITE_MAPBOX_TOKEN=dev_mapbox_token
VITE_OPENAI_API_KEY=dev_openai_key
VITE_ENVIRONMENT=development
```

## 🚨 Emergency Procedures

### Hot-fix Process:
```bash
# Create hotfix from production
git checkout main
git checkout -b hotfix/critical-fix

# Apply minimal fix
# Test locally
npm test && npm run build

# Deploy directly to main (skip staging for emergencies)
git checkout main
git merge hotfix/critical-fix
git push origin main

# Merge back to other branches
git checkout staging
git merge main
git push origin staging

git checkout develop  
git merge main
git push origin develop
```

### Rollback Process:
```bash
# Find last working commit
git log --oneline -10

# Rollback production
git checkout main
git reset --hard [last-working-commit]
git push --force origin main

# Fix issue properly on staging first
git checkout staging
# Apply proper fix
# Test thoroughly
# Then merge to main
```

## 📈 Deployment Limits Management

### Vercel Free Tier Strategy:
- **100 deployments/day limit**
- **Production**: Max 5-10 deployments (critical only)
- **Staging**: Max 20-30 deployments (feature testing)
- **Development**: 0 deployments (local only)

### Best Practices:
1. **Batch features** in staging before production
2. **Test locally first** - don't use Vercel for debugging
3. **Use staging for final validation only**
4. **Plan production deployments** (morning releases preferred)
5. **Monitor deployment count** in Vercel dashboard

## 🔍 Monitoring & Debugging

### Production Monitoring:
- Vercel Analytics (page views, performance)
- Supabase Dashboard (database performance, errors)
- Error tracking (console errors, API failures)
- User feedback collection

### Debugging Process:
1. **Check local first** - reproduce locally
2. **Check staging** - verify in staging environment  
3. **Check logs** - Vercel function logs, Supabase logs
4. **Check monitoring** - performance metrics, error rates

## 👥 Team Collaboration

### Code Review Process:
1. Create feature branch from `develop`
2. Push feature branch to GitHub
3. Create Pull Request to `staging`
4. Code review and approval
5. Merge to `staging` for testing
6. After testing, create PR from `staging` to `main`
7. Final approval and merge to production

### Communication:
- **#deployments** Slack channel for deployment notifications
- **#bugs** channel for production issues
- **@here** for critical production issues requiring immediate attention

## 🎯 Success Metrics

### Deployment Success:
- ✅ Zero-downtime deployments
- ✅ < 3 second page load times
- ✅ > 99% uptime
- ✅ < 5% error rate
- ✅ Successful staging → production flow

### Development Velocity:
- ✅ Daily staging deployments
- ✅ Weekly production releases
- ✅ < 2 hour fix time for critical issues
- ✅ All features tested in staging first