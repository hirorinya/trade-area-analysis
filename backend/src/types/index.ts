export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: string;
  project_id: string;
  name: string;
  address?: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  location_type: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface TradeArea {
  id: string;
  location_id: string;
  name: string;
  area_type: 'drive_time' | 'distance' | 'custom';
  parameters: {
    minutes?: number;
    miles?: number;
    [key: string]: any;
  };
  geometry?: any; // GeoJSON polygon
  demographics_data: Record<string, any>;
  created_at: Date;
}

export interface Competitor {
  id: string;
  project_id: string;
  name: string;
  brand?: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  category?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  company?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}