import Volunteer from '../models/Volunteer.js';
import User from '../models/User.js';
import Event from '../models/Event.js';

export const getEventVolunteers = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const volunteers = await Volunteer.find({ eventId })
      .populate('userId', 'name email department phone year collegeId')
      .sort({ roleName: 1, createdAt: -1 });

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteers' });
  }
};

export const isEaswariStudent = (user) => {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const collegeName = (user.collegeName || user.college || user.academicProfile?.universityName || '').toLowerCase().trim();
  const hasEaswariEmail = email.endsWith('@srmeaswari.ac.in') || email.includes('srmeaswari.ac.in');
  const hasEaswariCollege = collegeName.includes('easwari') || /\beec\b/i.test(collegeName);
  return hasEaswariEmail || hasEaswariCollege;
};

export const applyForVolunteer = async (req, res) => {
  try {
    const { eventId, preferredRole, task } = req.body;
    const userId = req.user._id;

    // Strict institutional gate: Only students from Easwari Engineering College are eligible to volunteer
    if (!isEaswariStudent(req.user)) {
      return res.status(403).json({
        message: 'Volunteer applications are strictly restricted to students of Easwari Engineering College.',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existing = await Volunteer.findOne({ eventId, userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied or been assigned as a volunteer for this event' });
    }

    const volunteer = await Volunteer.create({
      eventId,
      userId,
      roleName: preferredRole || 'Registration Desk',
      task: task || 'General event assistance & support',
      status: 'applied',
    });

    const populated = await Volunteer.findById(volunteer._id)
      .populate('userId', 'name email department phone year collegeId')
      .populate('eventId', 'title date venueId');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting volunteer application' });
  }
};

export const getMyVolunteerApplications = async (req, res) => {
  try {
    const applications = await Volunteer.find({ userId: req.user._id })
      .populate({
        path: 'eventId',
        populate: { path: 'venueId', select: 'name location' },
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer applications' });
  }
};

export const assignVolunteer = async (req, res) => {
  try {
    const { eventId, userEmail, roleName, task } = req.body;

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found on EventBridge' });
    }

    // Strict institutional gate: Only students from Easwari Engineering College can be assigned as volunteers
    if (!isEaswariStudent(user)) {
      return res.status(403).json({
        message: 'Only students from Easwari Engineering College can be assigned as volunteers.',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions
    if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to manage volunteers for this event' });
    }

    // Upsert volunteer assignment
    const volunteer = await Volunteer.findOneAndUpdate(
      { eventId, userId: user._id },
      {
        roleName: roleName || 'Registration Desk',
        task: task || 'Assigned event management duties',
        status: 'assigned',
        assignedAt: new Date(),
      },
      { new: true, upsert: true }
    ).populate('userId', 'name email department phone year collegeId');

    res.status(201).json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error assigning volunteer' });
  }
};

export const updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, task, status } = req.body;

    const volunteer = await Volunteer.findById(id);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer record not found' });

    const event = await Event.findById(volunteer.eventId);
    if (event && event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (roleName) volunteer.roleName = roleName;
    if (task) volunteer.task = task;
    if (status) volunteer.status = status;

    await volunteer.save();
    const populated = await Volunteer.findById(volunteer._id).populate('userId', 'name email department phone year collegeId');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating volunteer record' });
  }
};

export const removeVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findById(id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer assignment not found' });
    }

    // Verify event ownership before allowing removal
    const event = await Event.findById(volunteer.eventId);
    if (event && event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to remove volunteers from this event' });
    }

    await Volunteer.findByIdAndDelete(id);
    res.json({ message: 'Volunteer removed from event' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing volunteer' });
  }
};
