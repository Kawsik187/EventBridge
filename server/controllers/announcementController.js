import Announcement from '../models/Announcement.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

export const createAnnouncement = async (req, res) => {
  try {
    const { eventId, title, message, audience } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.organizerId.toString() === req.user._id.toString();
    const userDeptId = req.user.departmentId?._id?.toString() || req.user.departmentId?.toString();
    const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();
    const isDeptOrganizer = userDeptId && eventDeptId && userDeptId === eventDeptId && req.user.organizerStatus === 'active';

    if (!isOwner && !isDeptOrganizer && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to post announcements for this event' });
    }

    const announcement = await Announcement.create({
      eventId,
      title,
      message,
      audience: audience || 'all_registered',
      organizerId: req.user._id,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('eventId', 'title category date venueId')
      .populate('organizerId', 'name email department');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating announcement' });
  }
};

export const getEventAnnouncements = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const announcements = await Announcement.find({ eventId })
      .populate('organizerId', 'name department')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
};

export const getStudentAnnouncements = async (req, res) => {
  try {
    // Find all events the student is registered for
    const studentRegs = await Registration.find({ studentId: req.user._id });
    const eventIds = studentRegs.map((r) => r.eventId);

    const announcements = await Announcement.find({ eventId: { $in: eventIds } })
      .populate('eventId', 'title category date venueId')
      .populate('organizerId', 'name department')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements for student' });
  }
};
