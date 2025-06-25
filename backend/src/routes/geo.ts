import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Generate isochrone (drive-time polygon)
router.post('/isochrone', authenticate, async (req, res) => {
  try {
    const { coordinates, time_minutes = 10, mode = 'driving' } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Expected [longitude, latitude]' 
      });
    }

    // Mock isochrone data for now
    // TODO: Integrate with Mapbox Isochrone API
    const mockIsochrone = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          fillColor: '#6366f1',
          fillOpacity: 0.2,
          fillOutlineColor: '#4f46e5',
          contour: time_minutes,
          metric: 'time'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [coordinates[0] - 0.01, coordinates[1] - 0.01],
            [coordinates[0] + 0.01, coordinates[1] - 0.01],
            [coordinates[0] + 0.01, coordinates[1] + 0.01],
            [coordinates[0] - 0.01, coordinates[1] + 0.01],
            [coordinates[0] - 0.01, coordinates[1] - 0.01]
          ]]
        }
      }]
    };

    res.json({
      message: 'Isochrone generated successfully',
      data: mockIsochrone
    });
  } catch (error) {
    console.error('Error generating isochrone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Geocode address
router.post('/geocode', authenticate, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Mock geocoding response
    // TODO: Integrate with Mapbox Geocoding API
    const mockResult = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          full_address: address,
          confidence: 0.9
        },
        geometry: {
          type: 'Point',
          coordinates: [139.6917, 35.6895] // Tokyo coordinates as default
        }
      }]
    };

    res.json({
      message: 'Address geocoded successfully',
      data: mockResult
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get demographic data for an area
router.post('/demographics', authenticate, async (req, res) => {
  try {
    const { coordinates, radius_km = 1 } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Expected [longitude, latitude]' 
      });
    }

    // Mock demographic data
    // TODO: Integrate with actual demographic data sources
    const mockDemographics = {
      area: {
        center: coordinates,
        radius_km
      },
      population: {
        total: Math.floor(Math.random() * 50000) + 10000,
        density_per_km2: Math.floor(Math.random() * 5000) + 1000,
        age_groups: {
          '0-14': Math.floor(Math.random() * 20) + 10,
          '15-29': Math.floor(Math.random() * 25) + 15,
          '30-44': Math.floor(Math.random() * 25) + 20,
          '45-64': Math.floor(Math.random() * 25) + 20,
          '65+': Math.floor(Math.random() * 20) + 10
        }
      },
      income: {
        median_household_income: Math.floor(Math.random() * 30000) + 40000,
        average_household_income: Math.floor(Math.random() * 40000) + 50000
      },
      housing: {
        total_households: Math.floor(Math.random() * 20000) + 5000,
        owner_occupied_rate: Math.floor(Math.random() * 30) + 60
      }
    };

    res.json({
      message: 'Demographic data retrieved successfully',
      data: mockDemographics
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;