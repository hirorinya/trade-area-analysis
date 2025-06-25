"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controllers/locationController");
const auth_1 = require("../middleware/auth");
const validation_simple_1 = require("../middleware/validation-simple");
const router = express_1.default.Router();
// All location routes require authentication
router.use(auth_1.authenticate);
// GET /api/locations/project/:projectId - Get all locations for a project
router.get('/project/:projectId', locationController_1.getLocationsByProject);
// GET /api/locations/nearby - Find nearby locations
router.get('/nearby', locationController_1.findNearbyLocations);
// GET /api/locations/:id - Get specific location
router.get('/:id', locationController_1.getLocation);
// POST /api/locations - Create new location
router.post('/', validation_simple_1.validateCreateLocation, locationController_1.createLocation);
// PUT /api/locations/:id - Update location
router.put('/:id', validation_simple_1.validateUpdateLocation, locationController_1.updateLocation);
// DELETE /api/locations/:id - Delete location
router.delete('/:id', locationController_1.deleteLocation);
exports.default = router;
//# sourceMappingURL=locations.js.map