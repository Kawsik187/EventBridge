import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('eventbridge_user') || localStorage.getItem('campusflow_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        // Invalid json
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle invalid/expired auth sessions cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const msg = error.response.data?.message || '';
      if (
        msg.includes('Not authorized') ||
        msg.includes('invalid or expired token') ||
        msg.includes('deactivated')
      ) {
        localStorage.removeItem('eventbridge_user');
        localStorage.removeItem('campusflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
