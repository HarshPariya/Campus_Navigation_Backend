const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent'
    },
    markedAt: {
      type: Date
    },
    method: {
      type: String,
      enum: ['qr', 'manual', 'auto'],
      default: 'manual'
    }
  }],
  totalStudents: {
    type: Number,
    default: 0
  },
  presentCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.students) {
    this.totalStudents = this.students.length;
    this.presentCount = this.students.filter(s => s.status === 'present' || s.status === 'late').length;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);

