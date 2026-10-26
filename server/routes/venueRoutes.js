import express from 'express';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  checkAvailability,
} from '../controllers/venueController.js';
import { protect, requireAdmin, requireOrganizer } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getVenues);
router.get('/check-availability', checkAvailability);
router.get('/:id', getVenueById);
router.post('/', protect, requireAdmin, createVenue);
router.put('/:id', protect, requireAdmin, updateVenue);

export default router;
