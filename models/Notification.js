const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['booking', 'event', 'announcement', 'maintenance', 'emergency', 'system', 'other'],
    default: 'system'
  },
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'urgent'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Notification', notificationSchema);

