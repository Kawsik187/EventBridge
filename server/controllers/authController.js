import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import User from '../models/User.js';
import CollegeProfile from '../models/CollegeProfile.js';
import Department from '../models/Department.js';
import OrganizerRequest from '../models/OrganizerRequest.js';
import AuditLog from '../models/AuditLog.js';
import { isTransactionSupported } from '../utils/dbHelper.js';
import { signToken } from '../utils/jwtHelper.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return signToken(id);
};

const sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  res.cookie('token', token, cookieOptions);
};

/**
 * Universal Register participant / student account (No .edu restriction)
 */
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      collegeName,
      departmentId,
      department,
      yearOfStudy,
      year,
      phone,
      collegeId,
      collegeProfileId,
      studentRollNumber,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const resolvedCollegeName = (collegeName || '').trim() || 'Independent University';
    const resolvedDepartment = (department || '').trim() || 'General Engineering';
    const resolvedYear = yearOfStudy || year || '1st Year';

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let deptDoc = null;
    if (departmentId) {
      deptDoc = await Department.findById(departmentId);
    } else if (department) {
      deptDoc = await Department.findOne({
        $or: [{ name: department }, { code: department }],
      });
    }

    // Auto-generate portfolio username
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const portfolioUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
      collegeName: resolvedCollegeName,
      department: deptDoc ? deptDoc.name : resolvedDepartment,
      departmentId: deptDoc ? deptDoc._id : null,
      yearOfStudy: resolvedYear,
      year: resolvedYear,
      phone: phone || '',
      collegeId: collegeId || '',
      collegeProfileId: collegeProfileId || null,
      studentRollNumber: studentRollNumber || '',
      status: 'active',
      organizerStatus: 'none',
      portfolio: {
        username: portfolioUsername,
        skills: [],
        totalPoints: 50, // Welcome points
      },
    });

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      department: user.department,
      departmentId: user.departmentId,
      yearOfStudy: user.yearOfStudy,
      year: user.year,
      phone: user.phone,
      collegeId: user.collegeId,
      collegeProfileId: user.collegeProfileId,
      portfolio: user.portfolio,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

export const registerStudent = registerUser;

/**
 * Register Decentralized College / Organization Host account
 */
export const registerHostOrganization = async (req, res) => {
  let session = null;
  let hasActiveTransaction = false;

  if (isTransactionSupported()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      hasActiveTransaction = true;
    } catch (err) {
      session = null;
      hasActiveTransaction = false;
    }
  }

  const sessionOption = hasActiveTransaction && session ? { session } : {};

  try {
    const {
      adminName,
      name,
      officialEmail,
      email,
      password,
      designation,
      officialPhone,
      phone,
      institutionName,
      collegeName,
      institutionType,
      website,
      city,
      state,
      country,
      description,
      verificationDocUrl,
    } = req.body;

    const contactName = adminName || name;
    const hostEmail = (officialEmail || email || '').toLowerCase().trim();
    const instName = (institutionName || collegeName || '').trim();

    if (!contactName || !hostEmail || !password || !instName || !city || !state) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message: 'Name, email, password, institution name, city, and state are required for host onboarding',
      });
    }

    const existingUser = await User.findOne({ email: hostEmail }, null, sessionOption);
    if (existingUser) {
      if (hasActiveTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Generate slug for college public page
    const baseSlug = instName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
    const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Create User with role: 'college_admin'
    const newAdmin = new User({
      name: contactName.trim(),
      email: hostEmail,
      password,
      role: 'college_admin',
      collegeName: instName,
      department: designation || 'Event Operations',
      yearOfStudy: 'Faculty / Staff',
      hostDetails: {
        designation: designation || 'Event Lead',
        officialPhone: officialPhone || phone || '',
        isHostApproved: false, // Requires super_admin approval
      },
      status: 'active',
      organizerStatus: 'pending',
    });
    await newAdmin.save(sessionOption);

    // 2. Create CollegeProfile
    const newCollegeProfile = new CollegeProfile({
      name: instName,
      slug,
      type: institutionType || 'college',
      officialEmail: hostEmail,
      website: website || '',
      description: description || '',
      location: { city, state, country: country || 'India' },
      verificationStatus: 'pending',
      verificationDocuments: verificationDocUrl
        ? [{ docType: 'aicte_letter', fileUrl: verificationDocUrl }]
        : [],
      primaryAdminId: newAdmin._id,
      adminTeam: [newAdmin._id],
    });
    await newCollegeProfile.save(sessionOption);

    // 3. Link CollegeProfile back to User
    newAdmin.collegeProfileId = newCollegeProfile._id;
    await newAdmin.save(sessionOption);

    if (hasActiveTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    const token = generateToken(newAdmin._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      collegeName: newAdmin.collegeName,
      collegeProfileId: newAdmin.collegeProfileId,
      collegeProfile: newCollegeProfile,
      hostDetails: newAdmin.hostDetails,
      isHostApproved: false,
      token,
      message: 'Host registration submitted successfully! Awaiting Platform Super Admin verification.',
    });
  } catch (error) {
    if (hasActiveTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).json({ message: error.message || 'Server error during host onboarding' });
  }
};

