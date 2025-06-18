import pool from '../config/database';
import { User, RegisterRequest } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  static async create(userData: RegisterRequest): Promise<User> {
    const { email, password, first_name, last_name, company } = userData;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, company)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, company, role, created_at, updated_at
    `;
    
    const values = [email, password_hash, first_name, last_name, company];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  }
  
  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, company, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }
  
  static async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, first_name, last_name, company, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  static async updateProfile(id: string, updates: Partial<User>): Promise<User | null> {
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
    
    const result = await pool.query(query, [id, first_name, last_name, company]);
    return result.rows[0] || null;
  }
}