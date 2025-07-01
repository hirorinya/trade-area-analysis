export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
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

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface TradeArea {
  id: string;
  name: string;
  project_id: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  drive_time_minutes: number;
  population: number;
  households: number;
  median_income: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  project_id: string;
  address: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  location_type: 'store' | 'competitor' | 'poi';
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  details?: Record<string, unknown>;
}

export interface OptimizationResult {
  id: string;
  score: number;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  metrics: {
    population: number;
    competition: number;
    accessibility: number;
    market_potential: number;
  };
  recommendation: string;
}

export interface OptimizationParams {
  algorithm: 'greedy' | 'genetic' | 'mip';
  max_locations: number;
  min_distance: number;
  weights: {
    population: number;
    competition: number;
    accessibility: number;
  };
}

export interface StoreData {
  id: string;
  name: string;
  location: [number, number];
  performance_score?: number;
}

export interface HistoricalData {
  date: string;
  revenue: number;
  customers: number;
  transactions: number;
}