/**
 * Login user (Admin, College Admin, Organizer, Student)
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('departmentId', 'name code activeOrganizerId')
      .populate('collegeProfileId');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Account active/deactivation check
    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Account is deactivated. Please contact campus admin.' });
    }

    // Organizer authorization status check (legacy & department organizer requests)
    if (user.organizerStatus === 'pending') {
      return res.status(403).json({
        message: 'Your organizer request is still PENDING Campus Admin approval.',
        isPendingOrganizer: true,
      });
    }
    if (user.organizerStatus === 'rejected') {
      return res.status(403).json({
        message: 'Your organizer request was rejected by Campus Admin.',
        isRejectedOrganizer: true,
      });
    }
    if (user.organizerStatus === 'deactivated' || (user.role === 'organizer' && user.status === 'deactivated')) {
      return res.status(403).json({
        message: 'Your organizer privileges have been deactivated by Campus Admin.',
        isDeactivatedOrganizer: true,
      });
    }

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      department: user.department,
      departmentId: user.departmentId?._id || user.departmentId,
      departmentDetails: user.departmentId || null,
      collegeProfileId: user.collegeProfileId?._id || user.collegeProfileId,
      collegeProfile: user.collegeProfileId || null,
      hostDetails: user.hostDetails || null,
      isHostApproved: user.hostDetails?.isHostApproved ?? (user.role === 'admin' || user.role === 'super_admin'),
      yearOfStudy: user.yearOfStudy,
      year: user.year,
      phone: user.phone,
      collegeId: user.collegeId,
      avatar: user.avatar,
      portfolio: user.portfolio,
      organizerStatus: user.organizerStatus,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

/**
 * Logout user - clear HttpOnly cookie
 */
export const logoutUser = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * Google OAuth 2.0 Login / Signup
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential, email: mockEmail, name: mockName, picture: mockPicture, googleId: mockGoogleId } = req.body;

    let googleUser = null;

    // 1. Verify via Google Client ID if real token provided
    if (credential && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here.apps.googleusercontent.com') {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleUser = {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          googleId: payload.sub,
        };
      } catch (err) {
        console.warn('[Google Auth] Token verification failed with live Google API:', err.message);
      }
    }

    // 2. Fallback to passed Google profile (strictly for local development / test suites)
    if (!googleUser && (mockEmail || credential)) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ message: 'Google authentication failed: a verified Google ID token is required in production.' });
      }

      // Decode credential if JWT string
      if (credential && typeof credential === 'string' && credential.includes('.')) {
        try {
          const parts = credential.split('.');
          const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          googleUser = {
            email: decodedPayload.email,
            name: decodedPayload.name,
            picture: decodedPayload.picture,
            googleId: decodedPayload.sub,
          };
        } catch (e) {
          // ignore
        }
      }

      if (!googleUser && mockEmail) {
        googleUser = {
          email: mockEmail,
          name: mockName || mockEmail.split('@')[0],
          picture: mockPicture || '',
          googleId: mockGoogleId || `google_${Date.now()}`,
        };
      }
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ message: 'Google authentication failed: unable to retrieve Google profile' });
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail }).populate('departmentId', 'name code activeOrganizerId');

    if (user) {
      if (user.status === 'deactivated') {
        return res.status(403).json({ message: 'Account is deactivated. Please contact campus admin.' });
      }

      // Prevent unverified takeover of administrative accounts
      if (['admin', 'super_admin', 'organizer', 'college_admin'].includes(user.role)) {
        if (user.googleId && user.googleId !== googleUser.googleId) {
          return res.status(403).json({ message: 'Google account mismatch for administrative user. Please use password login.' });
        }
      }

      // Update Google metadata without altering password
      if (!user.googleId) user.googleId = googleUser.googleId;
      if (googleUser.picture && !user.avatar) user.avatar = googleUser.picture;
      await user.save();
    } else {
      // Create new participant account with Google identity
      user = await User.create({
        name: googleUser.name,
        email: normalizedEmail,
        googleId: googleUser.googleId,
        avatar: googleUser.picture || '',
        role: 'student',
        collegeName: 'SRM Easwari Engineering College',
        department: 'General Engineering',
        yearOfStudy: '1st Year',
        status: 'active',
        organizerStatus: 'none',
      });
    }

    // Note: Google sign-in authenticates identity, but does NOT grant instant organizer role
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      departmentId: user.departmentId?._id || user.departmentId,
      departmentDetails: user.departmentId || null,
      avatar: user.avatar,
      googleId: user.googleId,
      organizerStatus: user.organizerStatus,
      token: generateToken(user._id),
      isGoogleAuth: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during Google authentication' });
  }
};

