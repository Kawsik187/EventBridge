import api from './api';

export const venueService = {
  getVenues: async () => {
    const response = await api.get('/venues');
    return response.data;
  },

  getVenueById: async (id) => {
    const response = await api.get(`/venues/${id}`);
    return response.data;
  },

  createVenue: async (venueData) => {
    const response = await api.post('/venues', venueData);
    return response.data;
  },

  updateVenue: async (id, venueData) => {
    const response = await api.put(`/venues/${id}`, venueData);
    return response.data;
  },

  checkAvailability: async (venueId, date, startTime, endTime, excludeEventId = '') => {
    const response = await api.get('/venues/check-availability', {
      params: { venueId, date, startTime, endTime, excludeEventId },
    });
    return response.data;
  },
};
