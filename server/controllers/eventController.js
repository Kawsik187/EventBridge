import Event from '../models/Event.js';
import Venue from '../models/Venue.js';
import Department from '../models/Department.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import Announcement from '../models/Announcement.js';
import Volunteer from '../models/Volunteer.js';
import { checkVenueConflict } from '../utils/venueConflict.js';
import { syncEventStatuses } from '../utils/eventLifecycle.js';

export const getAllEvents = async (req, res) => {
  try {
    // Automatically synchronize event statuses (deadlines passed -> closed, finished -> completed)
    await syncEventStatuses();

    const { category, search, status, venue, organizerId, staffUserId, departmentId, department } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    } else if (!organizerId && !staffUserId && status !== 'all') {
      // For student/public discover view: Show only active, live, or closed upcoming opportunities (exclude finished/completed)
      const todayStr = new Date().toISOString().split('T')[0];
      query.status = { $in: ['open', 'approved', 'live', 'closed'] };
      query.date = { $gte: todayStr };
    }

    if (departmentId) {
      query.departmentId = departmentId;
    } else if (department) {
      const deptDoc = await Department.findOne({
        $or: [{ name: department }, { code: department.toUpperCase() }],
      });
      if (deptDoc) {
        query.departmentId = deptDoc._id;
      }
    }

    if (staffUserId) {
      // Find event IDs where this user is an assigned volunteer
      const volunteerAssignments = await Volunteer.find({
        userId: staffUserId,
        status: { $in: ['assigned', 'accepted'] },
      }).select('eventId roleName task status');

      const volunteeredEventIds = volunteerAssignments.map((v) => v.eventId);

      query.$or = [
        { organizerId: staffUserId },
        { _id: { $in: volunteeredEventIds } },
      ];
    } else if (organizerId) {
      query.organizerId = organizerId;
    }

    if (venue) {
      query.venueId = venue;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
        { departmentName: { $regex: safeSearch, $options: 'i' } },
        { departmentCode: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('venueId', 'name code location capacity')
      .populate('organizerId', 'name email department phone avatar')
      .populate('departmentId', 'name code description')
      .sort({ date: 1, startTime: 1 });

    if (staffUserId) {
      const volunteerAssignments = await Volunteer.find({
        userId: staffUserId,
        status: { $in: ['assigned', 'accepted'] },
      });
      const volMap = new Map();
      volunteerAssignments.forEach((v) => {
        volMap.set(v.eventId.toString(), {
          roleName: v.roleName,
          task: v.task,
          status: v.status,
        });
      });

      const resultEvents = events.map((evt) => {
        const evtObj = evt.toObject();
        if (volMap.has(evt._id.toString())) {
          evtObj.isVolunteer = true;
          evtObj.volunteerInfo = volMap.get(evt._id.toString());
        }
        if (evt.organizerId?._id?.toString() === staffUserId.toString()) {
          evtObj.isOrganizer = true;
        }
        return evtObj;
      });

      return res.json(resultEvents);
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
};

export const getEventById = async (req, res) => {
  try {
    await syncEventStatuses();

    const event = await Event.findById(req.params.id)
      .populate('venueId')
      .populate('organizerId', 'name email department phone avatar')
      .populate('departmentId', 'name code description');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event details' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      eventName, // supported alias
      category,
      description,
      venueId,
      venue, // supported alias
      date,
      startTime,
      endTime,
      registrationDeadline,
      registrationEnd, // supported alias
      maxParticipants,
      capacity, // supported alias
      eligibility,
      rules,
      schedule,
      contactInfo,
      bannerUrl,
      customFields,
      submitForApproval,
    } = req.body;

    const eventTitle = title || eventName;
    if (!eventTitle) {
      return res.status(400).json({ message: 'Event title / eventName is required' });
    }

    const targetVenueId = venueId || venue;
    if (!targetVenueId) {
      return res.status(400).json({ message: 'Venue is required' });
    }

    const regDeadline = registrationDeadline || registrationEnd;
    const maxCapacity = maxParticipants || capacity;

    if (!date || !startTime || !endTime || !regDeadline || !maxCapacity) {
      return res.status(400).json({ message: 'Date, start time, end time, registration deadline, and capacity are required' });
    }

    // Validate time sequence
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = String(timeStr).split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ message: 'Invalid schedule: Event start time must be strictly before end time' });
    }

    // Verify venue exists and check capacity limit
    const targetVenue = await Venue.findById(targetVenueId);
    if (!targetVenue) {
      return res.status(404).json({ message: 'Selected venue does not exist' });
    }

    if (Number(maxCapacity) > targetVenue.capacity) {
      return res.status(400).json({
        message: `Event capacity (${maxCapacity}) cannot exceed venue capacity (${targetVenue.capacity} for ${targetVenue.name})`,
      });
    }

    // Determine department from authenticated organizer (never trust frontend input for organizers)
    let assignedDeptId = null;
    let deptDoc = null;

    if (req.user.role === 'admin') {
      assignedDeptId = req.body.departmentId;
      if (assignedDeptId) {
        deptDoc = await Department.findById(assignedDeptId);
      }
      if (!deptDoc) {
        deptDoc = await Department.findOne({ status: 'active' });
      }
    } else {
      // Must be organizer
      assignedDeptId = req.user.departmentId?._id || req.user.departmentId;
      if (!assignedDeptId) {
        return res.status(403).json({
          message: 'Organizer must be assigned to an approved department before creating events',
        });
      }
      deptDoc = await Department.findById(assignedDeptId);
    }

    if (!deptDoc) {
      return res.status(404).json({ message: 'Valid department not found' });
    }

    // Check venue conflict
    const conflict = await checkVenueConflict(targetVenueId, date, startTime, endTime);
    if (conflict.hasConflict) {
      return res.status(409).json({
        message: `Venue conflict: Another event (${conflict.conflictingEvent.title}) is scheduled in this venue from ${conflict.conflictingEvent.startTime} to ${conflict.conflictingEvent.endTime}.`,
        conflict: conflict.conflictingEvent,
      });
    }

    const initialStatus = submitForApproval ? 'pending' : 'draft';

    const event = await Event.create({
      title: eventTitle.trim(),
      slug: eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: category || 'Technical',
      description,
      organizerId: req.user._id,
      organizerName: req.user.name,
      departmentId: deptDoc._id,
      departmentName: deptDoc.name,
      departmentCode: deptDoc.code,
      venueId: targetVenueId,
      date,
      startTime,
      endTime,
      registrationDeadline: regDeadline,
      maxParticipants: Number(maxCapacity),
      eligibility: eligibility || 'Open to all college students',
      rules: rules || [],
      schedule: schedule || [],
      contactInfo: contactInfo || { name: req.user.name, email: req.user.email, phone: req.user.phone },
      bannerUrl: bannerUrl || '',
      customFields: customFields || [],
      status: initialStatus,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('venueId')
      .populate('organizerId', 'name email department')
      .populate('departmentId', 'name code description');

    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Strict Cross-Department Authorization: An organizer from CSE cannot modify an ECE event!
    if (req.user.role === 'organizer') {
      const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
      const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();

      if (eventDeptId && userDeptId && eventDeptId !== userDeptId) {
        return res.status(403).json({
          message: 'HTTP 403 Forbidden: You cannot access or modify events belonging to another department.',
        });
      }

      if (event.organizerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'HTTP 403 Forbidden: You are not authorized to update this event.' });
      }
    }

    const newVenueId = req.body.venueId || req.body.venue || event.venueId;
    const newDate = req.body.date || event.date;
    const newStartTime = req.body.startTime || event.startTime;
    const newEndTime = req.body.endTime || event.endTime;

    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = String(timeStr).split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    if (timeToMinutes(newStartTime) >= timeToMinutes(newEndTime)) {
      return res.status(400).json({ message: 'Invalid schedule: Event start time must be strictly before end time' });
    }

    const newCapacity = req.body.maxParticipants || req.body.capacity || event.maxParticipants;
    if (newVenueId || req.body.maxParticipants || req.body.capacity) {
      const v = await Venue.findById(newVenueId);
      if (!v) {
        return res.status(404).json({ message: 'Selected venue does not exist' });
      }
      if (Number(newCapacity) > v.capacity) {
        return res.status(400).json({
          message: `Event capacity (${newCapacity}) cannot exceed venue capacity (${v.capacity} for ${v.name})`,
        });
      }
    }

    // Check conflict if time or venue changed
    if (
      newVenueId.toString() !== event.venueId.toString() ||
      newDate !== event.date ||
      newStartTime !== event.startTime ||
      newEndTime !== event.endTime
    ) {
      const conflict = await checkVenueConflict(newVenueId, newDate, newStartTime, newEndTime, event._id);
      if (conflict.hasConflict) {
        return res.status(409).json({
          message: `Venue conflict: Another event (${conflict.conflictingEvent.title}) is scheduled in this venue from ${conflict.conflictingEvent.startTime} to ${conflict.conflictingEvent.endTime}.`,
          conflict: conflict.conflictingEvent,
        });
      }
    }

    // Update fields (organizers cannot change departmentId!)
    const fields = [
      'title',
      'category',
      'description',
      'venueId',
      'date',
      'startTime',
      'endTime',
      'registrationDeadline',
      'maxParticipants',
      'eligibility',
      'rules',
      'schedule',
      'contactInfo',
      'bannerUrl',
      'customFields',
      'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    if (req.body.eventName) event.title = req.body.eventName;
    if (req.body.capacity) event.maxParticipants = Number(req.body.capacity);
    if (req.body.registrationEnd) event.registrationDeadline = req.body.registrationEnd;

    // Admin can update department if needed
    if (req.user.role === 'admin' && req.body.departmentId) {
      const d = await Department.findById(req.body.departmentId);
      if (d) {
        event.departmentId = d._id;
        event.departmentName = d.name;
        event.departmentCode = d.code;
      }
    }

    if (req.body.title || req.body.eventName) {
      event.slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const updatedEvent = await event.save();
    const populated = await Event.findById(updatedEvent._id)
      .populate('venueId')
      .populate('organizerId', 'name email department')
      .populate('departmentId', 'name code description');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating event' });
  }
};

export const submitForApproval = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role === 'organizer') {
      const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
      const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();
      if (eventDeptId && userDeptId && eventDeptId !== userDeptId) {
        return res.status(403).json({ message: 'HTTP 403 Forbidden: You cannot modify an event from another department' });
      }
      if (event.organizerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    event.status = 'pending';
    event.rejectionReason = '';
    await event.save();

    res.json({ message: 'Event submitted for approval', status: event.status });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting event' });
  }
};

