const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      trim: true,
      unique: true,
      maxLength: [40, 'The tour must have less than or equal to 40 characters'],
      minLength: [10, 'The tour must have more than or equal to 10 characters'],
      // validator: [ // just for demo purposes
      //   validator.isAlpha,
      //   'Tour name can only contain alpha characters',
      // ],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          // This function must either return true or false
          // true means the validation passed
          // `this` keyword only applies to NEW documents creation, not updating
          // This only works on CREATE and SAVE!
          return value < this.price;
        },
        message: 'Discount price -{VALUE}- should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // means exclude this field from the results
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// the .get means that it will be computed every time we get data from the database, treat get as getters
// Don't use arrow functions here because you won't have access to the .this
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Mongo middleware is also called pre-post hooks (in rails callbacks)
// for types of middleware: document, query, aggregate and model

// 1) Document middleware
// pre save runs ONLY before .save and .create, NOT insertMany calls, or findByIdAndUpdate, and so on
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// You can have multiple pre save hooks
// tourSchema.pre('save', function (next) {
//   console.log('About to save the tour...');
//   next();
// });

// doc is the document that was saved to the DB
tourSchema.post('save', function (doc, next) {
  console.log('After save Tour: ', doc);
  next();
});

// 2) Query middleware
// Filter out tours that are secret
// With regular expressions we account for findOne, findOneAndUpdate
// findOneAndRemove, findOneAndDelete and so on
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now(); // you can set any property you want because this is just an object
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.startTime} milliseconds`);
  next();
});

// 3) Aggregate middleware
// Let's hide the secret tour from the aggregation we have for getting the
// the tours aggregated by month and the overall stats
tourSchema.pre('aggregate', function (next) {
  // `this` points to the current aggregation object
  console.log('aggregation pipeline is: ', this.pipeline());
  // unshift adds element to the beginning of the pipeline array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
