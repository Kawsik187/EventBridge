import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['qr_scan', 'manual'],
      default: 'qr_scan',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
