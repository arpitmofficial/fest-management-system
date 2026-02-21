import axios from 'axios';

// Use environment variable or fallback to deployed URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://fest-management-system-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add the Token to every request if we have one
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

export default api;