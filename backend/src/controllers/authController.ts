import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateTokens } from '../utils/jwt';
import { LoginRequest, RegisterRequest, AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: RegisterRequest = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      res.status(409).json({ error: 'User already exists with this email' });
      return;
    }
    
    // Create new user
    const user = await UserModel.create(userData);
    
    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        role: user.role
      },
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Validate password
    const isValidPassword = await UserModel.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        role: user.role
      },
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        company: req.user.company,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const updates = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, updates);
    
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};