export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role === 'organizer') {
      const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
      const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();
      if (eventDeptId && userDeptId && eventDeptId !== userDeptId) {
        return res.status(403).json({ message: 'HTTP 403 Forbidden: You cannot modify an event from another department' });
      }
      if (event.organizerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved events can be published' });
    }

    event.status = 'open';
    await event.save();

    res.json({ message: 'Event published and registrations are now open', status: event.status });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Strict Cross-Department Authorization: An organizer from CSE cannot delete an ECE event!
    if (req.user.role === 'organizer') {
      const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
      const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();

      if (eventDeptId && userDeptId && eventDeptId !== userDeptId) {
        return res.status(403).json({
          message: 'HTTP 403 Forbidden: You cannot access or modify events belonging to another department.',
        });
      }

      if (event.organizerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'HTTP 403 Forbidden: You are not authorized to delete this event.' });
      }
    }

    // Cascade delete all related records
    await Registration.deleteMany({ eventId: event._id });
    await Attendance.deleteMany({ eventId: event._id });
    await Certificate.deleteMany({ eventId: event._id });
    await Announcement.deleteMany({ eventId: event._id });
    await Volunteer.deleteMany({ eventId: event._id });
    await event.deleteOne();

    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
};

export const getOrganizerAnalytics = async (req, res) => {
  try {
    const isMasterAdmin = req.user.role === 'admin';
    const eventQuery = isMasterAdmin ? {} : { organizerId: req.user._id };

    const events = await Event.find(eventQuery);
    const eventIds = events.map((e) => e._id);

    const totalEvents = events.length;
    const activeEvents = events.filter((e) => ['open', 'approved', 'live'].includes(e.status)).length;
    const pendingApprovals = events.filter((e) => e.status === 'pending').length;
    const completedEvents = events.filter((e) => e.status === 'completed').length;
    const upcomingEvents = events.filter((e) => ['open', 'approved'].includes(e.status)).length;

    const registrations = await Registration.find({ eventId: { $in: eventIds } }).populate('studentId', 'department');
    const totalRegistrations = registrations.length;
    const totalCheckedIn = registrations.filter((r) => r.status === 'checked_in').length;
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;

    const categoryMap = {};
    events.forEach((evt) => {
      categoryMap[evt.category] = (categoryMap[evt.category] || 0) + 1;
    });

    res.json({
      summary: {
        totalEvents,
        activeEvents,
        upcomingEvents,
        completedEvents,
        pendingApprovals,
        totalRegistrations,
        totalCheckedIn,
        attendanceRate,
      },
      categoryDistribution: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
      recentEvents: events.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating analytics' });
  }
};
