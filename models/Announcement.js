const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide announcement title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide announcement content'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scope: {
    type: String,
    enum: ['campus-wide', 'department', 'year', 'role'],
    default: 'campus-wide'
  },
  targetDepartment: {
    type: String,
    trim: true
  },
  targetYear: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th', 'Graduate', null],
    default: null
  },
  targetRole: {
    type: String,
    enum: ['student', 'faculty', 'admin', null],
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  attachments: [{
    url: String,
    name: String,
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
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

announcementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);

