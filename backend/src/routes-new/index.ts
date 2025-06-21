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

// Auth routes
router.use('/auth', authRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'Trade Area Analysis API v1.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

export default router;