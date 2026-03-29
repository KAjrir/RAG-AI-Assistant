import axios from 'axios';
let relocationAttempts = 0;
const MAX_RELOCATION_ATTEMPTS = 10;

export const BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && relocationAttempts < MAX_RELOCATION_ATTEMPTS) {
      window.location.href = '/inloggen';
      relocationAttempts++
    }
    return Promise.reject(err);
  }
);