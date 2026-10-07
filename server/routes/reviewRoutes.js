const express = require('express');
const router = express.Router();
const { addReview, getCourseReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/course/:courseId', getCourseReviews);
router.post('/', protect, addReview);

module.exports = router;
