const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { building, floor, type, search } = req.query;
    let query = {};

    if (building) query.building = building;
    if (floor) query.floor = parseInt(floor);
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomId: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } }
      ];
    }

    const rooms = await Room.find(query).sort({ building: 1, floor: 1, name: 1 });
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private (Admin/Faculty)
router.post('/', protect, authorize('admin', 'faculty'), [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('name').notEmpty().withMessage('Room name is required'),
  body('building').notEmpty().withMessage('Building is required'),
  body('floor').isInt().withMessage('Floor must be a number'),
  body('coordinates.x').isNumeric().withMessage('X coordinate is required'),
  body('coordinates.y').isNumeric().withMessage('Y coordinate is required'),
  body('type').isIn(['classroom', 'lab', 'office', 'library', 'seminar', 'auditorium']).withMessage('Invalid room type'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const room = await Room.create(req.body);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-updated', room);
    }

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Room ID already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin/Faculty)
router.put('/:id', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-updated', room);
    }

    res.json({ success: true, data: room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ roomId: req.params.id });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-deleted', req.params.id);
    }

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/rooms/:id/availability
// @desc    Update room availability
// @access  Private
router.put('/:id/availability', protect, async (req, res) => {
  try {
    const { isAvailable, currentOccupancy } = req.body;
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.id },
      { isAvailable, currentOccupancy },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-availability-updated', room);
    }

    res.json({ success: true, data: room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/rooms/:id/schedule
// @desc    Update room schedule
// @access  Private (Admin/Faculty)
router.put('/:id/schedule', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { schedule } = req.body;
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.id },
      { schedule },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-schedule-updated', room);
    }

    res.json({ success: true, data: room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/rooms/:id/book
// @desc    Book a room
// @access  Private
router.post('/:id/book', protect, [
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('purpose').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const room = await Room.findOne({ roomId: req.params.id });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ success: false, message: 'Room is not available for booking' });
    }

    const { startTime, endTime, purpose } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Check for conflicting bookings
    const conflictingBooking = room.bookings.find(booking => {
      if (booking.status === 'cancelled') return false;
      return (start < booking.endTime && end > booking.startTime);
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is already booked for this time slot' 
      });
    }

    // Add booking
    room.bookings.push({
      userId: req.user.id,
      startTime: start,
      endTime: end,
      purpose: purpose || '',
      status: 'confirmed'
    });

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('bookings.userId', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-booked', updatedRoom);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Room booked successfully',
      data: updatedRoom 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id/bookings
// @desc    Get room bookings
// @access  Private
router.get('/:id/bookings', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id })
      .populate('bookings.userId', 'name email')
      .select('bookings');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: room.bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

