const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide emergency title'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide emergency message'],
    trim: true
  },
  type: {
    type: String,
    enum: ['alert', 'warning', 'critical', 'info'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    building: String,
    area: String,
    coordinates: {
      x: Number,
      y: Number
    }
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  affectedAreas: [String],
  instructions: [String],
  contactInfo: {
    phone: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  acknowledgedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

emergencySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Emergency', emergencySchema);

