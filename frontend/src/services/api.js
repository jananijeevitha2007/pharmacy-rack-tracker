import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password) => api.post('/auth/register', { username, password }),
  getMe: () => api.get('/auth/me'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/'),
};

export const medicationsAPI = {
  getAll: (params) => api.get('/medications/', { params }),
  getOne: (id) => api.get(`/medications/${id}`),
  create: (data) => api.post('/medications/', data),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`),
  getExpiring: () => api.get('/medications/alerts/expiring'),
};

export const racksAPI = {
  getAll: () => api.get('/racks/'),
  getOne: (id) => api.get(`/racks/${id}`),
  create: (data) => api.post('/racks/', data),
  update: (id, data) => api.put(`/racks/${id}`, data),
  delete: (id) => api.delete(`/racks/${id}`),
};

export const billsAPI = {
  getAll: () => api.get('/bills/'),
  getOne: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills/', data),
  void: (id) => api.post(`/bills/${id}/void`),
  delete: (id) => api.delete(`/bills/${id}`),
};

export default api;
