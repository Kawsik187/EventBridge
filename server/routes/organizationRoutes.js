import express from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationBySlug,
} from '../controllers/organizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getOrganizations);
router.get('/:slug', getOrganizationBySlug);
router.post('/', protect, createOrganization);

export default router;
