const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get all study groups
router.get('/', protect, async (req, res) => {
  try {
    const { search, subject, page = 1, limit = 20 } = req.query;
    const query = { isPublic: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    if (subject) query.subject = subject;

    const groups = await StudyGroup.find(query)
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudyGroup.countDocuments(query);

    res.json({
      groups,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's study groups
router.get('/my-groups', protect, async (req, res) => {
  try {
    const groups = await StudyGroup.find({
      $or: [
        { createdBy: req.user.id },
        { 'members.userId': req.user.id }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single group
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email')
      .populate('sessions.attendees', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create study group
router.post('/', protect, async (req, res) => {
  try {
    const group = new StudyGroup({
      ...req.body,
      createdBy: req.user.id,
      members: [{
        userId: req.user.id,
        role: 'admin'
      }]
    });
    await group.save();

    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Join study group
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    const isMember = group.members.some(
      m => m.userId.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ message: 'Already a member' });
    }

    group.members.push({
      userId: req.user.id,
      role: 'member'
    });

    await group.save();

    // Notify group admin
    await Notification.create({
      userId: group.createdBy,
      title: 'New Member Joined',
      message: `${req.user.name} joined ${group.name}`,
      type: 'system',
      category: 'info'
    });

    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Leave study group
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (group.createdBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'Creator cannot leave group' });
    }

    group.members = group.members.filter(
      m => m.userId.toString() !== req.user.id
    );

    await group.save();

    res.json({ message: 'Left study group successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create study session
router.post('/:id/sessions', protect, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const isMember = group.members.some(
      m => m.userId.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    group.sessions.push({
      ...req.body,
      attendees: [req.user.id]
    });

    await group.save();

    // Notify all members
    const notifications = group.members
      .filter(m => m.userId.toString() !== req.user.id)
      .map(member => ({
        userId: member.userId,
        title: 'New Study Session',
        message: `${req.user.name} scheduled a session in ${group.name}`,
        type: 'event',
        category: 'info',
        link: `/study-groups/${group._id}`
      }));

    await Notification.insertMany(notifications);

    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

