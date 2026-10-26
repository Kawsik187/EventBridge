import express from 'express';
import {
  generateCertificatesForEvent,
  issueSingleCertificate,
  getMyCertificates,
  getCertificateById,
} from '../controllers/certificateController.js';
import { protect, requireOrganizer } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyCertificates);
router.get('/my-certificates', protect, getMyCertificates);
router.get('/verify/:id', getCertificateById);
router.get('/:id', getCertificateById);
router.post('/generate', protect, requireOrganizer, generateCertificatesForEvent);
router.post('/issue-single', protect, requireOrganizer, issueSingleCertificate);

export default router;