/**
 * Request Organizer Access (Subject to Campus Admin approval)
 */
export const requestOrganizerAccess = async (req, res) => {
  try {
    const { name, email, phone, departmentId, collegeId, password } = req.body;

    if (!name || !email || !phone || !departmentId) {
      return res.status(400).json({ message: 'Full name, official college email, phone, and department are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce official college domain if configured
    const allowedDomain = process.env.ALLOWED_COLLEGE_EMAIL_DOMAIN || 'srmeaswari.ac.in';
    if (allowedDomain && allowedDomain.trim() !== '') {
      const emailDomain = normalizedEmail.split('@')[1];
      if (!emailDomain || (emailDomain !== allowedDomain && !emailDomain.endsWith('.' + allowedDomain))) {
        return res.status(400).json({
          message: `Organizer requests must use your official college email domain (@${allowedDomain}).`,
        });
      }
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Selected department does not exist' });
    }

    // Check if an organizer request is already pending for this user/email
    const pendingRequest = await OrganizerRequest.findOne({
      email: normalizedEmail,
      status: 'PENDING',
    });
    if (pendingRequest) {
      return res.status(400).json({
        message: 'You already have a pending organizer access request awaiting Admin review.',
        request: pendingRequest,
      });
    }

    // Find or create local user record
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'A secure password (at least 6 characters) is required for new accounts' });
      }

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'student', // NOT an organizer until approved!
        collegeName: 'SRM Easwari Engineering College',
        department: department.name,
        departmentId: department._id,
        phone: phone.trim(),
        collegeId: collegeId || '',
        organizerStatus: 'pending',
        status: 'active',
      });
    } else {
      user.department = department.name;
      user.departmentId = department._id;
      user.organizerStatus = 'pending';
      if (phone) user.phone = phone;
      if (collegeId) user.collegeId = collegeId;
      await user.save();
    }

    // Create the OrganizerRequest record for Admin review
    const organizerRequest = await OrganizerRequest.create({
      userId: user._id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      collegeId: collegeId || '',
      departmentId: department._id,
      departmentName: department.name,
      departmentCode: department.code,
      status: 'PENDING',
    });

    // Create audit record
    await AuditLog.create({
      action: 'ORGANIZER_REQUEST_SUBMITTED',
      performedBy: user._id,
      performedByName: user.name,
      targetUserId: user._id,
      targetDepartmentId: department._id,
      details: {
        departmentCode: department.code,
        departmentName: department.name,
        email: normalizedEmail,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Organizer access request submitted successfully. It is now PENDING review by Campus Admin.',
      request: organizerRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting organizer access request' });
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('departmentId', 'name code activeOrganizerId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};

/**
 * Update current user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name ?? user.name;
    user.collegeName = req.body.collegeName ?? user.collegeName;
    user.phone = req.body.phone ?? user.phone;
    user.year = req.body.year ?? user.year;
    user.yearOfStudy = req.body.yearOfStudy ?? req.body.year ?? user.yearOfStudy;
    user.collegeId = req.body.collegeId ?? user.collegeId;

    // Organizers CANNOT change their department!
    if (user.role === 'student') {
      if (req.body.departmentId) {
        user.departmentId = req.body.departmentId;
        const d = await Department.findById(req.body.departmentId);
        if (d) user.department = d.name;
      } else if (req.body.department) {
        user.department = req.body.department;
      }
    }

    if (req.body.password && req.body.password.length >= 6) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      collegeName: updatedUser.collegeName,
      department: updatedUser.department,
      departmentId: updatedUser.departmentId,
      year: updatedUser.year,
      yearOfStudy: updatedUser.yearOfStudy,
      phone: updatedUser.phone,
      collegeId: updatedUser.collegeId,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile' });
  }
};
