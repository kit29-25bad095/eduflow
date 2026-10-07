const express = require('express');
const router = express.Router();
const {
  completeLesson,
  getCourseProgress,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/lesson/:lessonId/complete', completeLesson);
router.get('/course/:courseId', getCourseProgress);

module.exports = router;
