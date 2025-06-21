import express from 'express';
import { 
  getLocationsByProject, 
  getLocation, 
  createLocation, 
  updateLocation, 
  deleteLocation,
  findNearbyLocations
} from '../controllers/locationController';
import { authenticate } from '../middleware/auth';
import { validateCreateLocation, validateUpdateLocation } from '../middleware/validation-simple';

const router = express.Router();

// All location routes require authentication
router.use(authenticate);

// GET /api/locations/project/:projectId - Get all locations for a project
router.get('/project/:projectId', getLocationsByProject);

// GET /api/locations/nearby - Find nearby locations
router.get('/nearby', findNearbyLocations);

// GET /api/locations/:id - Get specific location
router.get('/:id', getLocation);

// POST /api/locations - Create new location
router.post('/', validateCreateLocation, createLocation);

// PUT /api/locations/:id - Update location
router.put('/:id', validateUpdateLocation, updateLocation);

// DELETE /api/locations/:id - Delete location
router.delete('/:id', deleteLocation);

export default router;