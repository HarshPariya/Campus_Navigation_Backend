const mongoose = require('mongoose');
const crypto = require('crypto');

const qrCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['room-access', 'event-ticket', 'resource-booking', 'attendance', 'maintenance'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceType'
  },
  resourceType: {
    type: String,
    enum: ['Room', 'Event', 'Resource', 'Maintenance', null]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  scannedAt: {
    type: Date
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

qrCodeSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('QRCode', qrCodeSchema);

