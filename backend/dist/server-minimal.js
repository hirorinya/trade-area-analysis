"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Basic middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Simple health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Trade Area Analysis API - Minimal Version'
    });
});
// Simple auth routes without database
app.post('/api/auth/register', (req, res) => {
    res.status(501).json({
        error: 'Registration temporarily disabled - database not connected'
    });
});
app.post('/api/auth/login', (req, res) => {
    res.status(501).json({
        error: 'Login temporarily disabled - database not connected'
    });
});
app.get('/api/auth/profile', (req, res) => {
    res.status(501).json({
        error: 'Profile endpoint temporarily disabled - database not connected'
    });
});
// Root route
app.get('/api', (req, res) => {
    res.json({
        message: 'Trade Area Analysis API v1.0 - Minimal Mode',
        status: 'Running without database',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*'
        }
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`🚀 Minimal server running on port ${PORT}`);
    console.log(`📍 Mode: Development (without database)`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=server-minimal.js.map