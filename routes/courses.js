const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { department, semester, year, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('faculty', 'name email')
      .sort({ courseCode: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('enrolledStudents', 'name email studentId')
      .populate('prerequisites', 'courseCode name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get enrolled courses (student)
router.get('/my/enrolled', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    const courses = await Course.find({
      enrolledStudents: req.user.id,
      isActive: true
    })
      .populate('faculty', 'name email')
      .sort({ courseCode: 1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll in course
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    if (course.enrolledStudents.length >= course.maxEnrollment) {
      return res.status(400).json({ message: 'Course is full' });
    }

    // Check prerequisites
    if (course.prerequisites.length > 0) {
      const Grade = require('../models/Grade');
      const completedCourses = await Grade.find({
        studentId: req.user.id,
        grade: { $ne: 'F' }
      }).distinct('courseId');

      const missingPrereqs = course.prerequisites.filter(
        prereq => !completedCourses.includes(prereq.toString())
      );

      if (missingPrereqs.length > 0) {
        return res.status(400).json({
          message: 'Prerequisites not met',
          missingPrerequisites: missingPrereqs
        });
      }
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create course (admin/faculty)
router.post('/', protect, async (req, res) => {
  try {
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = new Course(req.body);
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update course
router.patch('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && !course.faculty.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(course, req.body);
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

