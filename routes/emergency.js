const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get active emergencies
router.get('/', async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .populate('issuedBy', 'name')
      .sort({ severity: -1, createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all emergencies (admin only)
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const emergencies = await Emergency.find()
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create emergency alert (admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const emergency = new Emergency({
      ...req.body,
      issuedBy: req.user.id
    });
    await emergency.save();

    // Create notifications for all users
    const User = require('../models/User');
    const users = await User.find({});

    const notifications = users.map(user => ({
      userId: user._id,
      title: emergency.title,
      message: emergency.message,
      type: 'emergency',
      category: emergency.severity === 'critical' ? 'urgent' : 'warning',
      link: `/emergency/${emergency._id}`,
      metadata: { emergencyId: emergency._id }
    }));

    await Notification.insertMany(notifications);

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency', emergency);
    }

    res.status(201).json(emergency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Acknowledge emergency
router.post('/:id/acknowledge', protect, async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const hasAcknowledged = emergency.acknowledgedBy.some(
      a => a.userId.toString() === req.user.id
    );

    if (!hasAcknowledged) {
      emergency.acknowledgedBy.push({ userId: req.user.id });
      await emergency.save();
    }

    res.json(emergency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update emergency
router.patch('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    Object.assign(emergency, req.body);
    await emergency.save();

    res.json(emergency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

