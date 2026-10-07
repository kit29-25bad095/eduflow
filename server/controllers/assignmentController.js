const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const { createNotification } = require('../services/notificationService');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private/Instructor/Admin
exports.createAssignment = async (req, res, next) => {
  try {
    const {
      courseId,
      moduleId,
      title,
      description,
      instructions,
      dueDate,
      maxMarks,
      attachments,
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
        message: 'Not authorized to create assignments for this course',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const assignment = await Assignment.create({
      course: courseId,
      module: moduleId || undefined,
      title,
      description,
      instructions: instructions || '',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      maxMarks: maxMarks !== undefined ? Number(maxMarks) : 100,
      attachments: attachments || [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Public / Private
exports.getCourseAssignments = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const assignments = await Assignment.find({ course: courseId }).sort({ dueDate: 1 });

    // If student is logged in, attach their submission status for each assignment
    if (req.user && req.user.role === 'student') {
      const submissions = await Submission.find({
        course: courseId,
        student: req.user._id,
      });

      const submissionMap = new Map();
      submissions.forEach((sub) => {
        submissionMap.set(sub.assignment.toString(), sub);
      });

      const assignmentsWithSubmission = assignments.map((assign) => {
        const sub = submissionMap.get(assign._id.toString());
        return {
          ...assign.toObject(),
          mySubmission: sub || null,
        };
      });

      return res.status(200).json({
        success: true,
        data: assignmentsWithSubmission,
      });
    }

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single assignment details
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title instructor')
      .populate('module', 'title');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        errorCode: 'ASSIGNMENT_NOT_FOUND',
      });
    }

    let mySubmission = null;
    if (req.user && req.user.role === 'student') {
      mySubmission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...assignment.toObject(),
        mySubmission,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Instructor/Admin
exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        errorCode: 'ASSIGNMENT_NOT_FOUND',
      });
    }

    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this assignment',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Instructor/Admin
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        errorCode: 'ASSIGNMENT_NOT_FOUND',
      });
    }

    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    await Submission.deleteMany({ assignment: assignment._id });
    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
