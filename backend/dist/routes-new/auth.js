"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Temporary simple routes for testing
router.post('/register', (req, res) => {
    res.status(501).json({
        message: 'Registration endpoint - temporarily simplified',
        body: req.body
    });
});
router.post('/login', (req, res) => {
    res.status(501).json({
        message: 'Login endpoint - temporarily simplified',
        body: req.body
    });
});
router.get('/profile', (req, res) => {
    res.status(501).json({
        message: 'Profile endpoint - temporarily simplified'
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map