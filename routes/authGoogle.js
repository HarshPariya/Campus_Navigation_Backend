const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

const router = express.Router();

// Generate JWT token (same as your login)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/google
// @desc    Login/Register user via Google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID token is required' });
    }

    // 1️⃣ Verify token with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(idToken);

    const googleUid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name || 'Google User';
    const picture = decoded.picture;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account does not provide an email'
      });
    }

    // 2️⃣ Find user by googleUid or email
    let user = await User.findOne({
      $or: [{ googleUid }, { email }]
    });

    // 3️⃣ If user does NOT exist → create new user
    if (!user) {
      user = await User.create({
        name,
        email,
        googleUid,
         avatar: picture,
        role: 'student',      // Default role
        
      });
    }

    // 4️⃣ If user exists but googleUid is missing → add it
    if (!user.googleUid) {
      user.googleUid = googleUid;
        if (!user.avatar && picture) {
    user.avatar = picture;
  }
      await user.save();
    }

    // 5️⃣ Create JWT token for your system
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        year: user.year,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

module.exports = router;
