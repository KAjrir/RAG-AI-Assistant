import axios from 'axios';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    // if (err.response?.status === 401) {
    //   window.location.href = '/inloggen';
    // }
    return Promise.reject(err);
  }
);