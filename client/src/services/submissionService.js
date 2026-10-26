import api from './api';

export const submissionService = {
  // Submit deliverable for a specific round
  submitDeliverable: async (eventId, roundNumber, data) => {
    const res = await api.post(`/submissions/events/${eventId}/rounds/${roundNumber}/submissions`, data);
    return res.data;
  },

  // Get submissions for a round (Organizer / Evaluator)
  getRoundSubmissions: async (eventId, roundNumber, verdict) => {
    const params = verdict ? `?verdict=${verdict}` : '';
    const res = await api.get(`/submissions/events/${eventId}/rounds/${roundNumber}/submissions${params}`);
    return res.data;
  },

  // Evaluate a submission
  evaluateSubmission: async (submissionId, evaluationData) => {
    const res = await api.post(`/submissions/${submissionId}/evaluate`, evaluationData);
    return res.data;
  },

  // Advance teams to next round
  advanceTeams: async (eventId, roundNumber, shortlistedTeamIds, eliminateRemaining = true) => {
    const res = await api.post(`/submissions/events/${eventId}/rounds/${roundNumber}/advance`, {
      shortlistedTeamIds,
      eliminateRemaining,
    });
    return res.data;
  },

  // Get event leaderboard
  getLeaderboard: async (eventId, roundNumber) => {
    const params = roundNumber ? `?roundNumber=${roundNumber}` : '';
    const res = await api.get(`/submissions/events/${eventId}/leaderboard${params}`);
    return res.data;
  },
};

export default submissionService;
