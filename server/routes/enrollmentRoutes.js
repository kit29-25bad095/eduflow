const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyEnrolledCourses,
  getAllEnrollments,
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('student', 'admin'), enrollCourse);
router.get('/my-courses', authorize('student', 'admin'), getMyEnrolledCourses);
router.get('/', authorize('admin'), getAllEnrollments);

module.exports = router;
