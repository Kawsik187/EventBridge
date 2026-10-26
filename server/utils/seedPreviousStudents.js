import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Certificate from '../models/Certificate.js';
import Venue from '../models/Venue.js';

let currentDirname = process.cwd();
try {
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {}

try {
  dotenv.config({ path: path.resolve(currentDirname, '../.env') });
} catch (e) {}
dotenv.config();

export const seedPreviousStudents = async () => {
  console.log('[SeedStudents] Connecting to MongoDB Atlas...');
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const cseDept = await Department.findOne({ code: 'CSE' }) || await Department.findOne({});
  const itDept = await Department.findOne({ code: 'IT' }) || await Department.findOne({});
  const cseOrganizer = await User.findOne({ email: 'cse.organizer@srmeaswari.ac.in' }) || await User.findOne({ role: 'organizer' });
  const venue = await Venue.findOne({ code: 'INV-LAB-01' }) || await Venue.findOne({});

  // 1. Priya Ramanathan
  let priya = await User.findOne({ email: 'student@srmeaswari.ac.in' });
  if (!priya) {
    priya = await User.create({
      name: 'Priya Ramanathan',
      email: 'student@srmeaswari.ac.in',
      password: 'StudentPassword2026!',
      role: 'student',
      status: 'active',
      department: cseDept ? cseDept.name : 'Computer Science and Engineering (CSE)',
      departmentId: cseDept ? cseDept._id : null,
      collegeName: 'SRM Easwari Engineering College',
      yearOfStudy: '3rd Year',
      year: '3rd Year',
      phone: '+91 98765 43211',
      collegeId: 'STU-2024-CSE-042',
    });
    console.log('[SeedStudents] Created Priya Ramanathan (student@srmeaswari.ac.in)');
  } else {
    console.log('[SeedStudents] Verified Priya Ramanathan (student@srmeaswari.ac.in)');
  }

  // 2. Aarav Patel (BITS Pilani)
  let aarav = await User.findOne({ email: 'student.demo@gmail.com' });
  if (!aarav) {
    aarav = await User.create({
      name: 'Aarav Patel',
      email: 'student.demo@gmail.com',
      password: 'StudentPassword2026!',
      role: 'student',
      status: 'active',
      department: cseDept ? cseDept.name : 'Computer Science and Engineering (CSE)',
      departmentId: cseDept ? cseDept._id : null,
      collegeName: 'BITS Pilani',
      yearOfStudy: '3rd Year',
      year: '3rd Year',
      phone: '+91 98401 22334',
      collegeId: 'BITS-PIL-2023-CS109',
    });
    console.log('[SeedStudents] Created Aarav Patel (student.demo@gmail.com)');
  } else {
    console.log('[SeedStudents] Verified Aarav Patel (student.demo@gmail.com)');
  }

  // 3. Rohan Sharma (NIT Trichy)
  let rohan = await User.findOne({ email: 'rohan.sharma@nitt.edu' });
  if (!rohan) {
    rohan = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@nitt.edu',
      password: 'StudentPassword2026!',
      role: 'student',
      status: 'active',
      department: itDept ? itDept.name : 'Information Technology (IT)',
      departmentId: itDept ? itDept._id : null,
      collegeName: 'National Institute of Technology, Trichy',
      yearOfStudy: '2nd Year',
      year: '2nd Year',
      phone: '+91 97102 33445',
      collegeId: 'NITT-2024-IT-088',
    });
    console.log('[SeedStudents] Created Rohan Sharma (rohan.sharma@nitt.edu)');
  }

  // 4. Register students to sample events
  const hackathon = await Event.findOne({ title: /HackNova/i }) || await Event.findOne({});
  const vibrance = await Event.findOne({ title: /Vibrance/i });

  if (hackathon) {
    // Register Priya
    const regPriya = await Registration.findOneAndUpdate(
      { eventId: hackathon._id, studentId: priya._id },
      {
        $setOnInsert: {
          eventId: hackathon._id,
          studentId: priya._id,
          participantId: priya._id,
          registrationType: 'individual',
          registrationId: `REG-2026-PRIYA-${Math.floor(1000 + Math.random() * 9000)}`,
          ticketNumber: `TKT-2026-PRIYA-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'confirmed',
          checkInStatus: { isCheckedIn: false },
        },
      },
      { upsert: true, new: true }
    );
  }

  if (vibrance) {
    // Register Rohan
    await Registration.findOneAndUpdate(
      { eventId: vibrance._id, studentId: rohan._id },
      {
        $setOnInsert: {
          eventId: vibrance._id,
          studentId: rohan._id,
          participantId: rohan._id,
          registrationType: 'individual',
          registrationId: `REG-2026-ROHAN-${Math.floor(1000 + Math.random() * 9000)}`,
          ticketNumber: `TKT-2026-ROHAN-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'confirmed',
          checkInStatus: { isCheckedIn: false },
        },
      },
      { upsert: true, new: true }
    );
  }

  // 5. Completed Event with Verified Certificate for Aarav Patel
  let completedEvent = await Event.findOne({ title: 'National Full-Stack & Cloud Architecture Hackathon 2026' });
  if (!completedEvent) {
    completedEvent = await Event.create({
      title: 'National Full-Stack & Cloud Architecture Hackathon 2026',
      description: 'An intensive 48-hour inter-college hackathon building scalable cloud systems, microservices, and reactive web architectures.',
      category: 'Technical',
      date: '2026-10-08',
      startTime: '09:00',
      endTime: '18:00',
      venueId: venue?._id,
      organizerId: cseOrganizer?._id,
      departmentId: cseDept?._id,
      status: 'completed',
      capacity: 150,
      registrationDeadline: new Date('2026-10-06T23:59:59Z'),
      isTeamEvent: false,
      allowCrossCollegeTeams: true,
      tags: ['Hackathon', 'FullStack', 'Cloud', 'MERN'],
    });
  }

  let regAarav = await Registration.findOne({ eventId: completedEvent._id, studentId: aarav._id });
  if (!regAarav) {
    regAarav = await Registration.create({
      eventId: completedEvent._id,
      studentId: aarav._id,
      participantId: aarav._id,
      registrationType: 'individual',
      registrationId: 'REG-2026-NFCA-889',
      ticketNumber: 'TKT-2026-NFCA-889',
      status: 'checked_in',
      checkInStatus: {
        isCheckedIn: true,
        checkedInAt: new Date('2026-10-08T09:15:00Z'),
        scannedBy: cseOrganizer?._id,
      },
    });
  }

  let certAarav = await Certificate.findOne({ certificateId: 'CERT-2026-CMPL-8821' });
  if (!certAarav) {
    certAarav = await Certificate.create({
      certificateId: 'CERT-2026-CMPL-8821',
      eventId: completedEvent._id,
      studentId: aarav._id,
      registrationId: regAarav._id,
      certificateType: 'Completion',
      issueDate: new Date('2026-10-08T18:30:00Z'),
      verificationStatus: 'Verified',
    });
    console.log('[SeedStudents] Created Certificate for Aarav Patel: CERT-2026-CMPL-8821');
  }

  console.log('[SeedStudents] Previous student data successfully added to MongoDB Atlas!');
};

// Standalone execution support
if (process.argv[1] && process.argv[1].endsWith('seedPreviousStudents.js')) {
  seedPreviousStudents().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
