import { Response } from 'express';
import { ProjectModel, CreateProjectRequest, UpdateProjectRequest } from '../models/Project';
import { AuthRequest } from '../types';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const projects = await ProjectModel.findByUserId(req.user.id);
    
    res.json({
      projects,
      total: projects.length
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const project = await ProjectModel.findById(id, req.user.id);
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const projectData: CreateProjectRequest = req.body;
    const project = await ProjectModel.create(req.user.id, projectData);
    
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.message === 'Project name already exists. Please choose a different name.') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const updates: UpdateProjectRequest = req.body;
    
    const project = await ProjectModel.update(id, req.user.id, updates);
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const deleted = await ProjectModel.delete(id, req.user.id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const getProjectStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const stats = await ProjectModel.getProjectStats(id, req.user.id);
    
    if (!stats) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
};