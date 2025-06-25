"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const projects_1 = __importDefault(require("./projects"));
const locations_1 = __importDefault(require("./locations"));
const tradeAreas_1 = __importDefault(require("./tradeAreas"));
const geo_1 = __importDefault(require("./geo"));
const router = express_1.default.Router();
// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Trade Area Analysis API'
    });
});
// API routes
router.use('/auth', auth_1.default);
router.use('/projects', projects_1.default);
router.use('/locations', locations_1.default);
router.use('/trade-areas', tradeAreas_1.default);
router.use('/geo', geo_1.default);
// API info
router.get('/', (req, res) => {
    res.json({
        message: 'Trade Area Analysis API v1.0',
        documentation: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            projects: '/api/projects',
            locations: '/api/locations',
            tradeAreas: '/api/trade-areas',
            geo: '/api/geo'
        }
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map