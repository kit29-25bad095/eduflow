const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  createAssignment,
  getCourseAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

// Optional auth helper
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'online_lms_super_secret_jwt_key_2026'
      );
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Ignore
    }
  }
  next();
};

router.get('/course/:courseId', optionalAuth, getCourseAssignments);
router.get('/:id', protect, getAssignment);
router.post('/', protect, authorize('instructor', 'admin'), createAssignment);
router.put('/:id', protect, authorize('instructor', 'admin'), updateAssignment);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteAssignment);

module.exports = router;
