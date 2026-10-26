import api from './api';

export const adminService = {
  getPendingEvents: async () => {
    const response = await api.get('/admin/events/pending');
    return response.data;
  },

  approveEvent: async (id) => {
    const response = await api.post(`/admin/events/${id}/approve`);
    return response.data;
  },

  rejectEvent: async (id, reason) => {
    const response = await api.post(`/admin/events/${id}/reject`, { reason });
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/admin/departments');
    return response.data;
  },

  assignOrganizer: async (departmentId, data) => {
    const response = await api.post(`/admin/departments/${departmentId}/assign-organizer`, data);
    return response.data;
  },

  replaceOrganizer: async (departmentId, data) => {
    const response = await api.post(`/admin/departments/${departmentId}/replace-organizer`, data);
    return response.data;
  },

  deactivateOrganizer: async (departmentId) => {
    const response = await api.post(`/admin/departments/${departmentId}/deactivate-organizer`);
    return response.data;
  },

  getOrganizerRequests: async (params = {}) => {
    const response = await api.get('/admin/organizer-requests', { params });
    return response.data;
  },

  approveOrganizerRequest: async (requestId, replaceCurrent = false) => {
    const response = await api.post(`/admin/organizer-requests/${requestId}/approve`, { replaceCurrent });
    return response.data;
  },

  rejectOrganizerRequest: async (requestId, reason) => {
    const response = await api.post(`/admin/organizer-requests/${requestId}/reject`, { reason });
    return response.data;
  },

  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await api.put(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await api.get('/admin/audit-logs');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },
};
