import express from 'express';
import {
  getEventVolunteers,
  applyForVolunteer,
  getMyVolunteerApplications,
  assignVolunteer,
  updateVolunteerStatus,
  removeVolunteer,
} from '../controllers/volunteerController.js';
import { protect, requireOrganizer, requireEventStaff } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-applications', protect, getMyVolunteerApplications);
router.post('/apply', protect, applyForVolunteer);

router.get('/events/:id/volunteers', protect, requireEventStaff, getEventVolunteers);
router.post('/events/:id/volunteers', protect, requireOrganizer, assignVolunteer);
router.put('/volunteers/:id', protect, requireOrganizer, updateVolunteerStatus);
router.delete('/volunteers/:id', protect, requireOrganizer, removeVolunteer);

export default router;
