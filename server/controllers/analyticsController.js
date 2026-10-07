const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// @desc    Get student analytics
// @route   GET /api/analytics/student
// @access  Private/Student
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Enrollments
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');
    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
    const activeCourses = totalEnrolled - completedCourses;

    // 2. Real progress per course
    let totalProgressSum = 0;
    const courseProgressList = [];

    for (const enr of enrollments) {
      if (!enr.course) continue;
      const totalLessons = await Lesson.countDocuments({ course: enr.course._id });
      const completedLessons = await LessonProgress.countDocuments({
        student: studentId,
        course: enr.course._id,
        completed: true,
      });

      const prog = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      totalProgressSum += prog;

      courseProgressList.push({
        courseId: enr.course._id,
        title: enr.course.title,
        progress: prog,
        completedLessons,
        totalLessons,
        category: enr.course.category,
      });
    }

    const averageProgress = totalEnrolled > 0 ? Math.round(totalProgressSum / totalEnrolled) : 0;

    // 3. Submissions & Grades
    const enrolledCourseIds = enrollments.filter((e) => e.course).map((e) => e.course._id);
    const totalAssignments = await Assignment.countDocuments({ course: { $in: enrolledCourseIds } });
    const mySubmissions = await Submission.find({ student: studentId }).populate('assignment', 'maxMarks');

    const submittedCount = mySubmissions.length;
    const pendingCount = Math.max(0, totalAssignments - submittedCount);

    let totalMarksEarned = 0;
    let totalMaxMarks = 0;
    let gradedCount = 0;

    mySubmissions.forEach((sub) => {
      if (sub.status === 'graded' && sub.marks !== undefined && sub.assignment?.maxMarks) {
        totalMarksEarned += sub.marks;
        totalMaxMarks += sub.assignment.maxMarks;
        gradedCount++;
      }
    });

    const averageGrade =
      totalMaxMarks > 0 ? Math.round((totalMarksEarned / totalMaxMarks) * 100) : 0;

    // 4. Learning hours from LessonProgress
    const progressRecords = await LessonProgress.find({ student: studentId, completed: true });
    const totalMinutesSpent = progressRecords.reduce((acc, curr) => acc + (curr.timeSpent || 15), 0);
    const learningHours = (totalMinutesSpent / 60).toFixed(1);

    // 5. Weekly Activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyRecords = await LessonProgress.find({
      student: studentId,
      completed: true,
      completedAt: { $gte: sevenDaysAgo },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const count = weeklyRecords.filter(
        (r) => r.completedAt && r.completedAt.toISOString().split('T')[0] === dateString
      ).length;

      weeklyActivity.push({
        day: dayNames[d.getDay()],
        date: dateString,
        lessonsCompleted: count,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalEnrolled,
        completedCourses,
        activeCourses,
        averageProgress,
        assignmentsPending: pendingCount,
        assignmentsSubmitted: submittedCount,
        averageGrade,
        learningHours: Number(learningHours),
        courseProgress: courseProgressList,
        weeklyActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get instructor analytics
// @route   GET /api/analytics/instructor
// @access  Private/Instructor/Admin
exports.getInstructorAnalytics = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // Courses
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);
    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.status === 'published').length;

    // Total Students / Enrollments
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });
    const totalEnrollments = enrollments.length;
    const distinctStudents = new Set(enrollments.map((e) => e.student.toString())).size;

    // Submissions
    const submissions = await Submission.find({ course: { $in: courseIds } });
    const totalSubmissions = submissions.length;
    const pendingGrading = submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length;
    const gradedSubmissions = submissions.filter((s) => s.status === 'graded').length;

    // Average Course Rating
    const ratedCourses = courses.filter((c) => c.rating?.count > 0);
    const avgRatingSum = ratedCourses.reduce((acc, c) => acc + (c.rating?.average || 0), 0);
    const averageCourseRating = ratedCourses.length > 0 ? (avgRatingSum / ratedCourses.length).toFixed(1) : '0.0';

    // Course performance data (for charts)
    const coursePerformance = courses.map((c) => ({
      id: c._id,
      title: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
      enrolled: c.enrolledCount || 0,
      rating: c.rating?.average || 0,
      price: c.price,
    }));

    // Enrollment trends (last 6 months or 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentEnrollments = await Enrollment.find({
      course: { $in: courseIds },
      enrolledAt: { $gte: sevenDaysAgo },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const enrollmentTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = recentEnrollments.filter(
        (e) => e.enrolledAt && e.enrolledAt.toISOString().split('T')[0] === dateStr
      ).length;

      enrollmentTrends.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        enrollments: count,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        publishedCourses,
        totalStudents: distinctStudents,
        totalEnrollments,
        totalSubmissions,
        pendingGrading,
        gradedSubmissions,
        averageCourseRating: Number(averageCourseRating),
        coursePerformance,
        enrollmentTrends,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get admin platform analytics
// @route   GET /api/analytics/admin
// @access  Private/Admin
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentsCount = await User.countDocuments({ role: 'student' });
    const instructorsCount = await User.countDocuments({ role: 'instructor' });

    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: 'published' });

    const totalEnrollments = await Enrollment.countDocuments();
    const completedCourses = await Enrollment.countDocuments({ status: 'completed' });

    const totalSubmissions = await Submission.countDocuments();
    const gradedSubmissions = await Submission.countDocuments({ status: 'graded' });

    // Category distribution
    const categoryDistribution = await Course.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // User growth (by month/recent)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.find({ createdAt: { $gte: thirtyDaysAgo } }).select('createdAt role');
    const recentEnrollments = await Enrollment.find({ enrolledAt: { $gte: thirtyDaysAgo } }).select('enrolledAt');

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        studentsCount,
        instructorsCount,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        completedCourses,
        totalSubmissions,
        gradedSubmissions,
        categoryDistribution: categoryDistribution.map((c) => ({
          name: c._id,
          value: c.count,
        })),
        recentStats: {
          newUsersLast30Days: recentUsers.length,
          newEnrollmentsLast30Days: recentEnrollments.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
