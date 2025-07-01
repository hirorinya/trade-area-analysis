import express from 'express';
import { authenticate } from '../middleware/auth';
import { TradeAreaModel } from '../models/TradeArea';

const router = express.Router();

// Get all trade areas for a project
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    
    // Validate project ownership
    const { ProjectModel } = await import('../models/Project');
    const project = await ProjectModel.findById(projectId, userId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    const tradeAreas = await TradeAreaModel.findByProjectId(projectId);
    
    res.json({
      message: 'Trade areas retrieved successfully',
      projectId,
      data: tradeAreas
    });
  } catch (error) {
    console.error('Error fetching trade areas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new trade area
router.post('/', authenticate, async (req, res) => {
  try {
    const { location_id, name, area_type, parameters, geometry, demographics_data } = req.body;
    const userId = (req as any).user.id;
    
    // Basic validation
    if (!location_id || !name || !area_type || !parameters) {
      return res.status(400).json({ 
        error: 'Missing required fields: location_id, name, area_type, parameters' 
      });
    }

    // Validate location ownership
    const hasAccess = await TradeAreaModel.validateLocationOwnership(location_id, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this location' });
    }

    const tradeAreaData = {
      location_id,
      name,
      area_type: area_type as 'drive_time' | 'distance' | 'custom',
      parameters,
      geometry,
      demographics_data
    };

    const tradeArea = await TradeAreaModel.create(tradeAreaData);

    res.status(201).json({
      message: 'Trade area created successfully',
      data: tradeArea
    });
  } catch (error) {
    console.error('Error creating trade area:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trade area by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    const tradeArea = await TradeAreaModel.findById(id);
    
    if (!tradeArea) {
      return res.status(404).json({ error: 'Trade area not found' });
    }
    
    // Validate access through location ownership
    const hasAccess = await TradeAreaModel.validateLocationOwnership(tradeArea.location_id, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this trade area' });
    }
    
    res.json({
      message: 'Trade area retrieved successfully',
      data: tradeArea
    });
  } catch (error) {
    console.error('Error fetching trade area:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update trade area
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, area_type, parameters, geometry, demographics_data } = req.body;
    const userId = (req as any).user.id;
    
    // Check if trade area exists
    const existingTradeArea = await TradeAreaModel.findById(id);
    if (!existingTradeArea) {
      return res.status(404).json({ error: 'Trade area not found' });
    }
    
    // Validate access through location ownership
    const hasAccess = await TradeAreaModel.validateLocationOwnership(existingTradeArea.location_id, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this trade area' });
    }
    
    const updates = {
      name,
      area_type: area_type as 'drive_time' | 'distance' | 'custom' | undefined,
      parameters,
      geometry,
      demographics_data
    };
    
    const updatedTradeArea = await TradeAreaModel.update(id, updates);
    
    if (!updatedTradeArea) {
      return res.status(404).json({ error: 'Trade area not found after update' });
    }
    
    res.json({
      message: 'Trade area updated successfully',
      data: updatedTradeArea
    });
  } catch (error) {
    console.error('Error updating trade area:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete trade area
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Check if trade area exists and validate access
    const existingTradeArea = await TradeAreaModel.findById(id);
    if (!existingTradeArea) {
      return res.status(404).json({ error: 'Trade area not found' });
    }
    
    // Validate access through location ownership
    const hasAccess = await TradeAreaModel.validateLocationOwnership(existingTradeArea.location_id, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this trade area' });
    }
    
    const deleted = await TradeAreaModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Trade area not found' });
    }
    
    res.json({
      message: 'Trade area deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting trade area:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;