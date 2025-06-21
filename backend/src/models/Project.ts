import pool from '../config/database';
import { Project } from '../types';

export interface CreateProjectRequest {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

export class ProjectModel {
  static async create(userId: string, projectData: CreateProjectRequest): Promise<Project> {
    const { name, description, settings = {} } = projectData;
    
    // Check if project name already exists for this user
    const existingProject = await pool.query(
      'SELECT id FROM projects WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name]
    );
    
    if (existingProject.rows.length > 0) {
      throw new Error('Project name already exists. Please choose a different name.');
    }
    
    const query = `
      INSERT INTO projects (user_id, name, description, settings)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, name, description, settings, created_at, updated_at
    `;
    
    const values = [userId, name, description, JSON.stringify(settings)];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  }
  
  static async findByUserId(userId: string): Promise<Project[]> {
    const query = `
      SELECT id, user_id, name, description, settings, created_at, updated_at
      FROM projects
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
  
  static async findById(id: string, userId: string): Promise<Project | null> {
    const query = `
      SELECT id, user_id, name, description, settings, created_at, updated_at
      FROM projects
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }
  
  static async update(id: string, userId: string, updates: UpdateProjectRequest): Promise<Project | null> {
    const { name, description, settings } = updates;
    
    const query = `
      UPDATE projects 
      SET name = COALESCE($3, name),
          description = COALESCE($4, description),
          settings = COALESCE($5, settings),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, name, description, settings, created_at, updated_at
    `;
    
    const values = [
      id, 
      userId, 
      name, 
      description, 
      settings ? JSON.stringify(settings) : null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
  
  static async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM projects
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows.length > 0;
  }
  
  static async getProjectStats(projectId: string, userId: string): Promise<any> {
    const query = `
      SELECT 
        p.id,
        p.name,
        COUNT(DISTINCT l.id) as location_count,
        COUNT(DISTINCT ta.id) as trade_area_count,
        COUNT(DISTINCT c.id) as competitor_count
      FROM projects p
      LEFT JOIN locations l ON p.id = l.project_id
      LEFT JOIN trade_areas ta ON l.id = ta.location_id
      LEFT JOIN competitors c ON p.id = c.project_id
      WHERE p.id = $1 AND p.user_id = $2
      GROUP BY p.id, p.name
    `;
    
    const result = await pool.query(query, [projectId, userId]);
    return result.rows[0] || null;
  }
}