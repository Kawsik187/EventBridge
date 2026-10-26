import api from './api';

export const attendanceService = {
  checkIn: async (eventId, regCode, method = 'qr_scan') => {
    const response = await api.post('/attendance/checkin', { eventId, regCode, method });
    return response.data;
  },

  getEventAttendance: async (eventId) => {
    const response = await api.get(`/attendance/events/${eventId}/attendance`);
    return response.data;
  },
};
