import axios from 'axios';
const relocationAttempts = 0;
const MAX_RELOCATION_ATTEMPTS = 10;

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
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