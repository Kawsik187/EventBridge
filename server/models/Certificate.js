import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
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
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    certificateType: {
      type: String,
      enum: ['Participation', 'Completion', 'Winner', 'Runner-up', 'Volunteer', 'Organizer'],
      default: 'Participation',
    },
    verificationStatus: {
      type: String,
      default: 'Verified',
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ eventId: 1, studentId: 1, certificateType: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
