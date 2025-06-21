import { Response } from 'express';
import { LocationModel, CreateLocationRequest, UpdateLocationRequest } from '../models/Location';
import { AuthRequest } from '../types';

export const getLocationsByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { projectId } = req.params;
    const locations = await LocationModel.findByProjectId(projectId, req.user.id);
    
    res.json({
      locations,
      total: locations.length
    });
  } catch (error: any) {
    console.error('Get locations error:', error);
    if (error.message === 'Project not found or access denied') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  }
};

export const getLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const location = await LocationModel.findById(id, req.user.id);
    
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json({ location });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const locationData: CreateLocationRequest = req.body;
    const location = await LocationModel.create(req.user.id, locationData);
    
    res.status(201).json({
      message: 'Location created successfully',
      location
    });
  } catch (error: any) {
    console.error('Create location error:', error);
    if (error.message === 'Project not found or access denied') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create location' });
    }
  }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const updates: UpdateLocationRequest = req.body;
    
    const location = await LocationModel.update(id, req.user.id, updates);
    
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json({
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const deleted = await LocationModel.delete(id, req.user.id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

export const findNearbyLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }
    
    const radiusKm = radius ? parseFloat(radius as string) : 5; // Default 5km
    const locations = await LocationModel.findNearby(
      parseFloat(latitude as string), 
      parseFloat(longitude as string), 
      radiusKm, 
      req.user.id
    );
    
    res.json({
      locations,
      total: locations.length,
      search_params: {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radius_km: radiusKm
      }
    });
  } catch (error) {
    console.error('Find nearby locations error:', error);
    res.status(500).json({ error: 'Failed to find nearby locations' });
  }
};