const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, category, date, upcoming, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $in: ['upcoming', 'ongoing'] };
    }
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: regex },
        { description: regex },
        { organizer: regex },
        { 'venue.building': regex },
        { 'venue.roomId': regex }
      ];
    }

    const events = await Event.find(query)
      .populate('attendees', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendees', 'name email')
      .populate('registrations.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Admin/Faculty)
router.post('/', protect, authorize('admin', 'faculty'), [
  body('title').notEmpty().withMessage('Event title is required'),
  body('venue.roomId').notEmpty().withMessage('Venue room ID is required'),
  body('venue.building').notEmpty().withMessage('Venue building is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('organizer').notEmpty().withMessage('Organizer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const event = await Event.create({
      ...req.body,
      organizer: req.user.name
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('event-created', event);
    }

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin/Faculty)
router.put('/:id', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('attendees', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('event-updated', event);
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin/Faculty)
router.delete('/:id', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('event-deleted', req.params.id);
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for event
// @access  Private
router.post('/:id/register', protect, [
  body('phone').optional().isString().isLength({ min: 6, max: 20 }),
  body('department').optional().isString().isLength({ max: 120 }),
  body('notes').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.registrations?.some(reg => reg.userId.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    // Check if already registered
    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    // Check capacity
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    event.attendees.push(req.user.id);
    event.registrations.push({
      userId: req.user.id,
      phone: req.body.phone || '',
      department: req.body.department || '',
      notes: req.body.notes || ''
    });
    await event.save();

    const updatedEvent = await Event.findById(req.params.id)
      .populate('attendees', 'name email')
      .populate('registrations.userId', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('event-registration-updated', updatedEvent);
    }

    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

