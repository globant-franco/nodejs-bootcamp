const express = require('express');
const tourRouter = express.Router(); // this is a middleware
const toursController = require('./../controllers/toursController');
const authController = require('./../controllers/authController');
const reviewsRouter = require('./../routes/reviewsRoutes');
// Use this instead of adding nested routes
tourRouter.use('/:tourId/reviews', reviewsRouter);

tourRouter
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getTours);

tourRouter.route('/tour-stats').get(toursController.getTourStats);
tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    toursController.getMonthlyPlan
  );

// Distance is how many miles/kms within the sphere you want to look for a tour
// latlng is the user's current location
// unit can be in miles or in kilometers
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin);

tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(toursController.getDistances);

tourRouter
  .route('/')
  .get(toursController.getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour
  );

tourRouter
  .route('/:id')
  .get(toursController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.uploadTourImages,
    toursController.resizeTourImages,
    toursController.updateTour
  );

// Not elegant solution because it's duplicated in the reviews router
// as well
// tourRouter
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewsController.createReview
//   );

module.exports = tourRouter;
