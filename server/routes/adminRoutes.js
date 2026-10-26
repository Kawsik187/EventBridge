import express from 'express';
import {
  getPendingEvents,
  approveEvent,
  rejectEvent,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getAdminAnalytics,
  getAdminDepartments,
  assignOrganizerToDepartment,
  replaceOrganizer,
  deactivateDepartmentOrganizer,
  getOrganizerRequests,
  approveOrganizerRequest,
  rejectOrganizerRequest,
  getAdminAuditLogs,
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireAdmin);

// Event Approvals
router.get('/events/pending', getPendingEvents);
router.post('/events/:id/approve', approveEvent);
router.post('/events/:id/reject', rejectEvent);

// Department Management
router.get('/departments', getAdminDepartments);
router.post('/departments/:id/assign-organizer', assignOrganizerToDepartment);
router.post('/departments/:id/replace-organizer', replaceOrganizer);
router.post('/departments/:id/deactivate-organizer', deactivateDepartmentOrganizer);

// Organizer Access Requests
router.get('/organizer-requests', getOrganizerRequests);
router.post('/organizer-requests/:id/approve', approveOrganizerRequest);
router.post('/organizer-requests/:id/reject', rejectOrganizerRequest);

// User Management & Audit
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.get('/audit-logs', getAdminAuditLogs);
router.get('/analytics', getAdminAnalytics);

export default router;
