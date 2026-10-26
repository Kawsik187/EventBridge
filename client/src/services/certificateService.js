import api from './api';

export const certificateService = {
  generateCertificates: async (eventId, certificateType = 'Participation') => {
    const response = await api.post('/certificates/generate', { eventId, certificateType });
    return response.data;
  },

  issueSingleCertificate: async (eventId, studentId, certificateType = 'Winner') => {
    const response = await api.post('/certificates/issue-single', { eventId, studentId, certificateType });
    return response.data;
  },

  getMyCertificates: async () => {
    const response = await api.get('/certificates/me');
    return response.data;
  },

  getCertificateById: async (id) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  verifyCertificate: async (id) => {
    const response = await api.get(`/certificates/verify/${id}`);
    return response.data;
  },
};
