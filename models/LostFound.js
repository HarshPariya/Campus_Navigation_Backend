const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'books', 'accessories', 'documents', 'other'],
    default: 'other'
  },
  location: {
    building: String,
    room: String,
    floor: Number,
    coordinates: {
      x: Number,
      y: Number
    },
    description: String
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'claimed', 'resolved', 'closed'],
    default: 'open'
  },
  images: [{
    url: String,
    name: String
  }],
  contactInfo: {
    email: String,
    phone: String
  },
  verificationCode: {
    type: String,
    unique: true,
    sparse: true
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

lostFoundSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isNew && this.type === 'found') {
    this.verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('LostFound', lostFoundSchema);

