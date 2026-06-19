const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/maintenance/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all maintenance requests
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Users can only see their own requests unless admin
    if (req.user.role !== 'admin') {
      query.reportedBy = req.user.id;
    }

    const requests = await Maintenance.find(query)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Maintenance.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single request
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('notes.userId', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.user.role !== 'admin' && request.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create maintenance request
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/maintenance/${file.filename}`,
      name: file.originalname
    })) : [];

    const request = new Maintenance({
      ...req.body,
      reportedBy: req.user.id,
      images
    });
    await request.save();

    // Notify admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      title: 'New Maintenance Request',
      message: `${req.user.name} reported: ${request.title}`,
      type: 'maintenance',
      category: request.priority === 'urgent' ? 'urgent' : 'warning',
      link: `/maintenance/${request._id}`,
      metadata: { requestId: request._id }
    }));

    await Notification.insertMany(notifications);

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign request (admin only)
router.patch('/:id/assign', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.assignedTo = req.body.assignedTo;
    request.status = 'in-progress';
    await request.save();

    // Notify assigned user
    if (request.assignedTo) {
      await Notification.create({
        userId: request.assignedTo,
        title: 'Maintenance Request Assigned',
        message: `You have been assigned: ${request.title}`,
        type: 'maintenance',
        category: 'info',
        link: `/maintenance/${request._id}`
      });
    }

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update request status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.user.role !== 'admin' && request.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    request.status = req.body.status;
    if (req.body.status === 'completed') {
      request.completedAt = new Date();
    }

    await request.save();

    // Notify reporter
    await Notification.create({
      userId: request.reportedBy,
      title: 'Maintenance Request Updated',
      message: `Status updated to: ${req.body.status}`,
      type: 'maintenance',
      category: 'info',
      link: `/maintenance/${request._id}`
    });

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add note
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.notes.push({
      userId: req.user.id,
      note: req.body.note
    });

    await request.save();

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

