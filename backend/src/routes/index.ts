import express from 'express';
import authRoutes from './auth';
import projectRoutes from './projects';
import locationRoutes from './locations';
import tradeAreaRoutes from './tradeAreas';
import geoRoutes from './geo';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Trade Area Analysis API'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/locations', locationRoutes);
router.use('/trade-areas', tradeAreaRoutes);
router.use('/geo', geoRoutes);

// API info
router.get('/', (req, res) => {
  res.json({ 
    message: 'Trade Area Analysis API v1.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      locations: '/api/locations',
      tradeAreas: '/api/trade-areas',
      geo: '/api/geo'
    }
  });
});

export default router;