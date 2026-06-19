const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get all announcements
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, scope, department, priority } = req.query;
    const query = { isActive: true };

    // Filter by scope
    if (scope) {
      query.scope = scope;
      if (scope === 'department' && req.user.department) {
        query.targetDepartment = req.user.department;
      } else if (scope === 'year' && req.user.year) {
        query.targetYear = req.user.year;
      } else if (scope === 'role') {
        query.targetRole = req.user.role;
      }
    }

    if (department) query.targetDepartment = department;
    if (priority) query.priority = priority;

    // Check expiration
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const announcements = await Announcement.find(query)
      .populate('author', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Announcement.countDocuments(query);

    res.json({
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single announcement
router.get('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'name email');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Track view
    const hasViewed = announcement.views.some(
      v => v.userId.toString() === req.user.id
    );
    if (!hasViewed) {
      announcement.views.push({ userId: req.user.id });
      await announcement.save();
    }

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create announcement (admin/faculty)
router.post('/', protect, async (req, res) => {
  try {
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const announcement = new Announcement({
      ...req.body,
      author: req.user.id
    });
    await announcement.save();

    // Create notifications for target users
    const User = require('../models/User');
    let targetUsers = [];
    
    if (announcement.scope === 'campus-wide') {
      targetUsers = await User.find({});
    } else if (announcement.scope === 'department') {
      targetUsers = await User.find({ department: announcement.targetDepartment });
    } else if (announcement.scope === 'year') {
      targetUsers = await User.find({ year: announcement.targetYear });
    } else if (announcement.scope === 'role') {
      targetUsers = await User.find({ role: announcement.targetRole });
    }

    // Create notifications
    const notifications = targetUsers.map(user => ({
      userId: user._id,
      title: announcement.title,
      message: announcement.content.substring(0, 100),
      type: 'announcement',
      category: announcement.priority === 'urgent' ? 'urgent' : 'info',
      link: `/announcements/${announcement._id}`,
      metadata: { announcementId: announcement._id }
    }));

    await Notification.insertMany(notifications);

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      targetUsers.forEach(user => {
        io.to(user._id.toString()).emit('announcement', announcement);
      });
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update announcement
router.patch('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(announcement, req.body);
    await announcement.save();

    res.json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete announcement
router.delete('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    announcement.isActive = false;
    await announcement.save();

    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

