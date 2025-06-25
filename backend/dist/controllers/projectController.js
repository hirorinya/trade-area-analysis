"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectStats = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const Project_1 = require("../models/Project");
const getProjects = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const projects = await Project_1.ProjectModel.findByUserId(req.user.id);
        res.json({
            projects,
            total: projects.length
        });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
exports.getProjects = getProjects;
const getProject = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const project = await Project_1.ProjectModel.findById(id, req.user.id);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json({ project });
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};
exports.getProject = getProject;
const createProject = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const projectData = req.body;
        const project = await Project_1.ProjectModel.create(req.user.id, projectData);
        res.status(201).json({
            message: 'Project created successfully',
            project
        });
    }
    catch (error) {
        console.error('Create project error:', error);
        if (error.message === 'Project name already exists. Please choose a different name.') {
            res.status(409).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const updates = req.body;
        const project = await Project_1.ProjectModel.update(id, req.user.id, updates);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json({
            message: 'Project updated successfully',
            project
        });
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const deleted = await Project_1.ProjectModel.delete(id, req.user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
const getProjectStats = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { id } = req.params;
        const stats = await Project_1.ProjectModel.getProjectStats(id, req.user.id);
        if (!stats) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json({ stats });
    }
    catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ error: 'Failed to fetch project statistics' });
    }
};
exports.getProjectStats = getProjectStats;
//# sourceMappingURL=projectController.js.map