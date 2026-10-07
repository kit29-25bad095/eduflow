const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');

// @desc    Get courses with search, filters, pagination
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const {
      search,
      category,
      level,
      language,
      minPrice,
      maxPrice,
      status,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // By default, public catalog only shows published courses
    if (status && (req.user?.role === 'admin' || req.user?.role === 'instructor')) {
      query.status = status;
    } else {
      query.status = 'published';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (level && level !== 'All Levels') {
      query.level = level;
    }

    if (language && language !== 'All') {
      query.language = language;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortOptions = {};
    if (sort === 'popular') {
      sortOptions = { enrolledCount: -1 };
    } else if (sort === 'rating') {
      sortOptions = { 'rating.average': -1, 'rating.count': -1 };
    } else if (sort === 'price-asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOptions = { price: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('instructor', 'name profileImage bio')
      .populate({
        path: 'modules',
        populate: { path: 'lessons', select: 'title duration isPreview' },
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: courses,
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

// @desc    Get single course by ID or slug
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

    const course = await Course.findOne(query)
      .populate('instructor', 'name email profileImage bio skills')
      .populate({
        path: 'modules',
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          options: { sort: { order: 1 } },
        },
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    // Get assignment count for this course
    const assignmentCount = await Assignment.countDocuments({ course: course._id });

    // Check if current user is enrolled (if authenticated)
    let isEnrolled = false;
    let enrollmentDetails = null;
    if (req.user) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
      });
      if (enrollment) {
        isEnrolled = true;
        enrollmentDetails = enrollment;
      }
    }

    const courseObj = course.toObject();
    courseObj.assignmentCount = assignmentCount;
    courseObj.isEnrolled = isEnrolled;
    courseObj.enrollmentDetails = enrollmentDetails;

    res.status(200).json({
      success: true,
      data: courseObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Instructor/Admin
exports.createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      shortDescription,
      thumbnail,
      category,
      level,
      language,
      price,
      duration,
      skills,
      requirements,
      status,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course title, description, and category',
        errorCode: 'MISSING_FIELDS',
      });
    }

    const course = await Course.create({
      title,
      description,
      shortDescription,
      thumbnail: thumbnail || undefined,
      category,
      level: level || 'All Levels',
      language: language || 'English',
      price: price !== undefined ? Number(price) : 0,
      duration: duration || '10 hours',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
      requirements: Array.isArray(requirements) ? requirements : (requirements ? requirements.split(',').map((r) => r.trim()) : []),
      status: status || 'draft',
      instructor: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor/Admin
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
        errorCode: 'UNAUTHORIZED_COURSE_ACCESS',
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor/Admin
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

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
        message: 'Not authorized to delete this course',
        errorCode: 'UNAUTHORIZED_COURSE_ACCESS',
      });
    }

    // Cascade delete associated modules and lessons
    const modules = await Module.find({ course: course._id });
    for (const mod of modules) {
      await Lesson.deleteMany({ module: mod._id });
    }
    await Module.deleteMany({ course: course._id });
    await Assignment.deleteMany({ course: course._id });
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course and related content deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle course status (draft, published, archived)
// @route   PATCH /api/courses/:id/status
// @access  Private/Instructor/Admin
exports.toggleCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const course = await Course.findById(req.params.id);

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
        message: 'Not authorized to change this course status',
        errorCode: 'UNAUTHORIZED_COURSE_ACCESS',
      });
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose draft, published, or archived',
        errorCode: 'INVALID_STATUS',
      });
    }

    course.status = status;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course status changed to ${status}`,
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get instructor courses
// @route   GET /api/courses/instructor/my-courses
// @access  Private/Instructor/Admin
exports.getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('modules')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all distinct categories with counts
// @route   GET /api/courses/meta/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Course.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categories.map((c) => ({ name: c._id, count: c.count })),
    });
  } catch (err) {
    next(err);
  }
};
