import axios from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token } = response.data;
          localStorage.setItem('token', access_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', userData);
    return response.data.user;
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData: any) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  update: async (id: string, projectData: any) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

// Trade Areas API
export const tradeAreasApi = {
  getByProject: async (projectId: string) => {
    const response = await api.get(`/trade-areas/project/${projectId}`);
    return response.data;
  },

  create: async (tradeAreaData: any) => {
    const response = await api.post('/trade-areas', tradeAreaData);
    return response.data;
  },

  update: async (id: string, tradeAreaData: any) => {
    const response = await api.put(`/trade-areas/${id}`, tradeAreaData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/trade-areas/${id}`);
    return response.data;
  },
};

export default api;