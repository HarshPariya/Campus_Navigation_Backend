const express = require('express');
const router = express.Router();
const { Route, Vehicle, Tracking } = require('../models/Transportation');
const { protect } = require('../middleware/auth');

// Get all routes
router.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ routeNumber: 1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single route
router.get('/routes/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get vehicles for route
router.get('/routes/:id/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      routeId: req.params.id,
      status: 'active'
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get vehicle tracking
router.get('/vehicles/:id/tracking', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const latestTracking = await Tracking.findOne({ vehicleId: req.params.id })
      .sort({ 'location.timestamp': -1 });

    res.json({
      vehicle,
      currentLocation: latestTracking?.location || vehicle.currentLocation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'active' })
      .populate('routeId')
      .sort({ vehicleNumber: 1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create route (admin only)
router.post('/routes', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create vehicle (admin only)
router.post('/vehicles', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update vehicle location (for tracking)
router.post('/vehicles/:id/tracking', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const tracking = new Tracking({
      vehicleId: req.params.id,
      location: {
        coordinates: req.body.coordinates,
        timestamp: new Date()
      },
      speed: req.body.speed,
      heading: req.body.heading
    });

    await tracking.save();

    // Update vehicle current location
    vehicle.currentLocation = {
      coordinates: req.body.coordinates,
      lastUpdated: new Date()
    };
    await vehicle.save();

    res.json(tracking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

