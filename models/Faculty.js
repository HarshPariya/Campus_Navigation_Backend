const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  cabin: {
    roomId: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: Number, required: true },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      timeSlots: [{
        startTime: String,
        endTime: String
      }]
    }],
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentStatus: {
      type: String,
      enum: ['available', 'busy', 'in-meeting', 'out-of-office'],
      default: 'available'
    }
  },
  contact: {
    email: String,
    phone: String,
    extension: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Faculty', facultySchema);

