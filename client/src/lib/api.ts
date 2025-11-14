import axios from 'axios';

const api = axios.create({
  // Use a relative URL so Vite dev server proxy (server.proxy) can forward /api to the backend.
  // This avoids hitting the Vite dev server's HTML when requests would otherwise route incorrectly.
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear local storage and refresh page to show login
      localStorage.clear();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;