import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In production, use relative path (same origin as the served app)
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, use environment variable or default to localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tenant API
export const tenantAPI = {
  getAll: () => api.get('/tenants'),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
};

// Receipt API
export const receiptAPI = {
  getAll: () => api.get('/receipts'),
  getByTenant: (tenantId) => api.get(`/receipts/tenant/${tenantId}`),
  generate: (data) => api.post('/receipts/generate', data),
  download: (id) => api.get(`/receipts/download/${id}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/receipts/${id}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
