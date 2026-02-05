import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  Contract,
  Analysis,
  AnalysisStatusResponse,
  User,
  LoginCredentials,
  RegisterCredentials,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    // Backend attend un JSON {email, password} (pas un OAuth2 form)
    const response = await apiClient.post('/api/v1/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const response = await apiClient.post('/api/v1/auth/register', credentials);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },
};

// Contracts API
export const contractsApi = {
  getContracts: async (skip = 0, limit = 100): Promise<Contract[]> => {
    const response = await apiClient.get(`/api/v1/contracts?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getContract: async (id: string): Promise<Contract> => {
    const response = await apiClient.get(`/api/v1/contracts/${id}`);
    return response.data;
  },

  uploadContract: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/v1/contracts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  getContractStatus: async (id: string): Promise<AnalysisStatusResponse> => {
    const response = await apiClient.get(`/api/v1/contracts/${id}/status`);
    return response.data;
  },

  getContractAnalysis: async (id: string): Promise<Analysis> => {
    const response = await apiClient.get(`/api/v1/contracts/${id}/analysis`);
    return response.data;
  },
};
