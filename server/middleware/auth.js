import { verifyToken } from '../utils/jwtHelper.js';
import User from '../models/User.js';
import Volunteer from '../models/Volunteer.js';
import Event from '../models/Event.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = verifyToken(token);

    req.user = await User.findById(decoded.id)
      .select('-password')
      .populate('departmentId', 'name code activeOrganizerId')
      .populate('collegeProfileId');

    if (!req.user) {
      return res.status(401).json({ message: 'User account not found' });
    }

    if (req.user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact campus admin.' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

export const requireStudent = requireRole('student', 'participant', 'college_admin', 'organizer', 'org_admin', 'admin', 'super_admin', 'evaluator');
export const requireAdmin = requireRole('admin', 'super_admin');
export const requireCollegeAdmin = requireRole('college_admin', 'admin', 'super_admin');

export const requireOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admins and Super Admins have overarching privileges
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }

  // College Admin handling
  if (req.user.role === 'college_admin') {
    if (!req.user.hostDetails?.isHostApproved) {
      return res.status(403).json({
        message: 'Access denied: Your host account is pending verification by Platform Super Admin.',
        isPendingApproval: true,
      });
    }
    return next();
  }

  // Organization admins and Evaluators have event management privileges
  if (req.user.role === 'org_admin' || req.user.role === 'evaluator') {
    return next();
  }

  if (req.user.role !== 'organizer') {
    return res.status(403).json({
      message: 'Access denied: Requires Organizer, College Host, or Evaluator privileges',
    });
  }

  if (req.user.status === 'deactivated') {
    return res.status(403).json({
      message: 'Access denied: Your account has been deactivated.',
    });
  }

  // Check organizer approval status
  if (req.user.organizerStatus === 'pending') {
    return res.status(403).json({
      message: 'Access denied: Your organizer request is still PENDING Campus Admin approval.',
    });
  }

  if (req.user.organizerStatus === 'rejected') {
    return res.status(403).json({
      message: 'Access denied: Your organizer request was rejected by Campus Admin.',
    });
  }

  if (req.user.organizerStatus === 'deactivated') {
    return res.status(403).json({
      message: 'Access denied: Your department organizer privileges have been deactivated.',
    });
  }

  next();
};

/**
 * Strict Department Ownership Check Middleware:
 * An organizer from one department cannot access or modify events from another department.
 * Admins can manage all departments.
 */
export const requireDepartmentOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Access denied: Requires Organizer role' });
    }

    const eventId = req.params.id || req.params.eventId || req.body?.eventId;
    if (!eventId) {
      return next();
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify department ownership: CSE organizer cannot touch ECE event
    const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
    const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();

    if (eventDeptId && userDeptId && eventDeptId !== userDeptId) {
      return res.status(403).json({
        message: 'HTTP 403 Forbidden: You cannot access or modify events belonging to another department.',
      });
    }

    // Check organizer or active department organizer ownership
    const isOwner = event.organizerId.toString() === req.user._id.toString();
    const isCurrentActiveDeptOrganizer = eventDeptId && userDeptId && eventDeptId === userDeptId && req.user.organizerStatus === 'active';

    if (!isOwner && !isCurrentActiveDeptOrganizer) {
      return res.status(403).json({
        message: 'HTTP 403 Forbidden: You are not authorized to modify this event.',
      });
    }

    req.event = event;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Authorization check failed' });
  }
};

/**
 * Event Staff Authorization Middleware:
 * Grants access if user is Admin, Event Organizer, OR an Assigned/Accepted Volunteer for the specific event.
 */
export const requireEventStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admins have full access
    if (req.user.role === 'admin') {
      return next();
    }

    // Extract event ID from params, body, or query
    const eventId = req.params.id || req.params.eventId || req.body?.eventId || req.query?.eventId;

    // If organizer and no specific event ID was requested, allow organizer through
    if (req.user.role === 'organizer' && !eventId) {
      return next();
    }

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user is the organizer of the event OR active organizer of the department
      const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
      const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();
      const isDeptOrganizer = userDeptId && eventDeptId && userDeptId === eventDeptId && req.user.organizerStatus === 'active';

      if (req.user.role === 'organizer' && (event.organizerId.toString() === req.user._id.toString() || isDeptOrganizer)) {
        req.isEventOrganizer = true;
        return next();
      }

      // Check if user is an assigned volunteer for this event
      const volunteer = await Volunteer.findOne({
        eventId,
        userId: req.user._id,
        status: { $in: ['assigned', 'accepted'] },
      });

      if (volunteer) {
        req.isVolunteer = true;
        req.volunteer = volunteer;
        return next();
      }

      // If user is a general organizer, we still allow them if they own the event
      if (req.user.role === 'organizer' && event.organizerId.toString() === req.user._id.toString()) {
        req.isEventOrganizer = true;
        return next();
      }

      return res.status(403).json({
        message: 'Access denied: You are not an assigned volunteer or organizer for this event',
        isVolunteerAccessDenied: true,
      });
    }

    if (req.user.role === 'organizer') {
      return next();
    }

    return res.status(403).json({
      message: 'Access denied: Event ID required to verify volunteer authorization',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Authorization check failed' });
  }
};
