import Certificate from '../models/Certificate.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

const generateCertId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CERT-2026-${rand}`;
};

const isAuthorizedIssuer = (event, user) => {
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  if (event.organizerId.toString() === user._id.toString()) return true;
  const userDeptId = user.departmentId?._id?.toString() || user.departmentId?.toString();
  const eventDeptId = event.departmentId?._id?.toString() || event.departmentId?.toString();
  if (userDeptId && eventDeptId && userDeptId === eventDeptId && user.organizerStatus === 'active') return true;
  return false;
};

export const generateCertificatesForEvent = async (req, res) => {
  try {
    const { eventId, certificateType } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!isAuthorizedIssuer(event, req.user)) {
      return res.status(403).json({ message: 'Not authorized to issue certificates for this event' });
    }

    // Find all registrations with status 'checked_in'
    const checkedInRegs = await Registration.find({ eventId, status: 'checked_in' }).populate('studentId', 'name email');

    if (checkedInRegs.length === 0) {
      return res.status(400).json({ message: 'No eligible checked-in attendees found for certificate issuance' });
    }

    let issuedCount = 0;
    const generatedCerts = [];
    const targetCertType = certificateType || 'Participation';

    for (const reg of checkedInRegs) {
      // Check if certificate of this type already exists
      const existing = await Certificate.findOne({ eventId, studentId: reg.studentId._id, certificateType: targetCertType });
      if (!existing) {
        const cert = await Certificate.create({
          certificateId: generateCertId(),
          eventId,
          studentId: reg.studentId._id,
          registrationId: reg._id,
          certificateType: targetCertType,
          issueDate: new Date(),
          verificationStatus: 'Verified',
        });
        generatedCerts.push(cert);
        issuedCount++;
      }
    }

    // Update event status to completed if not already
    event.status = 'completed';
    await event.save();

    res.json({
      message: `Successfully issued ${issuedCount} certificates for event "${event.title}"`,
      issuedCount,
      totalEligible: checkedInRegs.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error generating certificates' });
  }
};

export const issueSingleCertificate = async (req, res) => {
  try {
    const { eventId, studentId, certificateType } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!isAuthorizedIssuer(event, req.user)) {
      return res.status(403).json({ message: 'Not authorized to issue certificates for this event' });
    }

    const reg = await Registration.findOne({ eventId, studentId });
    if (!reg) {
      return res.status(400).json({ message: 'Student is not registered for this event' });
    }

    const existing = await Certificate.findOne({ eventId, studentId, certificateType });
    if (existing) {
      return res.status(400).json({ message: `Certificate of type "${certificateType}" already issued to this student` });
    }

    const cert = await Certificate.create({
      certificateId: generateCertId(),
      eventId,
      studentId,
      registrationId: reg._id,
      certificateType: certificateType || 'Winner',
      issueDate: new Date(),
      verificationStatus: 'Verified',
    });

    const populated = await Certificate.findById(cert._id)
      .populate('eventId', 'title category date')
      .populate('studentId', 'name email department year collegeId');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error issuing certificate' });
  }
};

export const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ studentId: req.user._id })
      .populate({
        path: 'eventId',
        populate: [
          { path: 'venueId', select: 'name location' },
          { path: 'organizerId', select: 'name department' },
        ],
      })
      .populate('studentId', 'name email department year collegeId')
      .sort({ issueDate: -1 });

    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificates' });
  }
};

export const getCertificateById = async (req, res) => {
  try {
    // Build query: always search by certificateId, only include _id if valid ObjectId format
    const orConditions = [{ certificateId: req.params.id.toUpperCase() }];
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      orConditions.push({ _id: req.params.id });
    }

    const cert = await Certificate.findOne({ $or: orConditions })
      .populate({
        path: 'eventId',
        populate: [
          { path: 'venueId', select: 'name location' },
          { path: 'organizerId', select: 'name department' },
        ],
      })
      .populate('studentId', 'name email department year collegeId');

    if (!cert) return res.status(404).json({ message: 'Certificate not found or invalid ID' });

    res.json(cert);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving certificate' });
  }
};
