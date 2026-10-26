import express from 'express';
import {
  createAnnouncement,
  getEventAnnouncements,
  getStudentAnnouncements,
} from '../controllers/announcementController.js';
import { protect, requireOrganizer } from '../middleware/auth.js';

const router = express.Router();

router.get('/student', protect, getStudentAnnouncements);
router.get('/events/:id', protect, getEventAnnouncements);
router.post('/', protect, requireOrganizer, createAnnouncement);

export default router;
