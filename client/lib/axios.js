import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const activeRole = localStorage.getItem('activeRole') || sessionStorage.getItem('activeRole');

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      if (activeRole) {
        config.headers['x-active-role'] = activeRole;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;