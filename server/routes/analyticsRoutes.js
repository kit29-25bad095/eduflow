const express = require('express');
const router = express.Router();
const {
  getStudentAnalytics,
  getInstructorAnalytics,
  getAdminAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student', authorize('student', 'admin'), getStudentAnalytics);
router.get('/instructor', authorize('instructor', 'admin'), getInstructorAnalytics);
router.get('/admin', authorize('admin'), getAdminAnalytics);

module.exports = router;
