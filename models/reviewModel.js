// review / rating / createdAt / ref to tour / ref to user

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have review'],
      maxlength: [200, 'A review must have less or equal than 200 characters'],
      minlength: [5, 'A review must have more or equal than 5 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have rating'],
      max: [5, 'A rating must less than 5'],
      min: [1, 'A rating must more than 1'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      // 因为这是一个parent ref，所以不会有列表，只会有一个父元素，所以这里不用[]
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      // required: [true, 'Review must belong to a tour'],
    },
    user: {
      // 因为这是一个parent ref，所以不会有列表，只会有一个父元素，所以这里不用[]
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  // 这里不填充tour是因为：这部分的数据对于我们获取评论信息没有用处，所以注释，可以根据业务需求进行调整
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuality: stats[0].nRating,
      ratingAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuality: 0,
      ratingAverage: 4.5,
    });
  }

  console.log(stats);
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // 目标是获取当前review document的权限，但目前的this是当前的query权限
  this.r = await this.model.findOne(this.getQuery()); // 我们可以先执行一个query操作，这会返回给我们一个正在处理的document
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
