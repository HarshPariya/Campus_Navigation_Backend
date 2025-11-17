const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: String,
  department: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  venue: {
    roomId: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: Number },
    coordinates: {
      x: { type: Number },
      y: { type: Number }
    }
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  organizer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['seminar', 'workshop', 'fest', 'exam', 'meeting', 'other'],
    default: 'other'
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  registrations: [registrationSchema],
  maxAttendees: {
    type: Number
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);

