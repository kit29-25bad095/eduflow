const LessonProgress = require('../models/LessonProgress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { createNotification } = require('../services/notificationService');

// @desc    Mark a lesson as completed
// @route   POST /api/progress/lesson/:lessonId/complete
// @access  Private/Student
exports.completeLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent = 0 } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }

    const courseId = lesson.course;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course',
        errorCode: 'NOT_ENROLLED',
      });
    }

    // Upsert LessonProgress
    const progressRecord = await LessonProgress.findOneAndUpdate(
      {
        student: req.user._id,
        lesson: lesson._id,
      },
      {
        student: req.user._id,
        course: courseId,
        lesson: lesson._id,
        completed: true,
        completedAt: new Date(),
        $inc: { timeSpent: Number(timeSpent) || 0 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Calculate real progress for this course
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const completedLessons = await LessonProgress.countDocuments({
      student: req.user._id,
      course: courseId,
      completed: true,
    });

    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment last accessed
    enrollment.lastAccessedAt = new Date();

    // Check if 100% completed
    let newlyCompleted = false;
    if (progressPercentage === 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      newlyCompleted = true;

      const course = await Course.findById(courseId);

      // Trigger completion notification
      await createNotification({
        recipient: req.user._id,
        type: 'COMPLETION',
        title: '🎉 Course Completed!',
        message: `Congratulations! You have completed all lessons in "${course?.title || 'the course'}".`,
        relatedEntity: {
          entityType: 'course',
          entityId: courseId,
        },
      });
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Lesson marked as complete',
      data: {
        progressRecord,
        progress: progressPercentage,
        completedLessons,
        totalLessons,
        isCompleted: enrollment.status === 'completed',
        newlyCompleted,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get progress details for a course
// @route   GET /api/progress/course/:courseId
// @access  Private
exports.getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const records = await LessonProgress.find({
      student: req.user._id,
      course: courseId,
      completed: true,
    });

    const completedLessonIds = records.map((r) => r.lesson.toString());
    const completedCount = completedLessonIds.length;
    const progress =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    res.status(200).json({
      success: true,
      data: {
        progress,
        completedLessons: completedCount,
        totalLessons,
        completedLessonIds,
        enrollmentStatus: enrollment ? enrollment.status : 'not_enrolled',
        completedAt: enrollment ? enrollment.completedAt : null,
      },
    });
  } catch (err) {
    next(err);
  }
};
