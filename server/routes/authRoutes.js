import express from 'express';
import {
  registerUser,
  registerStudent,
  registerHostOrganization,
  loginUser,
  logoutUser,
  googleAuth,
  requestOrganizerAccess,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/register/student', registerStudent);
router.post('/register/host', registerHostOrganization);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/google', googleAuth);
router.post('/request-organizer', requestOrganizerAccess);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
