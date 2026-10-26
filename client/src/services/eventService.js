import api from './api';

export const eventService = {
  getAllEvents: async (params = {}) => {
    try {
      const response = await api.get('/events', { params });
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.events)) {
        return response.data.events;
      }
      return [];
    } catch (err) {
      console.warn('[eventService] Failed to load events from backend:', err?.message || err);
      return [];
    }
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  submitForApproval: async (id) => {
    const response = await api.post(`/events/${id}/submit`);
    return response.data;
  },

  publishEvent: async (id) => {
    const response = await api.post(`/events/${id}/publish`);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getOrganizerAnalytics: async () => {
    const response = await api.get('/events/analytics/organizer');
    return response.data;
  },

  getOrganizerEvents: async (params = {}) => {
    const userStr = localStorage.getItem('eventbridge_user');
    let organizerId = '';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        organizerId = u._id || '';
      } catch (e) {
        // ignore
      }
    }
    const response = await api.get('/events', { params: { organizerId, status: '', ...params } });
    return response.data;
  },
};
