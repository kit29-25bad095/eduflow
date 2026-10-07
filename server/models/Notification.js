const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ENROLLMENT',
        'ASSIGNMENT',
        'SUBMISSION',
        'GRADE',
        'COURSE',
        'SYSTEM',
        'COMPLETION',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['course', 'assignment', 'submission', 'user', 'system'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user notifications sorted by time
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
