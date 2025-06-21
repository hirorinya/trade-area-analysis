import pool from '../config/database';
import { Location } from '../types';

export interface CreateLocationRequest {
  project_id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  location_type: 'store' | 'competitor' | 'poi';
  metadata?: Record<string, any>;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  location_type?: 'store' | 'competitor' | 'poi';
  metadata?: Record<string, any>;
}

export class LocationModel {
  static async create(userId: string, locationData: CreateLocationRequest): Promise<Location> {
    const { project_id, name, address, latitude, longitude, location_type, metadata = {} } = locationData;
    
    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      throw new Error('Project not found or access denied');
    }
    
    const query = `
      INSERT INTO locations (project_id, name, address, coordinates, location_type, metadata)
      VALUES ($1, $2, $3, ST_SetSRID(ST_Point($4, $5), 4326), $6, $7)
      RETURNING id, project_id, name, address, 
                ST_X(coordinates) as longitude, 
                ST_Y(coordinates) as latitude,
                location_type, metadata, created_at
    `;
    
    const values = [project_id, name, address, longitude, latitude, location_type, JSON.stringify(metadata)];
    const result = await pool.query(query, values);
    
    const location = result.rows[0];
    return {
      ...location,
      coordinates: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    };
  }
  
  static async findByProjectId(projectId: string, userId: string): Promise<Location[]> {
    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      throw new Error('Project not found or access denied');
    }
    
    const query = `
      SELECT id, project_id, name, address, 
             ST_X(coordinates) as longitude, 
             ST_Y(coordinates) as latitude,
             location_type, metadata, created_at
      FROM locations
      WHERE project_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [projectId]);
    
    return result.rows.map(location => ({
      ...location,
      coordinates: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    }));
  }
  
  static async findById(id: string, userId: string): Promise<Location | null> {
    const query = `
      SELECT l.id, l.project_id, l.name, l.address, 
             ST_X(l.coordinates) as longitude, 
             ST_Y(l.coordinates) as latitude,
             l.location_type, l.metadata, l.created_at
      FROM locations l
      JOIN projects p ON l.project_id = p.id
      WHERE l.id = $1 AND p.user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const location = result.rows[0];
    return {
      ...location,
      coordinates: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    };
  }
  
  static async update(id: string, userId: string, updates: UpdateLocationRequest): Promise<Location | null> {
    const { name, address, latitude, longitude, location_type, metadata } = updates;
    
    const query = `
      UPDATE locations 
      SET name = COALESCE($3, name),
          address = COALESCE($4, address),
          coordinates = CASE 
            WHEN $5 IS NOT NULL AND $6 IS NOT NULL 
            THEN ST_SetSRID(ST_Point($6, $5), 4326)
            ELSE coordinates 
          END,
          location_type = COALESCE($7, location_type),
          metadata = COALESCE($8, metadata)
      FROM projects p
      WHERE locations.id = $1 AND locations.project_id = p.id AND p.user_id = $2
      RETURNING locations.id, locations.project_id, locations.name, locations.address, 
                ST_X(locations.coordinates) as longitude, 
                ST_Y(locations.coordinates) as latitude,
                locations.location_type, locations.metadata, locations.created_at
    `;
    
    const values = [
      id, 
      userId, 
      name, 
      address, 
      latitude, 
      longitude, 
      location_type, 
      metadata ? JSON.stringify(metadata) : null
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const location = result.rows[0];
    return {
      ...location,
      coordinates: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    };
  }
  
  static async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM locations 
      USING projects p
      WHERE locations.id = $1 AND locations.project_id = p.id AND p.user_id = $2
      RETURNING locations.id
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows.length > 0;
  }
  
  static async findNearby(latitude: number, longitude: number, radiusKm: number, userId: string): Promise<Location[]> {
    const query = `
      SELECT l.id, l.project_id, l.name, l.address, 
             ST_X(l.coordinates) as longitude, 
             ST_Y(l.coordinates) as latitude,
             l.location_type, l.metadata, l.created_at,
             ST_Distance(l.coordinates::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography) as distance_meters
      FROM locations l
      JOIN projects p ON l.project_id = p.id
      WHERE p.user_id = $3
      AND ST_DWithin(l.coordinates::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography, $4)
      ORDER BY distance_meters ASC
    `;
    
    const result = await pool.query(query, [longitude, latitude, userId, radiusKm * 1000]);
    
    return result.rows.map(location => ({
      ...location,
      coordinates: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    }));
  }
}