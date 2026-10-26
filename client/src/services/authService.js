import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data) {
      localStorage.setItem('eventbridge_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data) {
      localStorage.setItem('eventbridge_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  registerHost: async (hostData) => {
    const response = await api.post('/auth/register/host', hostData);
    if (response.data) {
      localStorage.setItem('eventbridge_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  googleLogin: async (credentialData) => {
    const response = await api.post('/auth/google', credentialData);
    if (response.data) {
      localStorage.setItem('eventbridge_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  requestOrganizerAccess: async (requestData) => {
    const response = await api.post('/auth/request-organizer', requestData);
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('eventbridge_user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    if (response.data) {
      const current = JSON.parse(localStorage.getItem('eventbridge_user') || '{}');
      localStorage.setItem('eventbridge_user', JSON.stringify({ ...current, ...response.data }));
    }
    return response.data;
  },

  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('eventbridge_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },
};
