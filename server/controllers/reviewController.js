const CourseReview = require('../models/CourseReview');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Add review to course
// @route   POST /api/reviews
// @access  Private/Student
exports.addReview = async (req, res, next) => {
  try {
    const { courseId, rating, comment } = req.body;

    if (!courseId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId and rating (1-5)',
        errorCode: 'MISSING_FIELDS',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    // Must be enrolled to review
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You can only review courses you are enrolled in',
        errorCode: 'REVIEW_NOT_PERMITTED',
      });
    }

    // Upsert review
    const review = await CourseReview.findOneAndUpdate(
      { course: courseId, student: req.user._id },
      { rating: Number(rating), comment: comment || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate average rating
    await CourseReview.calculateAverageRating(courseId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reviews for a course
// @route   GET /api/reviews/course/:courseId
// @access  Public
exports.getCourseReviews = async (req, res, next) => {
  try {
    const reviews = await CourseReview.find({ course: req.params.courseId })
      .populate('student', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};
