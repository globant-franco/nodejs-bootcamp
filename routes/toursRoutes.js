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
