import express from 'express';
import {
  submitRoundDeliverable,
  getRoundSubmissions,
  evaluateSubmission,
  advanceTeamsToNextRound,
  getEventLeaderboard,
} from '../controllers/submissionController.js';
import { protect, requireOrganizer } from '../middleware/auth.js';

const router = express.Router();

// Public leaderboard
router.get('/events/:eventId/leaderboard', getEventLeaderboard);

// Round submissions & advance
router.post('/events/:eventId/rounds/:roundNumber/submissions', protect, submitRoundDeliverable);
router.get('/events/:eventId/rounds/:roundNumber/submissions', protect, requireOrganizer, getRoundSubmissions);
router.post('/events/:eventId/rounds/:roundNumber/advance', protect, requireOrganizer, advanceTeamsToNextRound);

// Evaluator scoring
router.post('/:submissionId/evaluate', protect, requireOrganizer, evaluateSubmission);

export default router;
