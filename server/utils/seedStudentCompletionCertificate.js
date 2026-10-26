import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Venue from '../models/Venue.js';
import Department from '../models/Department.js';
import Registration from '../models/Registration.js';
import Certificate from '../models/Certificate.js';
import CollegeProfile from '../models/CollegeProfile.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventbridge');
  console.log('[SeedCertificate] Connected to MongoDB');

  // 1. Locate student.demo@gmail.com
  const student = await User.findOne({ email: 'student.demo@gmail.com' });
  if (!student) {
    console.error('Student student.demo@gmail.com not found!');
    process.exit(1);
  }
  console.log('[SeedCertificate] Found student:', student.name, '(', student.email, ')');

  // 2. Locate Organizer (CSE Faculty Lead) and Venue
  const organizer = await User.findOne({ email: 'cse.organizer@srmeaswari.ac.in' });
  const venue = await Venue.findOne({ code: 'INV-LAB-01' }) || await Venue.findOne({});
  const cseDept = await Department.findOne({ code: 'CSE' });

  if (!organizer || !venue) {
    console.error('Organizer or Venue missing!');
    process.exit(1);
  }

  // 3. Create or update Event 1: Completed Event with already issued Certificate of Completion
  const event1Slug = 'national-fullstack-cloud-hackathon-2026';
  let event1 = await Event.findOne({ title: 'National Full-Stack & Cloud Architecture Hackathon 2026' });

  if (!event1) {
    event1 = await Event.create({
      title: 'National Full-Stack & Cloud Architecture Hackathon 2026',
      description: 'An intensive 48-hour inter-college hackathon building scalable cloud systems, microservices, and reactive web architectures. Teams and participants demonstrated high technical proficiency across modern stack modules.',
      category: 'Technical',
      date: '2026-10-08',
      startTime: '09:00',
      endTime: '18:00',
      venueId: venue._id,
      organizerId: organizer._id,
      departmentId: cseDept?._id,
      status: 'completed',
      capacity: 150,
      registrationDeadline: new Date('2026-10-06T23:59:59Z'),
      isTeamEvent: false,
      allowCrossCollegeTeams: true,
      tags: ['Hackathon', 'FullStack', 'Cloud', 'MERN'],
      rules: [
        'All projects must be deployed on live cloud infrastructure.',
        '100% attendance and presentation demo required for certificate issuance.',
      ],
      prizes: [
        { rank: '1st Place', cashAmount: 50000, perks: 'Cloud Credits + Trophy + Certificate' },
        { rank: '2nd Place', cashAmount: 30000, perks: 'Trophy + Certificate' },
      ],
    });
    console.log('[SeedCertificate] Created Event 1 (Completed):', event1.title);
  } else {
    event1.status = 'completed';
    await event1.save();
    console.log('[SeedCertificate] Updated Event 1 to completed:', event1.title);
  }

  // 4. Create Registration for Event 1 (Checked In)
  let reg1 = await Registration.findOne({ eventId: event1._id, studentId: student._id });
  if (!reg1) {
    reg1 = await Registration.create({
      eventId: event1._id,
      studentId: student._id,
      participantId: student._id,
      registrationType: 'individual',
      registrationId: 'REG-2026-NFCA-889',
      ticketNumber: 'TKT-2026-NFCA-889',
      status: 'checked_in',
      checkInStatus: {
        isCheckedIn: true,
        checkedInAt: new Date('2026-10-08T09:15:00Z'),
        scannedBy: organizer._id,
      },
    });
    console.log('[SeedCertificate] Created Checked-in Registration for Event 1');
  } else {
    reg1.status = 'checked_in';
    reg1.checkInStatus = {
      isCheckedIn: true,
      checkedInAt: new Date('2026-10-08T09:15:00Z'),
      scannedBy: organizer._id,
    };
    await reg1.save();
    console.log('[SeedCertificate] Updated Registration 1 to checked_in');
  }

  // 5. Issue Official Certificate of Completion for Event 1
  let cert1 = await Certificate.findOne({ eventId: event1._id, studentId: student._id });
  if (!cert1) {
    cert1 = await Certificate.create({
      certificateId: 'CERT-2026-CMPL-8821',
      eventId: event1._id,
      studentId: student._id,
      registrationId: reg1._id,
      certificateType: 'Completion',
      issueDate: new Date('2026-10-08T18:30:00Z'),
      verificationStatus: 'Verified',
    });
    console.log('[SeedCertificate] Created Official Certificate of Completion:', cert1.certificateId);
  } else {
    cert1.certificateType = 'Completion';
    cert1.verificationStatus = 'Verified';
    await cert1.save();
    console.log('[SeedCertificate] Updated existing Certificate to Completion:', cert1.certificateId);
  }

  // 6. Create Event 2: Attended/Checked-in Completed Event ready for Organizer Certificate Generation
  let event2 = await Event.findOne({ title: 'Inter-College AI & Deep Learning Summit 2026' });
  if (!event2) {
    event2 = await Event.create({
      title: 'Inter-College AI & Deep Learning Summit 2026',
      description: 'Hands-on symposium exploring generative transformers, computer vision, and neural network pipelines with industry AI researchers.',
      category: 'Technical',
      date: '2026-10-10',
      startTime: '10:00',
      endTime: '17:00',
      venueId: venue._id,
      organizerId: organizer._id,
      departmentId: cseDept?._id,
      status: 'completed',
      capacity: 120,
      registrationDeadline: new Date('2026-10-09T23:59:59Z'),
      isTeamEvent: false,
      allowCrossCollegeTeams: true,
      tags: ['AI', 'DeepLearning', 'PyTorch', 'Summit'],
    });
    console.log('[SeedCertificate] Created Event 2 (Completed):', event2.title);
  } else {
    event2.status = 'completed';
    await event2.save();
  }

  let reg2 = await Registration.findOne({ eventId: event2._id, studentId: student._id });
  if (!reg2) {
    reg2 = await Registration.create({
      eventId: event2._id,
      studentId: student._id,
      participantId: student._id,
      registrationType: 'individual',
      registrationId: 'REG-2026-AIDS-412',
      ticketNumber: 'TKT-2026-AIDS-412',
      status: 'checked_in',
      checkInStatus: {
        isCheckedIn: true,
        checkedInAt: new Date('2026-10-10T10:12:00Z'),
        scannedBy: organizer._id,
      },
    });
    console.log('[SeedCertificate] Created Checked-in Registration for Event 2 (Ready for live generation in Organizer Portal)');
  } else {
    reg2.status = 'checked_in';
    reg2.checkInStatus = {
      isCheckedIn: true,
      checkedInAt: new Date('2026-10-10T10:12:00Z'),
      scannedBy: organizer._id,
    };
    await reg2.save();
  }

  console.log('\n=========================================');
  console.log('COMPLETION EVENT & CERTIFICATE SEED COMPLETE');
  console.log('=========================================');
  console.log('Student Account:');
  console.log('  Email: student.demo@gmail.com');
  console.log('  Password: StudentPassword2026!');
  console.log('  Name: Aarav Patel (BITS Pilani)');
  console.log('\nEvent 1 (Certificate Ready to View & Download):');
  console.log('  Title: National Full-Stack & Cloud Architecture Hackathon 2026');
  console.log('  Status: Completed');
  console.log('  Certificate Type: Completion');
  console.log('  Certificate ID: ' + cert1.certificateId);
  console.log('  Direct URL: http://localhost:3000/verify/' + cert1.certificateId);
  console.log('\nEvent 2 (Ready for Organizer Live Issuance):');
  console.log('  Title: Inter-College AI & Deep Learning Summit 2026');
  console.log('  Organizer: cse.organizer@srmeaswari.ac.in / OrganizerSecurePassword2026!');
  console.log('  Portal: http://localhost:3000/organizer/certificates');
  console.log('=========================================\n');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('[SeedCertificate] Error:', err);
  process.exit(1);
});
