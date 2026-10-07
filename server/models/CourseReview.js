const mongoose = require('mongoose');

const courseReviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee one review per student per course
courseReviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Static method to recalculate course rating
courseReviewSchema.statics.calculateAverageRating = async function (courseId) {
  const stats = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const Course = mongoose.model('Course');
  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      rating: {
        average: Math.round(stats[0].averageRating * 10) / 10,
        count: stats[0].ratingCount,
      },
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      rating: { average: 0, count: 0 },
    });
  }
};

courseReviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.course);
});

courseReviewSchema.post('remove', function () {
  this.constructor.calculateAverageRating(this.course);
});

module.exports = mongoose.model('CourseReview', courseReviewSchema);
