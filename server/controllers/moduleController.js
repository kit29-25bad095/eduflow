const Module = require('../models/Module');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// @desc    Create new module in course
// @route   POST /api/modules
// @access  Private/Instructor/Admin
exports.createModule = async (req, res, next) => {
  try {
    const { courseId, title, description, order } = req.body;

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
        message: 'Not authorized to add modules to this course',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const currentModuleCount = await Module.countDocuments({ course: courseId });

    const newModule = await Module.create({
      course: courseId,
      title,
      description: description || '',
      order: order !== undefined ? order : currentModuleCount,
    });

    course.modules.push(newModule._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: newModule,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private/Instructor/Admin
exports.updateModule = async (req, res, next) => {
  try {
    const moduleItem = await Module.findById(req.params.id);
    if (!moduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
        errorCode: 'MODULE_NOT_FOUND',
      });
    }

    const course = await Course.findById(moduleItem.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this module',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const updated = await Module.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private/Instructor/Admin
exports.deleteModule = async (req, res, next) => {
  try {
    const moduleItem = await Module.findById(req.params.id);
    if (!moduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
        errorCode: 'MODULE_NOT_FOUND',
      });
    }

    const course = await Course.findById(moduleItem.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this module',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    // Delete associated lessons
    await Lesson.deleteMany({ module: moduleItem._id });

    // Remove module from course
    await Course.findByIdAndUpdate(moduleItem.course, {
      $pull: { modules: moduleItem._id },
    });

    await moduleItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Module and its lessons deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
