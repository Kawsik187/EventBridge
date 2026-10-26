import mongoose from 'mongoose';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

export const checkInParticipant = async (req, res) => {
  try {
    const { eventId, regCode, method } = req.body;

    if (!eventId || !regCode) {
      return res.status(400).json({ message: 'eventId and regCode (Registration Code or QR payload) are required' });
    }

    const rawCode = typeof regCode === 'string' ? regCode : JSON.stringify(regCode);
    let parsedRegId = rawCode.trim();

    // If QR payload JSON was scanned, parse regId
    if (rawCode.includes('{') && rawCode.includes('}')) {
      try {
        const payload = JSON.parse(rawCode);
        parsedRegId = payload.regId || payload.registrationId || rawCode;
      } catch (e) {
        // Keep string as is
      }
    }

    // Find registration by registrationId or _id (safely without CastError)
    const query = { eventId };
    const cleanCode = parsedRegId.toUpperCase();
    if (parsedRegId.startsWith('REG-')) {
      query.registrationId = cleanCode;
    } else if (mongoose.Types.ObjectId.isValid(parsedRegId)) {
      query.$or = [{ registrationId: cleanCode }, { _id: parsedRegId }];
    } else {
      query.registrationId = cleanCode;
    }

    let registration = await Registration.findOne(query).populate('studentId', 'name email department year phone collegeId');

    // Fallback: If not found, attempt lookup by Student's College Roll Number or Email
    if (!registration) {
      const studentMatch = await User.findOne({
        $or: [
          { collegeId: { $regex: new RegExp(`^${parsedRegId.trim()}$`, 'i') } },
          { email: parsedRegId.toLowerCase().trim() },
        ],
      });
      if (studentMatch) {
        registration = await Registration.findOne({ eventId, studentId: studentMatch._id }).populate('studentId', 'name email department year phone collegeId');
      }
    }

    if (!registration) {
      return res.status(404).json({ message: `Registration not found for code, roll number, or email "${parsedRegId}"` });
    }

    if (registration.status === 'checked_in') {
      const timeFormatted = registration.checkedInAt ? new Date(registration.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      return res.status(400).json({
        message: `Already checked in at ${timeFormatted || 'an earlier time'}`,
        registration,
        studentName: registration.studentId?.name || 'Student',
        alreadyCheckedIn: true,
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration has been cancelled' });
    }

    // Update status
    registration.status = 'checked_in';
    registration.checkedInAt = new Date();
    await registration.save();

    // Log in Attendance table
    await Attendance.create({
      eventId: registration.eventId,
      studentId: registration.studentId._id,
      registrationId: registration._id,
      checkedInBy: req.user._id,
      checkInTime: registration.checkedInAt,
      method: method || 'qr_scan',
    });

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    res.json({
      success: true,
      message: `${registration.studentId?.name || 'Student'} checked in successfully`,
      studentName: registration.studentId?.name || 'Student',
      department: registration.studentId?.department || 'Engineering',
      collegeId: registration.studentId?.collegeId || 'N/A',
      registrationId: registration.registrationId,
      checkedInAt: timeFormatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error processing check-in' });
  }
};

export const getEventAttendance = async (req, res) => {
  try {
    const { id: eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email department year phone collegeId')
      .sort({ checkedInAt: -1, createdAt: -1 });

    const totalRegistered = registrations.length;
    const checkedInCount = registrations.filter((r) => r.status === 'checked_in').length;
    const noShowCount = totalRegistered - checkedInCount;

    res.json({
      eventId,
      totalRegistered,
      checkedInCount,
      noShowCount,
      registrations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance data' });
  }
};
