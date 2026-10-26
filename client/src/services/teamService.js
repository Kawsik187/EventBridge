import api from './api';

export const teamService = {
  // Create a new team for an event
  createTeam: async (eventId, teamName) => {
    const res = await api.post(`/teams/events/${eventId}`, { teamName });
    return res.data;
  },

  // Join a team using invite code
  joinTeam: async (inviteCode) => {
    const res = await api.post('/teams/join', { inviteCode });
    return res.data;
  },

  // Get team preview by invite code
  getTeamDetails: async (inviteCode) => {
    const res = await api.get(`/teams/details/${inviteCode}`);
    return res.data;
  },

  // Get current user's teams
  getMyTeams: async () => {
    const res = await api.get('/teams/my');
    return res.data;
  },
};

export default teamService;
