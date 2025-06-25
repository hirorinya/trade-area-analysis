"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const router = express_1.default.Router();
// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Trade Area Analysis API'
    });
});
// Auth routes
router.use('/auth', auth_1.default);
// API info
router.get('/', (req, res) => {
    res.json({
        message: 'Trade Area Analysis API v1.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth'
        }
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map