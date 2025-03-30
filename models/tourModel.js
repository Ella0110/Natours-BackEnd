const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium and difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'A rating must less than 5'],
      min: [1, 'A rating must more than 1'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuality: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // 用于删除字符串开头和结尾的多余空格
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true, // 用于删除字符串开头和结尾的多余空格
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a imageCover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secreTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // 这里应该输入经度在前维度在后的array
      address: String,
      description: String,
    },
    locations: [
      // 这里是一个array，说明它是嵌入在tours中的一个model
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], // 这里应该输入经度在前维度在后的array
        address: String,
        description: String,
        day: Number, // 人们开始tour的那一天
      },
    ],
    // guides: Array,
    guides: [
      {
        type: mongoose.Schema.ObjectId, // 表示type是ObjectId
        ref: 'User', // 引用到User
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 使用index 优化查找效率
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // 这里的tour是reviewModel.schema中父引用tour字段
  localField: '_id', // 这里的_id是当前也就是tourSchema与review引用连接在一起的字段
  // 他们俩连起来看就是在本地tourSchema中是_id，但在reviewSchema中是tour，他们俩是等价的
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// // Embedding user document to tour document
// tourSchema.pre('save', async function (next) {
//   const guidePromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromise);
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// // QUERY MIDDLEWARE: runs before .find()
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secreTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`find middleware took ${Date.now() - this.start} milliseconds`);
//   // console.log(doc);
//   next();
// });

// // AGGREGATE MIDDLEWARE: runs before .aggregate()
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secreTour: { $ne: true } } });
  // this.find({ secreTour: { $ne: true } });
  // this.start = Date.now();
  console.log(this);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
