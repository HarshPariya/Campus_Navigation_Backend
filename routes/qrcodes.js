const express = require('express');
const router = express.Router();
const QRCode = require('../models/QRCode');
const { protect } = require('../middleware/auth');

// Generate QR code
router.post('/generate', protect, async (req, res) => {
  try {
    const { type, resourceId, resourceType, metadata, expiresAt } = req.body;

    const qrCode = new QRCode({
      type,
      userId: req.user.id,
      resourceId,
      resourceType,
      metadata,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    await qrCode.save();

    res.status(201).json({
      code: qrCode.code,
      qrCode: qrCode,
      qrUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/qr/${qrCode.code}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's QR codes
router.get('/my-codes', protect, async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const query = { userId: req.user.id };

    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const codes = await QRCode.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Scan QR code
router.post('/scan/:code', protect, async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code });

    if (!qrCode) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (!qrCode.isActive) {
      return res.status(400).json({ message: 'QR code is no longer active' });
    }

    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      qrCode.isActive = false;
      await qrCode.save();
      return res.status(400).json({ message: 'QR code has expired' });
    }

    // Check permissions based on type
    if (qrCode.type === 'room-access' && req.user.role !== 'admin' && req.user.role !== 'faculty') {
      if (qrCode.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Mark as scanned
    qrCode.scannedAt = new Date();
    qrCode.scannedBy = req.user.id;
    await qrCode.save();

    res.json({
      valid: true,
      type: qrCode.type,
      metadata: qrCode.metadata,
      resourceId: qrCode.resourceId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get QR code details
router.get('/:code', protect, async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code })
      .populate('userId', 'name email')
      .populate('scannedBy', 'name email');

    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Only owner or admin can view
    if (qrCode.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(qrCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

