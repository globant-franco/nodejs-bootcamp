const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, "Can't be empty"] },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      // Parent referencing
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      // Parent referencing
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate tour and user fields on find* methods
reviewSchema.pre(/^find/, function (next) {
  // turn this off for now, because it keeps nesting child objects
  // e.g. it also populates the guides, check the Tour model `pre find`
  // hook for more info.
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // })

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  // this points to the current model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', // group results by tourId
        nRating: { $sum: 1 }, //for each review that matches that tour add 1
        avgRating: { $avg: '$rating' }, // compute the average rating for each review
      },
    },
  ]);
  // store new stats in the corresponding tour corresponding to the review
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0, // this is default value
      ratingsAverage: 4.5, // this is default value
    });
  }
};

// Let's compute stats also when review is deleted
// Basically the stats must be updated when calling findByIdAndUpdate and findByIdAndDelete
// both run behind the scenes findOneAndUpdate and findOneAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // `this` points to the current query, since document hasn't been saved yet then because we're just querying then
  // we're not having access to the incoming changes, therefore we can't compute the statistics.
  // So we're gonna make this little trick to pass the review query object to the next middlware
  // to get the tourId AKA review.tour
  this.reviewBeforeSave = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.reviewBeforeSave.constructor.calcAverageRating(
    this.reviewBeforeSave.tour
  );
});

// called every time we create a NEW review (this doesn't run when updating!), compute the review stats
reviewSchema.post('save', function () {
  // `this` points to the current review
  // Review is not available at this point because we need to create first the model
  // as mongoose.model(.....) and pass the schema, so in order to call a class method
  // we do: this.constructor
  // remember that in express order of declaration matters, it runs secuentally
  this.constructor.calcAverageRating(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
