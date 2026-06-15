import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ecommerce-app-backend-1e9h.onrender.com/api',
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = global.userToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;