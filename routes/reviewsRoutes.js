const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');
const reviewsController = require('./../controllers/reviewsController');

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
