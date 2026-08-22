import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In production, use relative path (same origin as the served app)
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, use environment variable or default to localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
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
  config => {
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tenant API
export const tenantAPI = {
  getAll: () => api.get('/tenants'),
  getById: id => api.get(`/tenants/${id}`),
  create: data => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: id => api.delete(`/tenants/${id}`),
};

// Receipt API
export const receiptAPI = {
  getAll: () => api.get('/receipts'),
  getByTenant: tenantId => api.get(`/receipts/tenant/${tenantId}`),
  generate: data => api.post('/receipts/generate', data),
  download: id => api.get(`/receipts/download/${id}`, { responseType: 'blob' }),
  sendEmail: id => api.post(`/receipts/email/${id}`),
  delete: id => api.delete(`/receipts/${id}`),

  // Task 1.1.3: Payment Status Management API
  updatePaymentStatus: (id, status) => api.patch(`/receipts/${id}/payment-status`, { status }),
  recordPayment: (id, paymentData) => api.post(`/receipts/${id}/record-payment`, paymentData),
  getByPaymentStatus: status => api.get(`/receipts/payment-status/${status}`),
  getPaymentHistory: id => api.get(`/receipts/${id}/payment-history`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Task 1.2.4: Reminder API
export const reminderAPI = {
  getStatus: () => api.get('/reminders/status'),
  getStatistics: (days = 30) => api.get(`/reminders/statistics?days=${days}`),
  triggerManual: () => api.post('/reminders/trigger'),
  updateConfig: config => api.put('/reminders/config', config),
  start: () => api.post('/reminders/start'),
  stop: () => api.post('/reminders/stop'),
};

export default api;
