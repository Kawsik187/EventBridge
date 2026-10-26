import mongoose from 'mongoose';

const evaluationScoreSchema = new mongoose.Schema(
  {
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rubricScores: [
      {
        criterion: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 100 },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
    },
    feedback: {
      type: String,
      default: '',
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissionData: {
      title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
      },
      abstract: {
        type: String,
        default: '',
      },
      fileUrl: {
        type: String,
        default: '',
      },
      fileType: {
        type: String,
        default: '',
      },
      githubRepoUrl: {
        type: String,
        default: '',
      },
      liveDemoUrl: {
        type: String,
        default: '',
      },
      additionalNotes: {
        type: String,
        default: '',
      },
    },
    evaluations: [evaluationScoreSchema],
    averageScore: {
      type: Number,
      default: 0,
    },
    verdict: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'winner'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

submissionSchema.index({ eventId: 1, roundNumber: 1, teamId: 1 }, { unique: true, sparse: true });
submissionSchema.index({ eventId: 1, roundNumber: 1, userId: 1 }, { unique: true, sparse: true });
submissionSchema.index({ eventId: 1, roundNumber: 1, verdict: 1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
