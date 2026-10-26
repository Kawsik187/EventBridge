import api from './api';

export const organizationService = {
  // Get all approved colleges / host organizations
  getOrganizations: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/organizations${query ? `?${query}` : ''}`);
    return res.data;
  },

  // Get organization profile & hosted events
  getOrganizationBySlug: async (slug) => {
    const res = await api.get(`/organizations/${slug}`);
    return res.data;
  },

  // Register new organization
  createOrganization: async (orgData) => {
    const res = await api.post('/organizations', orgData);
    return res.data;
  },
};

export default organizationService;
