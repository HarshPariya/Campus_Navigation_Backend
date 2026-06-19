const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');
const { protect } = require('../middleware/auth');

// Get grades (student sees own, faculty sees their courses)
router.get('/', protect, async (req, res) => {
  try {
    const { courseId, semester, year } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    } else if (req.user.role === 'faculty') {
      query.facultyId = req.user.id;
    }

    if (courseId) query.courseId = courseId;
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);

    const grades = await Grade.find(query)
      .populate('studentId', 'name email studentId')
      .populate('courseId', 'courseCode name credits')
      .populate('facultyId', 'name email')
      .sort({ createdAt: -1 });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single grade
router.get('/:id', protect, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('courseId', 'courseCode name credits')
      .populate('facultyId', 'name email');

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    if (req.user.role === 'student' && grade.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/update grade (faculty only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faculty access required' });
    }

    const { studentId, courseId } = req.body;

    let grade = await Grade.findOne({ studentId, courseId });

    if (grade) {
      Object.assign(grade, req.body);
      grade.facultyId = req.user.id;
      await grade.save();
    } else {
      grade = new Grade({
        ...req.body,
        facultyId: req.user.id
      });
      await grade.save();
    }

    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Publish grades
router.patch('/:id/publish', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faculty access required' });
    }

    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    grade.isPublished = true;
    grade.publishedAt = new Date();
    await grade.save();

    // Notify student
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: grade.studentId,
      title: 'Grade Published',
      message: `Your grade for ${grade.courseId} has been published`,
      type: 'system',
      category: 'info',
      link: `/grades/${grade._id}`
    });

    res.json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

