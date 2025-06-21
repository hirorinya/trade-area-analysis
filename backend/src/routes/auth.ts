import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validation-simple';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes with simple validation
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;