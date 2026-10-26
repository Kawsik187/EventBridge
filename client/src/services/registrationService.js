import api from './api';

export const registrationService = {
  registerForEvent: async (eventId, customResponses = {}) => {
    const response = await api.post(`/registrations/events/${eventId}/register`, { customResponses });
    return response.data;
  },

  getMyRegistrations: async () => {
    const response = await api.get('/registrations/me');
    return response.data;
  },

  getEventRegistrations: async (eventId) => {
    const response = await api.get(`/registrations/events/${eventId}/registrations`);
    return response.data;
  },

  cancelRegistration: async (eventId) => {
    const response = await api.delete(`/registrations/events/${eventId}/register`);
    return response.data;
  },
};
