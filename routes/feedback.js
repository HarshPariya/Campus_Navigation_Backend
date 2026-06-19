const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/feedback/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all feedback
router.get('/', async (req, res) => {
  try {
    const { type, targetId, rating, page = 1, limit = 20 } = req.query;
    const query = { isPublic: true, status: 'approved' };

    if (type) query.type = type;
    if (targetId) query.targetId = targetId;
    if (rating) query.rating = parseInt(rating);

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    // Calculate average rating
    const avgRating = await Feedback.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      averageRating: avgRating[0]?.avgRating || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's feedback
router.get('/my-feedback', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create feedback
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/feedback/${file.filename}`,
      name: file.originalname
    })) : [];

    const feedback = new Feedback({
      ...req.body,
      userId: req.user.id,
      images
    });

    await feedback.save();

    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark feedback as helpful
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const hasMarked = feedback.helpfulUsers.some(
      u => u.toString() === req.user.id
    );

    if (hasMarked) {
      feedback.helpfulCount -= 1;
      feedback.helpfulUsers = feedback.helpfulUsers.filter(
        u => u.toString() !== req.user.id
      );
    } else {
      feedback.helpfulCount += 1;
      feedback.helpfulUsers.push(req.user.id);
    }

    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin: Approve/Reject feedback
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = req.body.status;
    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin: Respond to feedback
router.post('/:id/response', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.response = {
      adminId: req.user.id,
      message: req.body.message,
      respondedAt: new Date()
    };

    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

