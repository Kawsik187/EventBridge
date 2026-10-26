import express from 'express';
import {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
} from '../controllers/registrationController.js';
import { protect, requireOrganizer, requireEventStaff } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyRegistrations);
router.get('/my-registrations', protect, getMyRegistrations);
router.post('/events/:id/register', protect, registerForEvent);
router.get('/events/:id/registrations', protect, requireEventStaff, getEventRegistrations);
router.delete('/events/:id/register', protect, cancelRegistration);

export default router;
