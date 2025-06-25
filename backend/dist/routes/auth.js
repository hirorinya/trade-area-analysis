"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validation_simple_1 = require("../middleware/validation-simple");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes with simple validation
router.post('/register', validation_simple_1.validateRegister, authController_1.register);
router.post('/login', validation_simple_1.validateLogin, authController_1.login);
// Protected routes
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.put('/profile', auth_1.authenticate, authController_1.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map