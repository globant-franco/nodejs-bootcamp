const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.getReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);

// this middleware function is to set the nested route
// params and make them available to the createReview action
exports.setTourAndUserId = (req, res, next) => {
  // This is a nested route but we also need to give support
  // if you want to explicitly pass the tourId
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // req.user comes from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
