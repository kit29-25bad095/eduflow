const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Public / Private (Preview or Enrolled)
exports.getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }

    // Check preview status or enrollment
    if (!lesson.isPreview) {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to view this lesson',
          errorCode: 'UNAUTHENTICATED',
        });
      }

      if (req.user.role === 'student') {
        const isEnrolled = await Enrollment.findOne({
          student: req.user._id,
          course: lesson.course,
        });

        if (!isEnrolled) {
          return res.status(403).json({
            success: false,
            message: 'You must enroll in this course to access this lesson',
            errorCode: 'ENROLLMENT_REQUIRED',
          });
        }
      }
    }

    let progress = null;
    if (req.user) {
      progress = await LessonProgress.findOne({
        student: req.user._id,
        lesson: lesson._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...lesson.toObject(),
        progress,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new lesson in module
// @route   POST /api/lessons
// @access  Private/Instructor/Admin
exports.createLesson = async (req, res, next) => {
  try {
    const {
      moduleId,
      courseId,
      title,
      description,
      videoUrl,
      content,
      resources,
      duration,
      order,
      isPreview,
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add lessons to this course',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const currentCount = await Lesson.countDocuments({ module: moduleId });

    const lesson = await Lesson.create({
      module: moduleId,
      course: courseId,
      title,
      description: description || '',
      videoUrl: videoUrl || '',
      content: content || '',
      resources: resources || [],
      duration: duration || 10,
      order: order !== undefined ? order : currentCount,
      isPreview: Boolean(isPreview),
    });

    await Module.findByIdAndUpdate(moduleId, {
      $push: { lessons: lesson._id },
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Instructor/Admin
exports.updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }

    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this lesson',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Instructor/Admin
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }

    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lesson',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    await Module.findByIdAndUpdate(lesson.module, {
      $pull: { lessons: lesson._id },
    });

    await LessonProgress.deleteMany({ lesson: lesson._id });
    await lesson.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
