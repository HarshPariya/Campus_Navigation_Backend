const express = require('express');
const { body, validationResult } = require('express-validator');
const Faculty = require('../models/Faculty');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/faculty
// @desc    Get all faculty
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = {};

    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const faculty = await Faculty.find(query)
      .populate('userId', 'name email')
      .sort({ department: 1, name: 1 });

    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/faculty/:id
// @desc    Get single faculty member
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/faculty
// @desc    Create faculty profile
// @access  Private (Admin/Faculty)
router.post('/', protect, authorize('admin', 'faculty'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('cabin.roomId').notEmpty().withMessage('Cabin room ID is required'),
  body('cabin.building').notEmpty().withMessage('Cabin building is required'),
  body('cabin.floor').isInt().withMessage('Floor must be a number'),
  body('cabin.coordinates.x').isNumeric().withMessage('X coordinate is required'),
  body('cabin.coordinates.y').isNumeric().withMessage('Y coordinate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if faculty profile already exists
    const existingFaculty = await Faculty.findOne({ userId: req.user.id });
    if (existingFaculty) {
      return res.status(400).json({ success: false, message: 'Faculty profile already exists' });
    }

    const faculty = await Faculty.create({
      ...req.body,
      userId: req.user.id
    });

    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('userId', 'name email');

    res.status(201).json({ success: true, data: populatedFaculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/faculty/:id
// @desc    Update faculty profile
// @access  Private (Admin/Faculty)
router.put('/:id', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    // Check if user owns this profile or is admin
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (faculty.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('faculty-updated', updatedFaculty);
    }

    res.json({ success: true, data: updatedFaculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/faculty/:id/availability
// @desc    Update faculty availability
// @access  Private (Faculty)
router.put('/:id/availability', protect, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (faculty.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { isAvailable, currentStatus, schedule } = req.body;
    const updateData = {};
    if (isAvailable !== undefined) updateData['availability.isAvailable'] = isAvailable;
    if (currentStatus !== undefined) updateData['availability.currentStatus'] = currentStatus;
    if (schedule !== undefined) updateData['availability.schedule'] = schedule;

    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('userId', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('faculty-availability-updated', updatedFaculty);
    }

    res.json({ success: true, data: updatedFaculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

