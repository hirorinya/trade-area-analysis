import express from 'express';
import authRoutes from './auth';

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

// API info
router.get('/', (req, res) => {
  res.json({ 
    message: 'Trade Area Analysis API v1.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      locations: '/api/locations',
      'trade-areas': '/api/trade-areas',
      geo: '/api/geo'
    }
  });
});

export default router;