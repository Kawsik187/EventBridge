import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member',
    },
    collegeName: {
      type: String,
      default: 'Independent',
    },
    universityName: {
      type: String,
      default: 'Independent',
    },
    department: {
      type: String,
      default: '',
    },
    yearOfStudy: {
      type: String,
      default: '',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    members: [teamMemberSchema],
    isCrossCollege: {
      type: Boolean,
      default: false,
    },
    currentRoundNumber: {
      type: Number,
      default: 1,
    },
    isEliminated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['forming', 'complete', 'disqualified', 'withdrawn'],
      default: 'forming',
    },
  },
  { timestamps: true }
);

// Prevent duplicate membership for the same event
teamSchema.index({ eventId: 1, 'members.userId': 1 }, { unique: true });
teamSchema.index({ eventId: 1, currentRoundNumber: 1, isEliminated: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
