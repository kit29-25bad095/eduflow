const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getInstructorCourses,
  getCategories,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Optional auth helper for public endpoints
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
      // Ignore token failure for public routes
    }
  }
  next();
};

router.get('/', optionalAuth, getCourses);
router.get('/meta/categories', getCategories);
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id', optionalAuth, getCourse);

// Mutation routes
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);
router.patch('/:id/status', protect, authorize('instructor', 'admin'), toggleCourseStatus);

module.exports = router;
