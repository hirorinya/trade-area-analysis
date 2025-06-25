"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationSchema = exports.projectSchema = exports.loginSchema = exports.registerSchema = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            res.status(400).json({
                error: 'Validation failed',
                details
            });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
// Validation schemas
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    first_name: joi_1.default.string().min(1).max(100).optional(),
    last_name: joi_1.default.string().min(1).max(100).optional(),
    company: joi_1.default.string().min(1).max(255).optional()
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
exports.projectSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(255).required(),
    description: joi_1.default.string().max(1000).optional(),
    settings: joi_1.default.object().optional()
});
exports.locationSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(255).required(),
    address: joi_1.default.string().max(500).optional(),
    coordinates: joi_1.default.object({
        type: joi_1.default.string().valid('Point').required(),
        coordinates: joi_1.default.array().items(joi_1.default.number()).length(2).required()
    }).required(),
    location_type: joi_1.default.string().max(50).optional(),
    metadata: joi_1.default.object().optional()
});
//# sourceMappingURL=validation.js.map