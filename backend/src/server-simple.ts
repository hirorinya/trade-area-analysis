import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Trade Area Analysis API' });
});

// Simple auth routes without validation
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Registration endpoint working', body: req.body });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint working', body: req.body });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});