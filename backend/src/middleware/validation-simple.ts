import { Request, Response, NextFunction } from 'express';

// Simple validation without Joi
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  
  if (!email.includes('@')) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  
  next();
};

export const validateCreateProject = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }
  
  if (name.trim().length < 1) {
    res.status(400).json({ error: 'Project name cannot be empty' });
    return;
  }
  
  if (name.length > 255) {
    res.status(400).json({ error: 'Project name too long (max 255 characters)' });
    return;
  }
  
  next();
};

export const validateUpdateProject = (req: Request, res: Response, next: NextFunction): void => {
  const { name, description } = req.body;
  
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 1) {
      res.status(400).json({ error: 'Project name must be a non-empty string' });
      return;
    }
    
    if (name.length > 255) {
      res.status(400).json({ error: 'Project name too long (max 255 characters)' });
      return;
    }
  }
  
  if (description !== undefined && typeof description !== 'string') {
    res.status(400).json({ error: 'Description must be a string' });
    return;
  }
  
  next();
};

export const validateCreateLocation = (req: Request, res: Response, next: NextFunction): void => {
  const { project_id, name, latitude, longitude, location_type } = req.body;
  
  if (!project_id || typeof project_id !== 'string') {
    res.status(400).json({ error: 'Project ID is required' });
    return;
  }
  
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    res.status(400).json({ error: 'Location name is required' });
    return;
  }
  
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    res.status(400).json({ error: 'Valid latitude is required (-90 to 90)' });
    return;
  }
  
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    res.status(400).json({ error: 'Valid longitude is required (-180 to 180)' });
    return;
  }
  
  if (!location_type || !['store', 'competitor', 'poi'].includes(location_type)) {
    res.status(400).json({ error: 'Location type must be: store, competitor, or poi' });
    return;
  }
  
  next();
};

export const validateUpdateLocation = (req: Request, res: Response, next: NextFunction): void => {
  const { name, latitude, longitude, location_type } = req.body;
  
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1)) {
    res.status(400).json({ error: 'Location name must be a non-empty string' });
    return;
  }
  
  if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
    res.status(400).json({ error: 'Valid latitude is required (-90 to 90)' });
    return;
  }
  
  if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
    res.status(400).json({ error: 'Valid longitude is required (-180 to 180)' });
    return;
  }
  
  if (location_type !== undefined && !['store', 'competitor', 'poi'].includes(location_type)) {
    res.status(400).json({ error: 'Location type must be: store, competitor, or poi' });
    return;
  }
  
  next();
};