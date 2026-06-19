const express = require('express');
const router = express.Router();
const LostFound = require('../models/LostFound');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/lostfound/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all lost & found items
router.get('/', protect, async (req, res) => {
  try {
    const { type, category, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    const items = await LostFound.find(query)
      .populate('reportedBy', 'name email')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LostFound.countDocuments(query);

    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single item
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('claimedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create lost/found item
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/lostfound/${file.filename}`,
      name: file.originalname
    })) : [];

    const item = new LostFound({
      ...req.body,
      reportedBy: req.user.id,
      images
    });
    await item.save();

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Claim item
router.post('/:id/claim', protect, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'open') {
      return res.status(400).json({ message: 'Item is not available for claiming' });
    }

    const { verificationCode } = req.body;
    if (item.type === 'found' && item.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    item.claimedBy = req.user.id;
    item.status = 'claimed';
    await item.save();

    // Notify reporter
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: item.reportedBy,
      title: 'Item Claimed',
      message: `Your ${item.type} item "${item.title}" has been claimed.`,
      type: 'system',
      category: 'info'
    });

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update item
router.patch('/:id', protect, upload.array('images', 5), async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/lostfound/${file.filename}`,
        name: file.originalname
      }));
      item.images = [...(item.images || []), ...newImages];
    }

    Object.assign(item, req.body);
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Resolve item
router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (req.user.role !== 'admin' && item.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    item.status = 'resolved';
    item.resolvedAt = new Date();
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

