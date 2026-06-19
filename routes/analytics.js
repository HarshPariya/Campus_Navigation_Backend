const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Event = require('../models/Event');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Maintenance = require('../models/Maintenance');
const { protect } = require('../middleware/auth');

// Get analytics dashboard (admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // User statistics
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Room statistics
    const totalRooms = await Room.countDocuments();
    const roomsByType = await Room.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const avgOccupancy = await Room.aggregate([
      { $group: { _id: null, avg: { $avg: '$currentOccupancy' } } }
    ]);

    // Event statistics
    const totalEvents = await Event.countDocuments(dateFilter);
    const eventsByCategory = await Event.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const upcomingEvents = await Event.countDocuments({
      ...dateFilter,
      status: 'upcoming',
      date: { $gte: new Date() }
    });

    // Feedback statistics
    const totalFeedback = await Feedback.countDocuments(dateFilter);
    const avgRating = await Feedback.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    // Maintenance statistics
    const totalMaintenance = await Maintenance.countDocuments(dateFilter);
    const maintenanceByStatus = await Maintenance.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Popular rooms (by bookings)
    const popularRooms = await Room.aggregate([
      { $project: { name: 1, bookingsCount: { $size: '$bookings' } } },
      { $sort: { bookingsCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole
      },
      rooms: {
        total: totalRooms,
        byType: roomsByType,
        avgOccupancy: avgOccupancy[0]?.avg || 0,
        popular: popularRooms
      },
      events: {
        total: totalEvents,
        byCategory: eventsByCategory,
        upcoming: upcomingEvents
      },
      feedback: {
        total: totalFeedback,
        avgRating: avgRating[0]?.avg || 0
      },
      maintenance: {
        total: totalMaintenance,
        byStatus: maintenanceByStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

