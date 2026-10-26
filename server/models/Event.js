import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { type: String, enum: ['text', 'number', 'select', 'checkbox', 'url'], default: 'text' },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
});

const scheduleItemSchema = new mongoose.Schema({
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
});

const stageRoundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['quiz', 'idea_submission', 'code_repo', 'presentation', 'offline_evaluation'],
    default: 'idea_submission',
  },
  description: { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  submissionDeadline: { type: Date, default: () => new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
  submissionConfig: {
    allowFileUpload: { type: Boolean, default: true },
    allowedFileTypes: [{ type: String, default: '.pdf' }],
    maxFileSizeMb: { type: Number, default: 25 },
    requireGithubUrl: { type: Boolean, default: false },
    requireDemoUrl: { type: Boolean, default: false },
    instructions: { type: String, default: '' },
  },
  isElimination: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'evaluation_in_progress', 'completed'],
    default: 'upcoming',
  },
  evaluators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      default: 'Hackathon',
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=60',
    },
    thumbnailUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop&q=60',
    },

    // Host Organization / College
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    hostCollegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeProfile',
      default: null,
      index: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String,
      default: 'EventBridge Organizer',
    },

    // Cross-College Eligibility
    eligibilityType: {
      type: String,
      enum: ['open_to_all', 'college_restricted'],
      default: 'open_to_all',
      index: true,
    },
    allowedUniversities: [{ type: String, trim: true }],
    allowedCollegeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CollegeProfile' }],
    allowCrossCollegeTeams: {
      type: Boolean,
      default: true, // True allows members from different universities to form a team
    },

    // Team & Registration format
    registrationType: {
      type: String,
      enum: ['individual_only', 'team_only', 'both'],
      default: 'both',
    },
    minTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      max: 10,
    },

    // Event Format & Logistics
    format: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'online',
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
    },
    venueDetails: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
    },

    // Dates & Deadlines
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '18:00',
    },
    registrationStartDate: {
      type: Date,
      default: Date.now,
    },
    registrationEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      index: true,
    },
    registrationDeadline: {
      type: String,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },

    // Multi-Stage Rounds Hierarchy
    rounds: [stageRoundSchema],
    currentRoundNumber: {
      type: Number,
      default: 1,
    },

    // Capacity & Registrations
    maxParticipants: {
      type: Number,
      default: 500,
      min: 1,
    },
    currentRegistrations: {
      type: Number,
      default: 0,
    },

    // Gamification & Prizes
    prizes: [
      {
        rank: { type: String },
        cashAmount: { type: Number, default: 0 },
        perks: { type: String, default: '' },
      },
    ],
    tags: [{ type: String, lowercase: true, trim: true }],

    // Legacy fields for backward compatibility
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    departmentName: {
      type: String,
      default: '',
    },
    departmentCode: {
      type: String,
      default: '',
    },
    eligibility: {
      type: String,
      default: 'Open to all university students',
    },
    rules: [{ type: String }],
    schedule: [scheduleItemSchema],
    contactInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    customFields: [customFieldSchema],
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'open', 'closed', 'live', 'completed', 'cancelled', 'published', 'active'],
      default: 'approved',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ status: 1, eligibilityType: 1, registrationEndDate: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Event = mongoose.model('Event', eventSchema);
export default Event;
