const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { processUploadedFile } = require('../utils/fileUpload');
const { createNotification } = require('../services/notificationService');
const { emitToUser } = require('../sockets/socketHandler');

// @desc    Submit an assignment
// @route   POST /api/submissions
// @access  Private/Student
exports.submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assignmentId',
        errorCode: 'MISSING_ASSIGNMENT_ID',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a submission file (PDF, DOC, DOCX, ZIP, PNG, JPG)',
        errorCode: 'MISSING_FILE',
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        errorCode: 'ASSIGNMENT_NOT_FOUND',
      });
    }

    const course = await Course.findById(assignment.course);

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to submit assignments',
        errorCode: 'NOT_ENROLLED',
      });
    }

    // Process uploaded file (Cloudinary or local static fallback)
    const fileResult = await processUploadedFile(req.file);

    // Check if late
    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);
    const initialStatus = isLate ? 'late' : 'submitted';

    // Upsert submission (if resubmitting)
    const submission = await Submission.findOneAndUpdate(
      {
        assignment: assignment._id,
        student: req.user._id,
      },
      {
        assignment: assignment._id,
        student: req.user._id,
        course: assignment.course,
        fileUrl: fileResult.url,
        fileName: fileResult.fileName,
        submittedAt: new Date(),
        status: initialStatus,
        marks: undefined,
        feedback: '',
        gradedBy: undefined,
        gradedAt: undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notify instructor
    await createNotification({
      recipient: course.instructor,
      type: 'SUBMISSION',
      title: 'New Assignment Submission',
      message: `${req.user.name} submitted "${assignment.title}" in course "${course.title}".`,
      relatedEntity: {
        entityType: 'submission',
        entityId: submission._id,
      },
    });

    // Real-time event to instructor
    emitToUser(course.instructor, 'new_submission', {
      submissionId: submission._id,
      assignmentTitle: assignment.title,
      studentName: req.user.name,
      courseTitle: course.title,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Grade a submission
// @route   PATCH /api/submissions/:id/grade
// @access  Private/Instructor/Admin
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null || marks === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide marks',
        errorCode: 'MISSING_MARKS',
      });
    }

    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a positive number',
        errorCode: 'INVALID_MARKS',
      });
    }

    const submission = await Submission.findById(req.params.id)
      .populate('assignment')
      .populate('course');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
        errorCode: 'SUBMISSION_NOT_FOUND',
      });
    }

    // Permission check
    if (
      submission.course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this submission',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    // Validate marks <= maxMarks
    if (marksNum > submission.assignment.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks (${marksNum}) cannot exceed maximum allowed marks (${submission.assignment.maxMarks})`,
        errorCode: 'MARKS_EXCEED_MAX',
      });
    }

    submission.marks = marksNum;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    await submission.save();

    // Notify student
    await createNotification({
      recipient: submission.student,
      type: 'GRADE',
      title: 'Assignment Graded',
      message: `Your submission for "${submission.assignment.title}" has been graded: ${marksNum}/${submission.assignment.maxMarks} marks.`,
      relatedEntity: {
        entityType: 'submission',
        entityId: submission._id,
      },
    });

    // Real-time event to student
    emitToUser(submission.student, 'submission_graded', {
      submissionId: submission._id,
      assignmentTitle: submission.assignment.title,
      marks: marksNum,
      maxMarks: submission.assignment.maxMarks,
      feedback: submission.feedback,
    });

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private/Instructor/Admin
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate('course');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        errorCode: 'ASSIGNMENT_NOT_FOUND',
      });
    }

    if (
      assignment.course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these submissions',
        errorCode: 'UNAUTHORIZED_ACCESS',
      });
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email profileImage')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get instructor pending & all submissions across courses
// @route   GET /api/submissions/instructor/submissions
// @access  Private/Instructor/Admin
exports.getInstructorSubmissions = async (req, res, next) => {
  try {
    const instructorCourses = await Course.find({ instructor: req.user.id }).select('_id');
    const courseIds = instructorCourses.map((c) => c._id);

    const submissions = await Submission.find({ course: { $in: courseIds } })
      .populate('assignment', 'title dueDate maxMarks')
      .populate('student', 'name email profileImage')
      .populate('course', 'title')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current student's submissions
// @route   GET /api/submissions/my-submissions
// @access  Private/Student
exports.getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title dueDate maxMarks')
      .populate('course', 'title thumbnail')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (err) {
    next(err);
  }
};
