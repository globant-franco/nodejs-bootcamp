const express = require('express');
const authController = require('./../controllers/authController');
const reviewsController = require('./../controllers/reviewsController');

// By default each router only have access to the params of their specific routes
// By setting mergeParams to true we have access to the params of the nested routes,
// in the case of the tourRoutes we'll have access to the :tourId param for routes like
// /api/v1/tours/:tourId/reviews
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authController.protect, reviewsController.getReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewsController.createReview
  );

router.route('/:id').get(authController.protect, reviewsController.getReview);

module.exports = router;
