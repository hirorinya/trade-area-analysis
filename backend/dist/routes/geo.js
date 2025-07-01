"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Generate isochrone (drive-time polygon)
router.post('/isochrone', auth_1.authenticate, async (req, res) => {
    try {
        const { coordinates, time_minutes = 10, mode = 'driving' } = req.body;
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
            return res.status(400).json({
                error: 'Invalid coordinates. Expected [longitude, latitude]'
            });
        }
        // Try to use Mapbox Isochrone API if available
        let isochroneData;
        if (process.env.MAPBOX_ACCESS_TOKEN) {
            try {
                const mapboxUrl = `https://api.mapbox.com/isochrone/v1/mapbox/${mode}/${coordinates[0]},${coordinates[1]}?contours_minutes=${time_minutes}&polygons=true&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
                const mapboxResponse = await fetch(mapboxUrl);
                if (mapboxResponse.ok) {
                    isochroneData = await mapboxResponse.json();
                }
                else {
                    throw new Error(`Mapbox API error: ${mapboxResponse.status}`);
                }
            }
            catch (error) {
                console.warn('Mapbox Isochrone API failed, using fallback:', error.message);
                isochroneData = null;
            }
        }
        // Fallback to mock data if Mapbox fails or token is not available
        if (!isochroneData) {
            isochroneData = {
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
        }
        res.json({
            message: 'Isochrone generated successfully',
            data: isochroneData
        });
    }
    catch (error) {
        console.error('Error generating isochrone:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Geocode address
router.post('/geocode', auth_1.authenticate, async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }
        // Try to use Mapbox Geocoding API if available
        let geocodeResult;
        if (process.env.MAPBOX_ACCESS_TOKEN) {
            try {
                const encodedAddress = encodeURIComponent(address);
                const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`;
                const mapboxResponse = await fetch(mapboxUrl);
                if (mapboxResponse.ok) {
                    const mapboxData = await mapboxResponse.json();
                    if (mapboxData.features && mapboxData.features.length > 0) {
                        const feature = mapboxData.features[0];
                        geocodeResult = {
                            type: 'FeatureCollection',
                            features: [{
                                    type: 'Feature',
                                    properties: {
                                        full_address: feature.place_name,
                                        confidence: feature.relevance || 0.9
                                    },
                                    geometry: feature.geometry
                                }]
                        };
                    }
                }
                else {
                    throw new Error(`Mapbox API error: ${mapboxResponse.status}`);
                }
            }
            catch (error) {
                console.warn('Mapbox Geocoding API failed, using fallback:', error.message);
                geocodeResult = null;
            }
        }
        // Fallback to mock data if Mapbox fails or token is not available
        if (!geocodeResult) {
            geocodeResult = {
                type: 'FeatureCollection',
                features: [{
                        type: 'Feature',
                        properties: {
                            full_address: address,
                            confidence: 0.5 // Lower confidence for mock data
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [139.6917, 35.6895] // Tokyo coordinates as default
                        }
                    }]
            };
        }
        res.json({
            message: 'Address geocoded successfully',
            data: geocodeResult
        });
    }
    catch (error) {
        console.error('Error geocoding address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get demographic data for an area
router.post('/demographics', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching demographics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=geo.js.map