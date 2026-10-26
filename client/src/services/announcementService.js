import api from './api';

export const announcementService = {
  createAnnouncement: async (announcementData) => {
    const response = await api.post('/announcements', announcementData);
    return response.data;
  },

  getEventAnnouncements: async (eventId) => {
    const response = await api.get(`/announcements/events/${eventId}`);
    return response.data;
  },

  getStudentAnnouncements: async () => {
    const response = await api.get('/announcements/student');
    return response.data;
  },
};
