const express = require('express');
const { body, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/resources
// @desc    Get all resources with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, status, roomId, building, search } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (roomId) query['location.roomId'] = roomId;
    if (building) query['location.building'] = building;
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: regex },
        { 'location.roomId': regex },
        { 'location.building': regex }
      ];
    }

    const resources = await Resource.find(query)
      .populate('currentUser', 'name email')
      .populate('reservation.userId', 'name email')
      .sort({ 'location.building': 1, 'location.floor': 1 });

    res.json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/resources/:id
// @desc    Get single resource
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('currentUser', 'name email')
      .populate('reservation.userId', 'name email');
    
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/resources
// @desc    Create new resource
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), [
  body('name').notEmpty().withMessage('Resource name is required'),
  body('type').isIn(['library-seat', 'computer', 'lab-equipment', 'study-room', 'other']).withMessage('Invalid resource type'),
  body('location.roomId').notEmpty().withMessage('Room ID is required'),
  body('location.building').notEmpty().withMessage('Building is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const resource = await Resource.create(req.body);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('resource-created', resource);
    }

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update resource
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('currentUser', 'name email');

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('resource-updated', resource);
    }

    res.json({ success: true, data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete resource
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('resource-deleted', req.params.id);
    }

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/resources/:id/reserve
// @desc    Reserve resource
// @access  Private
router.post('/:id/reserve', protect, [
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (resource.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Resource is not available' });
    }

    const { startTime, endTime } = req.body;
    resource.status = 'reserved';
    resource.reservation = {
      userId: req.user.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    };

    await resource.save();

    const updatedResource = await Resource.findById(req.params.id)
      .populate('reservation.userId', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('resource-reserved', updatedResource);
    }

    res.json({ success: true, data: updatedResource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/resources/:id/status
// @desc    Update resource status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, currentUser } = req.body;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    resource.status = status;
    if (currentUser) {
      resource.currentUser = currentUser;
    } else {
      resource.currentUser = null;
    }

    await resource.save();

    const updatedResource = await Resource.findById(req.params.id)
      .populate('currentUser', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('resource-status-updated', updatedResource);
    }

    res.json({ success: true, data: updatedResource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

