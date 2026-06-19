const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignments: [{
    name: {
      type: String,
      required: true
    },
    maxMarks: {
      type: Number,
      required: true
    },
    obtainedMarks: {
      type: Number,
      required: true
    },
    weightage: {
      type: Number,
      default: 0
    },
    submittedAt: Date,
    gradedAt: Date,
    feedback: String
  }],
  midterm: {
    maxMarks: Number,
    obtainedMarks: Number,
    weightage: {
      type: Number,
      default: 30
    },
    date: Date
  },
  final: {
    maxMarks: Number,
    obtainedMarks: Number,
    weightage: {
      type: Number,
      default: 40
    },
    date: Date
  },
  quizzes: [{
    name: String,
    maxMarks: Number,
    obtainedMarks: Number,
    weightage: {
      type: Number,
      default: 5
    },
    date: Date
  }],
  totalMarks: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', null],
    default: null
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer']
  },
  year: {
    type: Number
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

gradeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total marks
  let total = 0;
  if (this.assignments) {
    this.assignments.forEach(a => {
      total += (a.obtainedMarks / a.maxMarks) * (a.weightage || 0);
    });
  }
  if (this.midterm && this.midterm.obtainedMarks) {
    total += (this.midterm.obtainedMarks / this.midterm.maxMarks) * (this.midterm.weightage || 30);
  }
  if (this.final && this.final.obtainedMarks) {
    total += (this.final.obtainedMarks / this.final.maxMarks) * (this.final.weightage || 40);
  }
  if (this.quizzes) {
    this.quizzes.forEach(q => {
      total += (q.obtainedMarks / q.maxMarks) * (q.weightage || 5);
    });
  }
  this.totalMarks = total;
  
  // Calculate grade and GPA
  if (total >= 90) {
    this.grade = 'A+';
    this.gpa = 4.0;
  } else if (total >= 85) {
    this.grade = 'A';
    this.gpa = 3.7;
  } else if (total >= 80) {
    this.grade = 'A-';
    this.gpa = 3.3;
  } else if (total >= 75) {
    this.grade = 'B+';
    this.gpa = 3.0;
  } else if (total >= 70) {
    this.grade = 'B';
    this.gpa = 2.7;
  } else if (total >= 65) {
    this.grade = 'B-';
    this.gpa = 2.3;
  } else if (total >= 60) {
    this.grade = 'C+';
    this.gpa = 2.0;
  } else if (total >= 55) {
    this.grade = 'C';
    this.gpa = 1.7;
  } else if (total >= 50) {
    this.grade = 'C-';
    this.gpa = 1.3;
  } else if (total >= 45) {
    this.grade = 'D';
    this.gpa = 1.0;
  } else {
    this.grade = 'F';
    this.gpa = 0.0;
  }
  
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);

