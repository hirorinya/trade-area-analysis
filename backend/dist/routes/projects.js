"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const auth_1 = require("../middleware/auth");
const validation_simple_1 = require("../middleware/validation-simple");
const router = express_1.default.Router();
// All project routes require authentication
router.use(auth_1.authenticate);
// GET /api/projects - Get all projects for authenticated user
router.get('/', projectController_1.getProjects);
// GET /api/projects/:id - Get specific project
router.get('/:id', projectController_1.getProject);
// POST /api/projects - Create new project
router.post('/', validation_simple_1.validateCreateProject, projectController_1.createProject);
// PUT /api/projects/:id - Update project
router.put('/:id', validation_simple_1.validateUpdateProject, projectController_1.updateProject);
// DELETE /api/projects/:id - Delete project
router.delete('/:id', projectController_1.deleteProject);
// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', projectController_1.getProjectStats);
exports.default = router;
//# sourceMappingURL=projects.js.map