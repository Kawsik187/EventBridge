import QRCode from 'qrcode';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import Certificate from '../models/Certificate.js';
import { isDeadlinePassed, isEventFinished } from '../utils/eventLifecycle.js';

const generateRegistrationId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REG-2026-${rand}`;
};

export const registerForEvent = async (req, res) => {
  let capacityAllocated = false;
  const eventId = req.params.id;
  const studentId = req.user._id;

  try {
    const { customResponses } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 1. Finished event check (Unstop business logic: Cannot register for concluded events)
    if (event.status === 'completed' || isEventFinished(event.date, event.endTime)) {
      if (event.status !== 'completed') {
        event.status = 'completed';
        await event.save();
      }
      return res.status(400).json({ message: 'This event has already concluded. Registration is permanently closed.' });
    }

    // 2. Registration Deadline check (Unstop business logic: Mark closed when deadline passes)
    if (isDeadlinePassed(event.registrationDeadline)) {
      if (event.status === 'open' || event.status === 'approved') {
        event.status = 'closed';
        await event.save();
      }
      return res.status(400).json({ message: 'Registration deadline has passed for this event. Registration is now closed.' });
    }

    // 3. Active registration duplicate check
    const existing = await Registration.findOne({ eventId, studentId });
    if (existing && existing.status !== 'cancelled') {
      return res.status(400).json({ message: 'You are already registered for this event', registration: existing });
    }

    // 4. ATOMIC CAPACITY ALLOCATION (prevents race conditions and overbooking)
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: { $in: ['open', 'approved'] },
        $expr: { $lt: ['$currentRegistrations', '$maxParticipants'] },
      },
      {
        $inc: { currentRegistrations: 1 },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({ message: 'Event registration is full or closed. Maximum capacity reached.' });
    }
    capacityAllocated = true;

    // Automatically close registration if maximum capacity is reached
    if (updatedEvent.currentRegistrations >= updatedEvent.maxParticipants && updatedEvent.status !== 'closed') {
      await Event.findByIdAndUpdate(eventId, { status: 'closed' });
    }

    const registrationId = generateRegistrationId();

    // Generate real QR code base64 string
    const qrPayload = JSON.stringify({
      regId: registrationId,
      eventId: event._id,
      studentId: studentId,
      studentName: req.user.name,
      collegeId: req.user.collegeId,
      eventTitle: event.title,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      width: 300,
    });

    let registration;
    if (existing && existing.status === 'cancelled') {
      // Re-activate previously cancelled registration cleanly
      existing.status = 'registered';
      existing.registrationId = registrationId;
      existing.ticketNumber = registrationId;
      existing.customResponses = customResponses || {};
      existing.qrCodeDataUrl = qrCodeDataUrl;
      existing.registeredAt = new Date();
      existing.checkedInAt = null;
      registration = await existing.save();
    } else {
      registration = await Registration.create({
        eventId,
        studentId,
        participantId: studentId,
        registrationId,
        ticketNumber: registrationId,
        customResponses: customResponses || {},
        qrCodeDataUrl,
        status: 'registered',
      });
    }

    const populated = await Registration.findById(registration._id)
      .populate('eventId')
      .populate('studentId', 'name email department year phone collegeId');

    res.status(201).json(populated);
  } catch (error) {
    // Compensation logic: release allocated seat if registration persistence fails
    if (capacityAllocated) {
      await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: -1 } });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    res.status(500).json({ message: error.message || 'Error completing registration' });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ studentId: req.user._id })
      .populate({
        path: 'eventId',
        populate: [
          { path: 'venueId', select: 'name location code' },
          { path: 'organizerId', select: 'name department' },
        ],
      })
      .sort({ createdAt: -1 });

    // Fetch all certificates issued to this student to attach to their registered events (Unstop style)
    const certificates = await Certificate.find({ studentId: req.user._id })
      .populate('studentId', 'name email department year collegeId')
      .populate('eventId', 'title category date venueId');
    const certMap = new Map();
    certificates.forEach((c) => {
      const eId = c.eventId?._id?.toString() || c.eventId?.toString();
      if (eId) {
        certMap.set(eId, c);
      }
    });

    const enrichedRegistrations = registrations.map((reg) => {
      const regObj = reg.toObject();
      const evtId = reg.eventId?._id?.toString() || reg.eventId?.toString();
      if (evtId && certMap.has(evtId)) {
        regObj.certificate = certMap.get(evtId);
      }
      return regObj;
    });

    res.json(enrichedRegistrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations' });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check authorization: organizer of event, volunteer, or admin
    if (
      !req.isVolunteer &&
      event.organizerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email department year phone collegeId')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event registrations' });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const registration = await Registration.findOne({ eventId, studentId: req.user._id });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Decrement capacity atomically
    const event = await Event.findOneAndUpdate(
      { _id: eventId, currentRegistrations: { $gt: 0 } },
      { $inc: { currentRegistrations: -1 } },
      { new: true }
    );

    if (event && event.status === 'closed' && event.currentRegistrations < event.maxParticipants) {
      event.status = 'open';
      await event.save();
    }

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling registration' });
  }
};
