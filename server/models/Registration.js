import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team'],
      default: 'individual',
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    ticketNumber: {
      type: String,
      uppercase: true,
      default: '',
    },
    customResponses: {
      type: Map,
      of: String,
      default: {},
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'checked_in', 'cancelled', 'no_show'],
      default: 'confirmed',
    },
    checkInStatus: {
      isCheckedIn: { type: Boolean, default: false },
      checkedInAt: { type: Date, default: null },
      scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Sync participantId and ticketNumber before save
registrationSchema.pre('save', function (next) {
  if (!this.participantId && this.studentId) {
    this.participantId = this.studentId;
  }
  if (!this.studentId && this.participantId) {
    this.studentId = this.participantId;
  }
  if (!this.ticketNumber && this.registrationId) {
    this.ticketNumber = this.registrationId;
  }
  if (!this.registrationId && this.ticketNumber) {
    this.registrationId = this.ticketNumber;
  }
  next();
});

// Compound index to prevent duplicate registrations for same student and event
registrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ eventId: 1, teamId: 1 });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
