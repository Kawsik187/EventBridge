import Event from '../models/Event.js';
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Department from '../models/Department.js';
import OrganizerRequest from '../models/OrganizerRequest.js';
import AuditLog from '../models/AuditLog.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';

export const getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .populate('venueId', 'name code location capacity')
      .populate('organizerId', 'name email department phone')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending events' });
  }
};

export const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.status = 'approved';
    event.rejectionReason = '';
    await event.save();

    await AuditLog.create({
      action: 'EVENT_APPROVED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: { eventId: event._id, title: event.title, departmentId: event.departmentId },
    });

    res.json({ message: 'Event approved successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error approving event' });
  }
};

export const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.status = 'rejected';
    event.rejectionReason = reason;
    await event.save();

    await AuditLog.create({
      action: 'EVENT_REJECTED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: { eventId: event._id, title: event.title, reason },
    });

    res.json({ message: 'Event rejected', event });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting event' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, department, status, search } = req.query;
    const query = {};

    if (role && role !== 'all') {
      if (role === 'student') {
        query.role = { $in: ['student', 'participant'] };
      } else {
        query.role = role;
      }
    }
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { collegeId: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('departmentId', 'name code activeOrganizerId')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'deactivated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (id === req.user._id.toString() && status === 'deactivated') {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    if (status === 'deactivated' && user.role === 'organizer') {
      user.organizerStatus = 'deactivated';
      // Clear active organizer from department
      if (user.departmentId) {
        await Department.findByIdAndUpdate(user.departmentId, { activeOrganizerId: null });
      }
    }
    await user.save();

    await AuditLog.create({
      action: status === 'deactivated' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      targetUserId: user._id,
      details: { email: user.email, status, role: user.role },
    });

    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['student', 'participant', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot change your own admin role' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

/**
 * Get Admin Department Management list with active organizer and event statistics
 */
export const getAdminDepartments = async (req, res) => {
  try {
    const departments = await Department.find({})
      .populate('activeOrganizerId', 'name email phone avatar organizerStatus status')
      .sort({ name: 1 });

    const deptIds = departments.map((d) => d._id);
    const eventCounts = await Event.aggregate([
      { $match: { departmentId: { $in: deptIds } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    eventCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

    const result = departments.map((d) => {
      const dObj = d.toObject();
      dObj.eventsCount = countMap.get(d._id.toString()) || 0;
      return dObj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

/**
 * Assign Organizer directly to a department
 */
export const assignOrganizerToDepartment = async (req, res) => {
  try {
    const { id: departmentId } = req.params;
    const { userId, userEmail } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if department already has an active organizer
    if (department.activeOrganizerId && department.activeOrganizerId.toString() !== user._id.toString()) {
      return res.status(409).json({
        message: 'Department already has an active organizer. Use Replace Organizer instead.',
        currentOrganizerId: department.activeOrganizerId,
      });
    }

    // Promote user to organizer
    user.role = 'organizer';
    user.organizerStatus = 'approved';
    user.departmentId = department._id;
    user.department = department.name;
    user.status = 'active';
    await user.save();

    department.activeOrganizerId = user._id;
    department.status = 'active';
    await department.save();

    await AuditLog.create({
      action: 'ORGANIZER_ASSIGNED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      targetUserId: user._id,
      targetDepartmentId: department._id,
      details: {
        departmentName: department.name,
        departmentCode: department.code,
        assignedUser: user.email,
      },
    });

    res.json({ message: `Assigned ${user.name} as active organizer for ${department.name}`, department, user });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error assigning organizer' });
  }
};

/**
 * Replace Organizer for a department
 * Enforces: Current Organizer -> DEACTIVATED, New Organizer -> ACTIVE
 */
export const replaceOrganizer = async (req, res) => {
  try {
    const { id: departmentId } = req.params;
    const { newUserId, newUserEmail } = req.body;

    const department = await Department.findById(departmentId).populate('activeOrganizerId');
    if (!department) return res.status(404).json({ message: 'Department not found' });

    let newUser = null;
    if (newUserId) {
      newUser = await User.findById(newUserId);
    } else if (newUserEmail) {
      newUser = await User.findOne({ email: newUserEmail.toLowerCase().trim() });
    }

    if (!newUser) {
      return res.status(404).json({ message: 'New organizer user not found' });
    }

    const previousOrganizer = department.activeOrganizerId;
    let prevUser = null;
    // 1. Deactivate previous organizer if exists
    if (previousOrganizer) {
      prevUser = await User.findById(previousOrganizer._id || previousOrganizer);
      if (prevUser) {
        prevUser.organizerStatus = 'deactivated';
        prevUser.status = 'deactivated';
        await prevUser.save();
      }
    }

    // 2. Activate new organizer
    newUser.role = 'organizer';
    newUser.organizerStatus = 'active';
    newUser.departmentId = department._id;
    newUser.department = department.name;
    newUser.status = 'active';
    await newUser.save();

    department.activeOrganizerId = newUser._id;
    await department.save();

    // Mark any pending organizer request for this user as APPROVED
    await OrganizerRequest.updateMany(
      { userId: newUser._id, status: 'PENDING' },
      { $set: { status: 'APPROVED', reviewedBy: req.user._id, reviewedAt: new Date() } }
    );

    // 3. Record Audit Log
    await AuditLog.create({
      action: 'ORGANIZER_REPLACED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      targetUserId: newUser._id,
      targetDepartmentId: department._id,
      details: {
        departmentCode: department.code,
        departmentName: department.name,
        previousOrganizerEmail: prevUser?.email || previousOrganizer?.email || 'None',
        newOrganizerEmail: newUser.email,
        timestamp: new Date(),
      },
    });

    res.json({
      message: `Organizer successfully replaced for ${department.name}. Previous organizer deactivated, new organizer is now active.`,
      department,
      previousOrganizer: prevUser,
      newOrganizer: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error replacing organizer' });
  }
};

/**
 * Deactivate Organizer for a department
 */
export const deactivateDepartmentOrganizer = async (req, res) => {
  try {
    const { id: departmentId } = req.params;
    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    if (!department.activeOrganizerId) {
      return res.status(400).json({ message: 'This department currently does not have an active organizer' });
    }

    const organizer = await User.findById(department.activeOrganizerId);
    if (organizer) {
      organizer.organizerStatus = 'deactivated';
      organizer.status = 'deactivated';
      await organizer.save();
    }

    const previousOrganizerId = department.activeOrganizerId;
    department.activeOrganizerId = null;
    await department.save();

    await AuditLog.create({
      action: 'ORGANIZER_DEACTIVATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      targetUserId: previousOrganizerId,
      targetDepartmentId: department._id,
      details: {
        departmentCode: department.code,
        departmentName: department.name,
        organizerEmail: organizer?.email || '',
      },
    });

    res.json({ message: `Organizer for ${department.name} has been deactivated`, department });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deactivating organizer' });
  }
};

/**
 * Get all Organizer Requests
 */
export const getOrganizerRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    const requests = await OrganizerRequest.find(query)
      .populate('departmentId', 'name code activeOrganizerId')
      .populate('userId', 'name email phone collegeId')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizer requests' });
  }
};

/**
 * Approve an Organizer Request
 * Enforces one active organizer per department unless replaceCurrent is specified.
 */
export const approveOrganizerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { replaceCurrent } = req.body;

    const request = await OrganizerRequest.findById(id).populate('departmentId');
    if (!request) return res.status(404).json({ message: 'Organizer request not found' });

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `This request has already been ${request.status}` });
    }

    const department = await Department.findById(request.departmentId._id || request.departmentId);
    if (!department) return res.status(404).json({ message: 'Associated department not found' });

    // Check if department already has an active organizer
    if (department.activeOrganizerId && department.activeOrganizerId.toString() !== request.userId?.toString()) {
      if (!replaceCurrent) {
        const activeOrg = await User.findById(department.activeOrganizerId).select('name email');
        return res.status(409).json({
          message: `${department.name} already has an active organizer (${activeOrg?.name || 'Assigned'}). Would you like to Replace Organizer?`,
          requiresReplacementConfirmation: true,
          currentOrganizer: activeOrg,
          departmentId: department._id,
        });
      }

      // Deactivate current organizer
      const currentOrg = await User.findById(department.activeOrganizerId);
      if (currentOrg) {
        currentOrg.organizerStatus = 'deactivated';
        currentOrg.status = 'deactivated';
        await currentOrg.save();
      }

      await AuditLog.create({
        action: 'ORGANIZER_REPLACED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        targetUserId: request.userId,
        targetDepartmentId: department._id,
        details: {
          departmentCode: department.code,
          previousOrganizer: currentOrg?.email || 'N/A',
          newOrganizer: request.email,
        },
      });
    }

    // Find or update the user
    let user = await User.findById(request.userId);
    if (!user) {
      user = await User.findOne({ email: request.email.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({ message: 'User record for this request not found' });
    }

    user.role = 'organizer';
    user.organizerStatus = 'active';
    user.departmentId = department._id;
    user.department = department.name;
    user.status = 'active';
    await user.save();

    department.activeOrganizerId = user._id;
    await department.save();

    request.status = 'APPROVED';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      action: 'ORGANIZER_APPROVED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      targetUserId: user._id,
      targetDepartmentId: department._id,
      details: {
        departmentCode: department.code,
        departmentName: department.name,
        email: user.email,
        requestId: request._id,
      },
    });

    res.json({
      success: true,
      message: `Organizer request approved. ${user.name} is now the active organizer for ${department.name}.`,
      request,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error approving organizer request' });
  }
};

/**
 * Reject an Organizer Request
 */
export const rejectOrganizerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await OrganizerRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Organizer request not found' });

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `This request has already been ${request.status}` });
    }

    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Request rejected by Campus Admin';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Update user status
    if (request.userId) {
      const user = await User.findById(request.userId);
      if (user && user.role !== 'organizer') {
        user.organizerStatus = 'rejected';
        await user.save();
      }
    }

    await AuditLog.create({
      action: 'ORGANIZER_REJECTED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      targetUserId: request.userId,
      targetDepartmentId: request.departmentId,
      details: {
        email: request.email,
        reason: request.rejectionReason,
        requestId: request._id,
      },
    });

    res.json({
      success: true,
      message: 'Organizer request rejected.',
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error rejecting organizer request' });
  }
};

/**
 * Get Admin Audit Logs
 */
export const getAdminAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('performedBy', 'name email role')
      .populate('targetUserId', 'name email role')
      .populate('targetDepartmentId', 'name code')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};

/**
 * Get comprehensive Admin system analytics
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({});
    const activeEvents = await Event.countDocuments({ status: { $in: ['open', 'approved', 'live'] } });
    const pendingApprovals = await Event.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments({});
    const totalStudents = await User.countDocuments({ role: { $in: ['student', 'participant'] } });
    const totalOrganizers = await User.countDocuments({ role: 'organizer', status: 'active', organizerStatus: 'approved' });
    const totalDepartments = await Department.countDocuments({});
    const pendingOrganizerRequests = await OrganizerRequest.countDocuments({ status: 'PENDING' });
    const totalRegistrations = await Registration.countDocuments({});
    const totalCheckedIn = await Registration.countDocuments({ status: 'checked_in' });
    const totalVenues = await Venue.countDocuments({});

    // Department breakdown
    const deptStats = await Department.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'departmentId',
          as: 'deptEvents',
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          count: { $size: '$deptEvents' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const categoryStats = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.json({
      summary: {
        totalEvents,
        activeEvents,
        pendingApprovals,
        totalUsers,
        totalStudents,
        totalOrganizers,
        totalDepartments,
        pendingOrganizerRequests,
        totalRegistrations,
        totalCheckedIn,
        attendanceRate: totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0,
        totalVenues,
      },
      departmentDistribution: deptStats.map((d) => ({ name: d.code, fullName: d.name, count: d.count })),
      categoryDistribution: categoryStats.map((c) => ({ category: c._id, count: c.count })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating analytics' });
  }
};
