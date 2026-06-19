const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const QRCode = require('../models/QRCode');
const { protect } = require('../middleware/auth');

// Get attendance records
router.get('/', protect, async (req, res) => {
  try {
    const { courseId, date, studentId } = req.query;
    const query = {};

    if (courseId) query.courseId = courseId;
    if (date) query.date = new Date(date);
    if (studentId) query['students.studentId'] = studentId;

    // Students can only see their own attendance
    if (req.user.role === 'student') {
      query['students.studentId'] = req.user.id;
    }

    const records = await Attendance.find(query)
      .populate('courseId', 'courseCode name')
      .populate('facultyId', 'name')
      .populate('students.studentId', 'name email studentId')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create attendance session (faculty only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faculty access required' });
    }

    const { courseId, roomId, date, startTime, endTime } = req.body;

    // Generate QR code for attendance
    const qrCode = new QRCode({
      type: 'attendance',
      userId: req.user.id,
      resourceId: courseId,
      resourceType: 'Course',
      metadata: {
        courseId,
        roomId,
        date,
        startTime,
        endTime
      },
      expiresAt: new Date(new Date(date).setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0))
    });
    await qrCode.save();

    // Get enrolled students
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const students = course.enrolledStudents.map(studentId => ({
      studentId,
      status: 'absent'
    }));

    const attendance = new Attendance({
      sessionId: qrCode.code,
      courseId,
      roomId,
      facultyId: req.user.id,
      date: new Date(date),
      startTime,
      endTime,
      qrCode: qrCode.code,
      students
    });

    await attendance.save();

    res.status(201).json({
      attendance,
      qrCode: qrCode.code,
      qrUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/qr/${qrCode.code}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark attendance via QR code
router.post('/scan/:code', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    const qrCode = await QRCode.findOne({ code: req.params.code, type: 'attendance' });
    if (!qrCode) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (!qrCode.isActive || (qrCode.expiresAt && new Date() > qrCode.expiresAt)) {
      return res.status(400).json({ message: 'QR code expired' });
    }

    const attendance = await Attendance.findOne({ qrCode: req.params.code });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance session not found' });
    }

    const studentRecord = attendance.students.find(
      s => s.studentId.toString() === req.user.id
    );

    if (!studentRecord) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Check if already marked
    if (studentRecord.status === 'present' || studentRecord.status === 'late') {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Determine if late
    const now = new Date();
    const sessionDate = new Date(attendance.date);
    const [hours, minutes] = attendance.startTime.split(':');
    sessionDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const minutesLate = (now - sessionDate) / (1000 * 60);
    studentRecord.status = minutesLate > 15 ? 'late' : 'present';
    studentRecord.markedAt = now;
    studentRecord.method = 'qr';

    await attendance.save();

    res.json({
      success: true,
      status: studentRecord.status,
      message: `Attendance marked as ${studentRecord.status}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Manual attendance marking (faculty only)
router.patch('/:id/mark', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Faculty access required' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendance.facultyId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId, status } = req.body;
    const studentRecord = attendance.students.find(
      s => s.studentId.toString() === studentId
    );

    if (!studentRecord) {
      return res.status(404).json({ message: 'Student not found in this session' });
    }

    studentRecord.status = status;
    studentRecord.markedAt = new Date();
    studentRecord.method = 'manual';

    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

