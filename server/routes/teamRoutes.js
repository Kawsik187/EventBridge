import express from 'express';
import {
  createTeam,
  joinTeamByCode,
  getTeamByInviteCode,
  getMyTeams,
  getEventAttendeeRoster,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', protect, getMyTeams);
router.get('/details/:inviteCode', getTeamByInviteCode);
router.post('/join', protect, joinTeamByCode);
router.post('/events/:eventId', protect, createTeam);
router.get('/events/:eventId/roster', protect, getEventAttendeeRoster);

export default router;
