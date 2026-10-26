import express from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  submitForApproval,
  publishEvent,
  deleteEvent,
  getOrganizerAnalytics,
} from '../controllers/eventController.js';
import { protect, requireOrganizer } from '../middleware/auth.js';

const router = express.Router();

router.get('/analytics/organizer', protect, requireOrganizer, getOrganizerAnalytics);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', protect, requireOrganizer, createEvent);
router.put('/:id', protect, requireOrganizer, updateEvent);
router.post('/:id/submit', protect, requireOrganizer, submitForApproval);
router.post('/:id/publish', protect, requireOrganizer, publishEvent);
router.delete('/:id', protect, requireOrganizer, deleteEvent);

export default router;
