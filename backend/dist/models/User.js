"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserModel {
    static async create(userData) {
        const { email, password, first_name, last_name, company } = userData;
        // Hash password
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, company)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, company, role, created_at, updated_at
    `;
        const values = [email, password_hash, first_name, last_name, company];
        const result = await database_1.default.query(query, values);
        return result.rows[0];
    }
    static async findByEmail(email) {
        const query = `
      SELECT id, email, password_hash, first_name, last_name, company, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
        const result = await database_1.default.query(query, [email]);
        return result.rows[0] || null;
    }
    static async findById(id) {
        const query = `
      SELECT id, email, first_name, last_name, company, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
        const result = await database_1.default.query(query, [id]);
        return result.rows[0] || null;
    }
    static async validatePassword(plainPassword, hashedPassword) {
        return bcryptjs_1.default.compare(plainPassword, hashedPassword);
    }
    static async updateProfile(id, updates) {
        const { first_name, last_name, company } = updates;
        const query = `
      UPDATE users 
      SET first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          company = COALESCE($4, company),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, first_name, last_name, company, role, created_at, updated_at
    `;
        const result = await database_1.default.query(query, [id, first_name, last_name, company]);
        return result.rows[0] || null;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map