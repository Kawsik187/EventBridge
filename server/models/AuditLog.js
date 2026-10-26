import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'ORGANIZER_REQUEST_SUBMITTED',
        'ORGANIZER_APPROVED',
        'ORGANIZER_REJECTED',
        'ORGANIZER_REPLACED',
        'ORGANIZER_DEACTIVATED',
        'ORGANIZER_ASSIGNED',
        'EVENT_APPROVED',
        'EVENT_REJECTED',
        'EVENT_CREATED',
        'EVENT_DELETED',
        'USER_DEACTIVATED',
        'USER_ACTIVATED',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    performedByName: {
      type: String,
      default: 'System',
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
