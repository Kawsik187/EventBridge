import express from 'express';
import { checkInParticipant, getEventAttendance } from '../controllers/attendanceController.js';
import { protect, requireEventStaff } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkin', protect, requireEventStaff, checkInParticipant);
router.post('/check-in', protect, requireEventStaff, checkInParticipant);
router.get('/events/:id/attendance', protect, requireEventStaff, getEventAttendance);

export default router;
