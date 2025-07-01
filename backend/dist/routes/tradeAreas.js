"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const TradeArea_1 = require("../models/TradeArea");
const router = express_1.default.Router();
// Get all trade areas for a project
router.get('/project/:projectId', auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        // Validate project ownership
        const { ProjectModel } = await Promise.resolve().then(() => __importStar(require('../models/Project')));
        const project = await ProjectModel.findById(projectId, userId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }
        const tradeAreas = await TradeArea_1.TradeAreaModel.findByProjectId(projectId);
        res.json({
            message: 'Trade areas retrieved successfully',
            projectId,
            data: tradeAreas
        });
    }
    catch (error) {
        console.error('Error fetching trade areas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new trade area
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { location_id, name, area_type, parameters, geometry, demographics_data } = req.body;
        const userId = req.user.id;
        // Basic validation
        if (!location_id || !name || !area_type || !parameters) {
            return res.status(400).json({
                error: 'Missing required fields: location_id, name, area_type, parameters'
            });
        }
        // Validate location ownership
        const hasAccess = await TradeArea_1.TradeAreaModel.validateLocationOwnership(location_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this location' });
        }
        const tradeAreaData = {
            location_id,
            name,
            area_type: area_type,
            parameters,
            geometry,
            demographics_data
        };
        const tradeArea = await TradeArea_1.TradeAreaModel.create(tradeAreaData);
        res.status(201).json({
            message: 'Trade area created successfully',
            data: tradeArea
        });
    }
    catch (error) {
        console.error('Error creating trade area:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get trade area by ID
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const tradeArea = await TradeArea_1.TradeAreaModel.findById(id);
        if (!tradeArea) {
            return res.status(404).json({ error: 'Trade area not found' });
        }
        // Validate access through location ownership
        const hasAccess = await TradeArea_1.TradeAreaModel.validateLocationOwnership(tradeArea.location_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this trade area' });
        }
        res.json({
            message: 'Trade area retrieved successfully',
            data: tradeArea
        });
    }
    catch (error) {
        console.error('Error fetching trade area:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update trade area
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, area_type, parameters, geometry, demographics_data } = req.body;
        const userId = req.user.id;
        // Check if trade area exists
        const existingTradeArea = await TradeArea_1.TradeAreaModel.findById(id);
        if (!existingTradeArea) {
            return res.status(404).json({ error: 'Trade area not found' });
        }
        // Validate access through location ownership
        const hasAccess = await TradeArea_1.TradeAreaModel.validateLocationOwnership(existingTradeArea.location_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this trade area' });
        }
        const updates = {
            name,
            area_type: area_type,
            parameters,
            geometry,
            demographics_data
        };
        const updatedTradeArea = await TradeArea_1.TradeAreaModel.update(id, updates);
        if (!updatedTradeArea) {
            return res.status(404).json({ error: 'Trade area not found after update' });
        }
        res.json({
            message: 'Trade area updated successfully',
            data: updatedTradeArea
        });
    }
    catch (error) {
        console.error('Error updating trade area:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete trade area
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if trade area exists and validate access
        const existingTradeArea = await TradeArea_1.TradeAreaModel.findById(id);
        if (!existingTradeArea) {
            return res.status(404).json({ error: 'Trade area not found' });
        }
        // Validate access through location ownership
        const hasAccess = await TradeArea_1.TradeAreaModel.validateLocationOwnership(existingTradeArea.location_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this trade area' });
        }
        const deleted = await TradeArea_1.TradeAreaModel.delete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Trade area not found' });
        }
        res.json({
            message: 'Trade area deleted successfully',
            id
        });
    }
    catch (error) {
        console.error('Error deleting trade area:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=tradeAreas.js.map