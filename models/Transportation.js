const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  stops: [{
    name: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    order: Number
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All']
    },
    times: [String]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
});

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['bus', 'shuttle', 'van'],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportRoute'
  },
  currentLocation: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    lastUpdated: Date
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  driver: {
    name: String,
    phone: String
  }
});

const trackingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportVehicle',
    required: true
  },
  location: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  speed: Number,
  heading: Number
});

const Route = mongoose.model('TransportRoute', routeSchema);
const Vehicle = mongoose.model('TransportVehicle', vehicleSchema);
const Tracking = mongoose.model('TransportTracking', trackingSchema);

module.exports = { Route, Vehicle, Tracking };

