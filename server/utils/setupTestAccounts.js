import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Department from '../models/Department.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventbridge');
  console.log('Connected to MongoDB');

  const cse = await Department.findOne({ code: 'CSE' });
  if (!cse) {
    console.error('CSE department not found!');
    process.exit(1);
  }

  // 1. Admin
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';
  let admin = await User.findOne({ email: 'admin@campus.edu' }).select('+password');
  if (!admin) {
    admin = new User({
      name: 'Campus Admin Office',
      email: 'admin@campus.edu',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      department: 'Dean of Student Affairs',
      collegeId: 'ADM-001',
    });
  } else {
    admin.password = adminPassword;
    admin.role = 'admin';
    admin.status = 'active';
  }
  await admin.save();
  console.log('Admin ready: admin@campus.edu /', adminPassword);

  // 2. Organizer
  const orgEmail = 'organizer@srmeaswari.ac.in';
  const orgPassword = 'OrganizerPassword2026!';
  let org = await User.findOne({ email: orgEmail }).select('+password');
  if (!org) {
    org = new User({
      name: 'Dr. Ramesh CSE Organizer',
      email: orgEmail,
      password: orgPassword,
      role: 'organizer',
      organizerStatus: 'active',
      status: 'active',
      department: cse.name,
      departmentId: cse._id,
      phone: '9876543210',
      collegeId: 'FAC-CSE-001',
    });
  } else {
    org.password = orgPassword;
    org.role = 'organizer';
    org.organizerStatus = 'active';
    org.status = 'active';
    org.department = cse.name;
    org.departmentId = cse._id;
  }
  await org.save();
  cse.activeOrganizerId = org._id;
  await cse.save();
  console.log('Organizer ready:', orgEmail, '/', orgPassword);

  // 3. Student
  const stuEmail = 'student@srmeaswari.ac.in';
  const stuPassword = 'StudentPassword2026!';
  let stu = await User.findOne({ email: stuEmail }).select('+password');
  if (!stu) {
    stu = new User({
      name: 'Priya Ramanathan',
      email: stuEmail,
      password: stuPassword,
      role: 'student',
      organizerStatus: 'none',
      status: 'active',
      department: cse.name,
      departmentId: cse._id,
      year: '3rd Year',
      phone: '9876543211',
      collegeId: 'STU-2024-CSE-042',
    });
  } else {
    stu.password = stuPassword;
    stu.role = 'student';
    stu.status = 'active';
  }
  await stu.save();
  console.log('Student ready:', stuEmail, '/', stuPassword);

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
