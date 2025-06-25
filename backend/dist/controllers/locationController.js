"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearbyLocations = exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocation = exports.getLocationsByProject = void 0;
const Location_1 = require("../models/Location");
const getLocationsByProject = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { projectId } = req.params;
        const locations = await Location_1.LocationModel.findByProjectId(projectId, req.user.id);
        res.json({
            locations,
            total: locations.length
        });
    }
    catch (error) {
        console.error('Get locations error:', error);
        if (error.message === 'Project not found or access denied') {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to fetch locations' });
        }
    }
};
exports.getLocationsByProject = getLocationsByProject;
const getLocation = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const location = await Location_1.LocationModel.findById(id, req.user.id);
        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }
        res.json({ location });
    }
    catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ error: 'Failed to fetch location' });
    }
};
exports.getLocation = getLocation;
const createLocation = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const locationData = req.body;
        const location = await Location_1.LocationModel.create(req.user.id, locationData);
        res.status(201).json({
            message: 'Location created successfully',
            location
        });
    }
    catch (error) {
        console.error('Create location error:', error);
        if (error.message === 'Project not found or access denied') {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create location' });
        }
    }
};
exports.createLocation = createLocation;
const updateLocation = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const updates = req.body;
        const location = await Location_1.LocationModel.update(id, req.user.id, updates);
        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }
        res.json({
            message: 'Location updated successfully',
            location
        });
    }
    catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};
exports.updateLocation = updateLocation;
const deleteLocation = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const deleted = await Location_1.LocationModel.delete(id, req.user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }
        res.json({ message: 'Location deleted successfully' });
    }
    catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ error: 'Failed to delete location' });
    }
};
exports.deleteLocation = deleteLocation;
const findNearbyLocations = async (req, res) => {
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
        const radiusKm = radius ? parseFloat(radius) : 5; // Default 5km
        const locations = await Location_1.LocationModel.findNearby(parseFloat(latitude), parseFloat(longitude), radiusKm, req.user.id);
        res.json({
            locations,
            total: locations.length,
            search_params: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius_km: radiusKm
            }
        });
    }
    catch (error) {
        console.error('Find nearby locations error:', error);
        res.status(500).json({ error: 'Failed to find nearby locations' });
    }
};
exports.findNearbyLocations = findNearbyLocations;
//# sourceMappingURL=locationController.js.map