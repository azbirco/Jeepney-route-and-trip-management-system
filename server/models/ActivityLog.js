import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // System-level activities can have a null user reference
  },
  action: {
    type: String,
    required: [true, 'Activity action is required.'],
    trim: true
  },
  details: {
    type: String,
    required: [true, 'Activity details are required.'],
    trim: true
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for audit trails
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
