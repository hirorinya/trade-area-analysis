import express from 'express';

const router = express.Router();

// Temporary simple routes for testing
router.post('/register', (req, res) => {
  res.status(501).json({
    message: 'Registration endpoint - temporarily simplified',
    body: req.body
  });
});

router.post('/login', (req, res) => {
  res.status(501).json({
    message: 'Login endpoint - temporarily simplified',
    body: req.body
  });
});

router.get('/profile', (req, res) => {
  res.status(501).json({
    message: 'Profile endpoint - temporarily simplified'
  });
});

export default router;