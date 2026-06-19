const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { protect } = require('../middleware/auth');

// Get directory (searchable)
router.get('/', protect, async (req, res) => {
  try {
    const { search, department, role, year, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (role) query.role = role;
    if (year) query.year = year;

    const users = await User.find(query)
      .select('name email role department year studentId avatar')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get faculty details for faculty members
    const facultyIds = users.filter(u => u.role === 'faculty').map(u => u._id);
    const facultyDetails = await Faculty.find({ userId: { $in: facultyIds } })
      .select('userId designation cabin contact');

    const usersWithDetails = users.map(user => {
      const facultyDetail = facultyDetails.find(f => f.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        faculty: facultyDetail || null
      };
    });

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithDetails,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user profile
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email role department year studentId avatar createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let faculty = null;
    if (user.role === 'faculty') {
      faculty = await Faculty.findOne({ userId: user._id })
        .select('designation cabin contact availability');
    }

    res.json({
      ...user.toObject(),
      faculty
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

