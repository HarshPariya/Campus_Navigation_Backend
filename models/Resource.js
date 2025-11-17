const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['library-seat', 'computer', 'lab-equipment', 'study-room', 'other'],
    required: true
  },
  location: {
    roomId: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: Number },
    coordinates: {
      x: { type: Number },
      y: { type: Number }
    }
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  currentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reservation: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: Date,
    endTime: Date
  },
  metadata: {
    seatNumber: String,
    computerId: String,
    equipmentName: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);

