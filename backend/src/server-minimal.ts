import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Trade Area Analysis API - Minimal Version'
  });
});

// Simple auth routes without database
app.post('/api/auth/register', (req, res) => {
  res.status(501).json({
    error: 'Registration temporarily disabled - database not connected'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.status(501).json({
    error: 'Login temporarily disabled - database not connected'
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.status(501).json({
    error: 'Profile endpoint temporarily disabled - database not connected'
  });
});

// Root route
app.get('/api', (req, res) => {
  res.json({
    message: 'Trade Area Analysis API v1.0 - Minimal Mode',
    status: 'Running without database',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`📍 Mode: Development (without database)`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});