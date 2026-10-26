import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const badgeSchema = new mongoose.Schema(
  {
    badgeId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    iconUrl: { type: String, required: true },
    category: {
      type: String,
      enum: ['hackathon_winner', 'top_coder', 'mentor', 'streak', 'contributor'],
      default: 'hackathon_winner',
    },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventName: { type: String, required: true },
    position: {
      type: String,
      enum: ['1st Place', '2nd Place', '3rd Place', 'Finalist', 'Special Mention', 'Participant'],
      required: true,
    },
    teamName: { type: String, default: '' },
    certificateUrl: { type: String, default: '' },
    awardedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    avatar: {
      type: String,
      default: 'https://api.dicebear.com/7.x/identicon/svg?seed=avatar',
    },
    role: {
      type: String,
      enum: ['student', 'participant', 'college_admin', 'organizer', 'org_admin', 'admin', 'super_admin', 'evaluator'],
      default: 'student',
      index: true,
    },

    // Multi-tenant organization affiliation
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    collegeProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeProfile',
      default: null,
      index: true,
    },

    // Universal Participant Academic Details
    collegeName: {
      type: String,
      trim: true,
      default: 'SRM Easwari Engineering College',
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'General Engineering',
    },
    yearOfStudy: {
      type: String,
      trim: true,
      default: '1st Year',
    },
    studentRollNumber: {
      type: String,
      trim: true,
      default: '',
    },

    // Host / College Admin Details
    hostDetails: {
      designation: { type: String, trim: true, default: '' },
      officialPhone: { type: String, trim: true, default: '' },
      isHostApproved: { type: Boolean, default: false, index: true },
    },

    // Academic Credentials (Extended details)
    academicProfile: {
      universityName: { type: String, trim: true, default: '' },
      collegeIdRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
      degree: { type: String, trim: true, default: 'B.Tech' },
      major: { type: String, trim: true, default: 'Computer Science' },
      graduationYear: { type: Number, default: 2026 },
      studentRollNumber: { type: String, trim: true, default: '' },
    },
    // Public Gamified Portfolio
    portfolio: {
      username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
      bio: { type: String, maxlength: 500, default: '' },
      headline: { type: String, maxlength: 120, default: '' },
      skills: [{ type: String, trim: true }],
      socials: {
        github: { type: String, trim: true, default: '' },
        linkedin: { type: String, trim: true, default: '' },
        leetcode: { type: String, trim: true, default: '' },
        portfolioUrl: { type: String, trim: true, default: '' },
      },
      badges: [badgeSchema],
      achievements: [achievementSchema],
      totalPoints: { type: Number, default: 0, index: -1 },
    },
    // Legacy support fields for existing controllers/seeds
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    organizerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'active', 'rejected', 'deactivated'],
      default: 'none',
    },
    year: {
      type: String,
      default: '1st Year',
    },
    phone: {
      type: String,
      default: '',
    },
    collegeId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1, collegeName: 1 });
userSchema.index({ 'academicProfile.universityName': 1 });
userSchema.index({ 'portfolio.skills': 1 });
userSchema.index({ role: 1, organizationId: 1 });
userSchema.index({ role: 1, 'hostDetails.isHostApproved': 1 });

// Sync top-level fields with legacy nested academicProfile before save
userSchema.pre('save', function (next) {
  if (this.collegeName && (!this.academicProfile || !this.academicProfile.universityName)) {
    if (!this.academicProfile) this.academicProfile = {};
    this.academicProfile.universityName = this.collegeName;
  }
  if (this.yearOfStudy && !this.year) {
    this.year = this.yearOfStudy;
  }
  next();
});

// Encrypt password before save
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
