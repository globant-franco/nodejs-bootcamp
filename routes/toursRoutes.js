const express = require('express');
const tourRouter = express.Router(); // this is a middleware
const toursController = require('./../controllers/toursController');
const authController = require('./../controllers/authController');
const reviewsController = require('../controllers/reviewsController');

//tourRouter.param('id', toursController.checkID);

tourRouter
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getTours);

tourRouter.route('/tour-stats').get(toursController.getTourStats);
tourRouter.route('/monthly-plan/:year').get(toursController.getMonthlyPlan);

tourRouter
  .route('/')
  .get(authController.protect, toursController.getTours)
  .post(toursController.createTour);

tourRouter
  .route('/:id')
  .get(toursController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour
  )
  .patch(toursController.updateTour);

tourRouter
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewsController.createReview
  );

module.exports = tourRouter;
