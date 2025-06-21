import express from 'express';
import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject, 
  getProjectStats 
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { validateCreateProject, validateUpdateProject } from '../middleware/validation-simple';

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

// GET /api/projects - Get all projects for authenticated user
router.get('/', getProjects);

// GET /api/projects/:id - Get specific project
router.get('/:id', getProject);

// POST /api/projects - Create new project
router.post('/', validateCreateProject, createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', validateUpdateProject, updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', getProjectStats);

export default router;