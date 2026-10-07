const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const { createNotification } = require('../services/notificationService');

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private/Student
exports.enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId',
        errorCode: 'MISSING_COURSE_ID',
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

    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll in an unpublished course',
        errorCode: 'COURSE_NOT_PUBLISHED',
      });
    }

    // Check duplicate enrollment
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
        errorCode: 'ALREADY_ENROLLED',
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
    });

    // Update course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrolledCount: 1 },
    });

    // Notify student
    await createNotification({
      recipient: req.user._id,
      type: 'ENROLLMENT',
      title: 'Course Enrollment Confirmed',
      message: `You have successfully enrolled in "${course.title}". Start learning now!`,
      relatedEntity: {
        entityType: 'course',
        entityId: course._id,
      },
    });

    // Notify instructor
    await createNotification({
      recipient: course.instructor,
      type: 'ENROLLMENT',
      title: 'New Student Enrolled',
      message: `${req.user.name} has enrolled in your course "${course.title}".`,
      relatedEntity: {
        entityType: 'course',
        entityId: course._id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get enrolled courses for student with real progress
// @route   GET /api/enrollments/my-courses
// @access  Private/Student
exports.getMyEnrolledCourses = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name profileImage' },
      })
      .sort({ lastAccessedAt: -1 });

    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enr) => {
        if (!enr.course) return null;

        const totalLessons = await Lesson.countDocuments({ course: enr.course._id });
        const completedLessons = await LessonProgress.countDocuments({
          student: req.user._id,
          course: enr.course._id,
          completed: true,
        });

        const progress =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          enrollmentId: enr._id,
          enrolledAt: enr.enrolledAt,
          status: enr.status,
          lastAccessedAt: enr.lastAccessedAt,
          completedAt: enr.completedAt,
          progress,
          completedLessons,
          totalLessons,
          course: enr.course,
        };
      })
    );

    const filtered = coursesWithProgress.filter((item) => item !== null);

    res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enrollments (Admin)
// @route   GET /api/enrollments
// @access  Private/Admin
exports.getAllEnrollments = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Enrollment.countDocuments();
    const enrollments = await Enrollment.find()
      .populate('student', 'name email profileImage')
      .populate('course', 'title category price thumbnail')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};
