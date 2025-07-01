"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeAreaModel = void 0;
const database_1 = __importDefault(require("../config/database"));
class TradeAreaModel {
    static async create(tradeAreaData) {
        const { location_id, name, area_type, parameters, geometry, demographics_data = {} } = tradeAreaData;
        const query = `
      INSERT INTO trade_areas (location_id, name, area_type, parameters, geometry, demographics_data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, location_id, name, area_type, parameters, 
                ST_AsGeoJSON(geometry) as geometry, demographics_data, created_at
    `;
        const values = [
            location_id,
            name,
            area_type,
            JSON.stringify(parameters),
            geometry ? `ST_GeomFromGeoJSON('${JSON.stringify(geometry)}')` : null,
            JSON.stringify(demographics_data)
        ];
        const result = await database_1.default.query(query, values);
        const row = result.rows[0];
        return {
            ...row,
            geometry: row.geometry ? JSON.parse(row.geometry) : null,
            parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
            demographics_data: typeof row.demographics_data === 'string' ? JSON.parse(row.demographics_data) : row.demographics_data
        };
    }
    static async findByLocationId(locationId) {
        const query = `
      SELECT id, location_id, name, area_type, parameters, 
             ST_AsGeoJSON(geometry) as geometry, demographics_data, created_at
      FROM trade_areas
      WHERE location_id = $1
      ORDER BY created_at DESC
    `;
        const result = await database_1.default.query(query, [locationId]);
        return result.rows.map(row => ({
            ...row,
            geometry: row.geometry ? JSON.parse(row.geometry) : null,
            parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
            demographics_data: typeof row.demographics_data === 'string' ? JSON.parse(row.demographics_data) : row.demographics_data
        }));
    }
    static async findByProjectId(projectId) {
        const query = `
      SELECT ta.id, ta.location_id, ta.name, ta.area_type, ta.parameters, 
             ST_AsGeoJSON(ta.geometry) as geometry, ta.demographics_data, ta.created_at
      FROM trade_areas ta
      JOIN locations l ON ta.location_id = l.id
      WHERE l.project_id = $1
      ORDER BY ta.created_at DESC
    `;
        const result = await database_1.default.query(query, [projectId]);
        return result.rows.map(row => ({
            ...row,
            geometry: row.geometry ? JSON.parse(row.geometry) : null,
            parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
            demographics_data: typeof row.demographics_data === 'string' ? JSON.parse(row.demographics_data) : row.demographics_data
        }));
    }
    static async findById(id) {
        const query = `
      SELECT id, location_id, name, area_type, parameters, 
             ST_AsGeoJSON(geometry) as geometry, demographics_data, created_at
      FROM trade_areas
      WHERE id = $1
    `;
        const result = await database_1.default.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            ...row,
            geometry: row.geometry ? JSON.parse(row.geometry) : null,
            parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
            demographics_data: typeof row.demographics_data === 'string' ? JSON.parse(row.demographics_data) : row.demographics_data
        };
    }
    static async update(id, updates) {
        const { name, area_type, parameters, geometry, demographics_data } = updates;
        const query = `
      UPDATE trade_areas 
      SET name = COALESCE($2, name),
          area_type = COALESCE($3, area_type),
          parameters = COALESCE($4, parameters),
          geometry = COALESCE($5, geometry),
          demographics_data = COALESCE($6, demographics_data)
      WHERE id = $1
      RETURNING id, location_id, name, area_type, parameters, 
                ST_AsGeoJSON(geometry) as geometry, demographics_data, created_at
    `;
        const values = [
            id,
            name,
            area_type,
            parameters ? JSON.stringify(parameters) : null,
            geometry ? `ST_GeomFromGeoJSON('${JSON.stringify(geometry)}')` : null,
            demographics_data ? JSON.stringify(demographics_data) : null
        ];
        const result = await database_1.default.query(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            ...row,
            geometry: row.geometry ? JSON.parse(row.geometry) : null,
            parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
            demographics_data: typeof row.demographics_data === 'string' ? JSON.parse(row.demographics_data) : row.demographics_data
        };
    }
    static async delete(id) {
        const query = `
      DELETE FROM trade_areas
      WHERE id = $1
      RETURNING id
    `;
        const result = await database_1.default.query(query, [id]);
        return result.rows.length > 0;
    }
    static async validateLocationOwnership(locationId, userId) {
        const query = `
      SELECT l.id
      FROM locations l
      JOIN projects p ON l.project_id = p.id
      WHERE l.id = $1 AND p.user_id = $2
    `;
        const result = await database_1.default.query(query, [locationId, userId]);
        return result.rows.length > 0;
    }
}
exports.TradeAreaModel = TradeAreaModel;
//# sourceMappingURL=TradeArea.js.map