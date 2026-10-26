import api from './api';

export const volunteerService = {
  getEventVolunteers: async (eventId) => {
    const response = await api.get(`/volunteers/events/${eventId}/volunteers`);
    return response.data;
  },

  applyForVolunteer: async (eventId, preferredRole, task) => {
    const response = await api.post('/volunteers/apply', { eventId, preferredRole, task });
    return response.data;
  },

  getMyVolunteerApplications: async () => {
    const response = await api.get('/volunteers/my-applications');
    return response.data;
  },

  assignVolunteer: async (eventId, userEmail, roleName, task) => {
    const response = await api.post(`/volunteers/events/${eventId}/volunteers`, { eventId, userEmail, roleName, task });
    return response.data;
  },

  updateVolunteerStatus: async (id, data) => {
    const response = await api.put(`/volunteers/volunteers/${id}`, data);
    return response.data;
  },

  removeVolunteer: async (id) => {
    const response = await api.delete(`/volunteers/volunteers/${id}`);
    return response.data;
  },
};
