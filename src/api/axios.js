import axios from 'axios';

// Dynamically use the Render backend URL in production, or fallback to localhost for development
const API_BASE_URL = 'https://whitewallbridal-backend.onrender.com/api';

const API = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;