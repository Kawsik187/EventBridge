import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      enum: [
        'Registration Desk',
        'Technical Support',
        'Stage Management',
        'Hospitality',
        'Crowd Management',
        'Photography',
        'Logistics',
        'Certificate Distribution',
        'Venue Support',
        'Certificate Desk',
      ],
      default: 'Registration Desk',
    },
    task: {
      type: String,
      default: 'General assistance and event coordination',
    },
    status: {
      type: String,
      enum: ['applied', 'assigned', 'accepted', 'rejected', 'completed'],
      default: 'assigned',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

volunteerSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const Volunteer = mongoose.model('Volunteer', volunteerSchema);
export default Volunteer;
